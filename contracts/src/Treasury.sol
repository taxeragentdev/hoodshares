// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Holds every ETH inflow the protocol produces and keeps it split
/// into four internal buckets so no single withdrawal can quietly drain the
/// prize pool. The split ratio depends on *where* the ETH came from, not on
/// a single global percentage:
///
///  - Primary mint revenue  -> 60% prize pool / 30% buyback and burn / 5% development / 5% growth
///  - Secondary royalties   -> 50% prize pool / 50% development
///  - Contest ticket fees   -> 100% prize pool (recycled, never withdrawn as revenue)
///
/// The prize pool bucket only ever leaves this contract through
/// `fundRewardEpoch`, which pushes it to a `RewardDistributor` for a Merkle
/// claim — it is never sent to an arbitrary address.
///
/// The `owner` is expected to be a multisig (e.g. a Safe), never a single key.
contract Treasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant BPS_DENOMINATOR = 10_000;

    uint256 public constant MINT_PRIZE_BPS = 6_000;
    uint256 public constant MINT_BUYBACK_BPS = 3_000;
    uint256 public constant MINT_DEVELOPMENT_BPS = 500;
    uint256 public constant MINT_GROWTH_BPS = 500;

    uint256 public constant ROYALTY_PRIZE_BPS = 5_000;
    uint256 public constant ROYALTY_DEVELOPMENT_BPS = 5_000;

    /// @notice Contracts allowed to call the tagged deposit functions —
    /// the NFT collection (mint revenue) and any marketplace/royalty router
    /// integration. Plain ETH transfers from anyone else are treated as
    /// royalty income by default via `receive()`.
    mapping(address => bool) public isMintSource;

    /// @notice Contracts allowed to call `depositTicketRevenue` — the entry
    /// ticket collection. Kept separate from `isMintSource` because ticket
    /// revenue is tagged for buyback, not the mint-revenue split below.
    mapping(address => bool) public isTicketSource;

    uint256 public prizePoolBalance;
    uint256 public developmentBalance;
    uint256 public growthBalance;
    uint256 public reserveBalance;

    /// @notice ETH tagged for HOOD buyback and burn. Mint revenue sends 30%
    /// here. Entry-ticket ETH still lands 100% here via `depositTicketRevenue`.
    /// Spent only through `executeBuyback`.
    uint256 public buybackBalance;

    address public rewardDistributor;

    event MintSourceUpdated(address indexed source, bool allowed);
    event TicketSourceUpdated(address indexed source, bool allowed);
    event RewardDistributorUpdated(address indexed distributor);
    event MintRevenueDeposited(uint256 amount, uint256 toPrizePool, uint256 toBuyback, uint256 toDevelopment, uint256 toGrowth);
    event RoyaltyDeposited(uint256 amount, uint256 toPrizePool, uint256 toDevelopment);
    event TicketDeposited(uint256 amount);
    event TicketRevenueDeposited(uint256 amount);
    event RewardEpochFunded(uint256 amount);
    event Withdrawn(string bucket, address indexed to, uint256 amount);
    event BuybackExecuted(address indexed target, uint256 ethAmount);
    event TokenWithdrawn(address indexed token, address indexed to, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ---------------------------------------------------------------------
    // Tagged deposits
    // ---------------------------------------------------------------------

    /// @notice Called by the NFT collection with the exact mint payment.
    function depositMintRevenue() external payable {
        require(isMintSource[msg.sender], "not a mint source");
        uint256 toPrize = (msg.value * MINT_PRIZE_BPS) / BPS_DENOMINATOR;
        uint256 toBuyback = (msg.value * MINT_BUYBACK_BPS) / BPS_DENOMINATOR;
        uint256 toDev = (msg.value * MINT_DEVELOPMENT_BPS) / BPS_DENOMINATOR;
        uint256 toGrowth = (msg.value * MINT_GROWTH_BPS) / BPS_DENOMINATOR;
        toGrowth += msg.value - toPrize - toBuyback - toDev - toGrowth;

        prizePoolBalance += toPrize;
        buybackBalance += toBuyback;
        developmentBalance += toDev;
        growthBalance += toGrowth;

        emit MintRevenueDeposited(msg.value, toPrize, toBuyback, toDev, toGrowth);
    }

    /// @notice Ticket fees from Duels and the Prediction Cup are recycled
    /// straight back into the prize pool rather than counted as revenue.
    function depositContestTicket() external payable {
        prizePoolBalance += msg.value;
        emit TicketDeposited(msg.value);
    }

    /// @notice ETH paid for the entry-ticket NFT — the pass required to
    /// open packs and play a round. All of it is buyback-tagged; see
    /// `buybackBalance`.
    function depositTicketRevenue() external payable {
        require(isTicketSource[msg.sender], "not a ticket source");
        buybackBalance += msg.value;
        emit TicketRevenueDeposited(msg.value);
    }

    /// @notice Catch-all for marketplaces that pay ERC-2981 royalties as a
    /// plain ETH transfer with no function selector.
    receive() external payable {
        uint256 toPrize = (msg.value * ROYALTY_PRIZE_BPS) / BPS_DENOMINATOR;
        uint256 toDev = msg.value - toPrize;
        prizePoolBalance += toPrize;
        developmentBalance += toDev;
        emit RoyaltyDeposited(msg.value, toPrize, toDev);
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setMintSource(address source, bool allowed) external onlyOwner {
        isMintSource[source] = allowed;
        emit MintSourceUpdated(source, allowed);
    }

    function setTicketSource(address source, bool allowed) external onlyOwner {
        isTicketSource[source] = allowed;
        emit TicketSourceUpdated(source, allowed);
    }

    function setRewardDistributor(address distributor) external onlyOwner {
        rewardDistributor = distributor;
        emit RewardDistributorUpdated(distributor);
    }

    /// @notice Pushes ETH out of the prize pool bucket into the distributor
    /// for a new claimable epoch. This is the *only* path prize pool funds
    /// can leave through — there is no generic "withdraw prize pool" function.
    function fundRewardEpoch(uint256 amount, uint256 epochId, bytes32 merkleRoot) external onlyOwner nonReentrant {
        require(rewardDistributor != address(0), "distributor not set");
        require(amount <= prizePoolBalance, "exceeds prize pool");
        prizePoolBalance -= amount;
        emit RewardEpochFunded(amount);
        (bool success,) = rewardDistributor.call{value: amount}(
            abi.encodeWithSignature("fundEpoch(uint256,bytes32)", epochId, merkleRoot)
        );
        require(success, "fund epoch failed");
    }

    function withdrawDevelopment(address to, uint256 amount) external onlyOwner nonReentrant {
        require(amount <= developmentBalance, "exceeds development balance");
        developmentBalance -= amount;
        _send(to, amount, "development");
    }

    function withdrawGrowth(address to, uint256 amount) external onlyOwner nonReentrant {
        require(amount <= growthBalance, "exceeds growth balance");
        growthBalance -= amount;
        _send(to, amount, "growth");
    }

    function withdrawReserve(address to, uint256 amount) external onlyOwner nonReentrant {
        require(amount <= reserveBalance, "exceeds reserve balance");
        reserveBalance -= amount;
        _send(to, amount, "reserve");
    }

    /// @notice Spends buyback-tagged ETH on an arbitrary call — a DEX
    /// router swap in practice, e.g. a Uniswap Universal Router `execute`
    /// call encoded off-chain by the multisig. Deliberately generic rather
    /// than hard-coded to one router: the token this buys back is launched
    /// externally (a Pons bonding-curve/Uniswap v4 pool), so the exact pool
    /// and router only exist once that launch happens, and either can change
    /// after a graduation or a router upgrade. `onlyOwner` — a multisig
    /// signing arbitrary calldata — is what makes an otherwise-dangerous
    /// generic call acceptable here, the same trust boundary every other
    /// withdraw function in this contract already relies on.
    function executeBuyback(address target, bytes calldata data, uint256 ethAmount)
        external
        onlyOwner
        nonReentrant
    {
        require(target != address(0), "zero target");
        require(ethAmount <= buybackBalance, "exceeds buyback balance");
        buybackBalance -= ethAmount;
        emit BuybackExecuted(target, ethAmount);
        (bool success,) = target.call{value: ethAmount}(data);
        require(success, "buyback call failed");
    }

    /// @notice Moves an ERC-20 balance out of the treasury — what a
    /// completed buyback is for: deciding whether the bought-back token is
    /// held, burned (send `to` a dead address), or routed into reward
    /// distribution is a multisig decision made after the swap, not a
    /// choice this contract should hard-code in advance.
    function withdrawToken(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(to != address(0), "zero recipient");
        IERC20(token).safeTransfer(to, amount);
        emit TokenWithdrawn(token, to, amount);
    }

    function _send(address to, uint256 amount, string memory bucket) private {
        require(to != address(0), "zero recipient");
        emit Withdrawn(bucket, to, amount);
        (bool success,) = to.call{value: amount}("");
        require(success, "transfer failed");
    }

    /// @notice Sum of all five buckets should always equal address(this).balance.
    function totalManaged() external view returns (uint256) {
        return prizePoolBalance + developmentBalance + growthBalance + reserveBalance + buybackBalance;
    }
}
