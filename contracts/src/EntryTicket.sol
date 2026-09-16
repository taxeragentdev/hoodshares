// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Treasury} from "./Treasury.sol";

/// @notice The game's entry gate: a paid ERC-721 required to open packs and
/// play a Daily Lineup round. Holding at least one ticket is the whole
/// entitlement — there is no rarity, no reveal, no per-token metadata split.
/// It exists to do one economic job: every wei it collects is ETH buy
/// pressure on the protocol's own token, deposited straight into
/// `Treasury.depositTicketRevenue` and earmarked for `executeBuyback`. No
/// free claim path exists on purpose — a prior design gave tickets away
/// for free and funded cards from them; this version inverts that so the
/// entry gate itself is the revenue line, and cards are sold separately
/// through packs.
contract EntryTicket is ERC721, Ownable, ReentrancyGuard {
    enum SalePhase {
        Closed,
        Allowlist,
        Public
    }

    uint256 public constant MAX_PER_WALLET = 1;

    Treasury public immutable treasury;

    uint256 public price;
    uint256 public maxSupply;
    SalePhase public salePhase;
    bytes32 public allowlistMerkleRoot;
    string public baseURI;

    uint256 public totalMinted;
    mapping(address => uint256) public mintedBy;

    event SalePhaseUpdated(SalePhase phase);
    event PriceUpdated(uint256 price);
    event MaxSupplyUpdated(uint256 maxSupply);
    event AllowlistRootUpdated(bytes32 root);
    event BaseURIUpdated(string uri);
    event TicketMinted(address indexed to, uint256 indexed tokenId);

    constructor(
        address initialOwner,
        Treasury treasury_,
        uint256 price_,
        uint256 maxSupply_,
        string memory baseURI_
    ) ERC721("HoodPass", "HOODPASS") Ownable(initialOwner) {
        treasury = treasury_;
        price = price_;
        maxSupply = maxSupply_;
        baseURI = baseURI_;
    }

    // ---------------------------------------------------------------------
    // Minting
    // ---------------------------------------------------------------------

    function mintPublic(uint256 quantity) external payable nonReentrant {
        require(salePhase == SalePhase.Public, "public sale closed");
        _mintTickets(msg.sender, quantity);
    }

    function mintAllowlist(uint256 quantity, bytes32[] calldata proof) external payable nonReentrant {
        require(salePhase == SalePhase.Allowlist || salePhase == SalePhase.Public, "allowlist sale closed");
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));
        require(MerkleProof.verify(proof, allowlistMerkleRoot, leaf), "not on allowlist");
        _mintTickets(msg.sender, quantity);
    }

    function _mintTickets(address to, uint256 quantity) private {
        require(quantity == 1, "one pass per wallet");
        require(totalMinted + quantity <= maxSupply, "exceeds max supply");
        require(mintedBy[to] + quantity <= MAX_PER_WALLET, "already minted");
        require(msg.value == price * quantity, "incorrect payment");

        mintedBy[to] += quantity;
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = totalMinted;
            totalMinted += 1;
            _safeMint(to, tokenId);
            emit TicketMinted(to, tokenId);
        }

        treasury.depositTicketRevenue{value: msg.value}();
    }

    /// @notice Whether `wallet` holds at least one ticket — the single
    /// check every pack purchase and round entry gates on.
    function holdsTicket(address wallet) external view returns (bool) {
        return balanceOf(wallet) > 0;
    }

    // ---------------------------------------------------------------------
    // Metadata
    // ---------------------------------------------------------------------

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return baseURI;
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setSalePhase(SalePhase phase) external onlyOwner {
        salePhase = phase;
        emit SalePhaseUpdated(phase);
    }

    function setPrice(uint256 price_) external onlyOwner {
        price = price_;
        emit PriceUpdated(price_);
    }

    /// @notice Deliberately adjustable, unlike the card collection's fixed
    /// `MAX_SUPPLY` — the ticket has no rarity or reveal to protect, so the
    /// team can widen supply if demand for entry outpaces the initial run.
    function setMaxSupply(uint256 maxSupply_) external onlyOwner {
        require(maxSupply_ >= totalMinted, "below current mint count");
        maxSupply = maxSupply_;
        emit MaxSupplyUpdated(maxSupply_);
    }

    function setAllowlistMerkleRoot(bytes32 root) external onlyOwner {
        allowlistMerkleRoot = root;
        emit AllowlistRootUpdated(root);
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        baseURI = uri;
        emit BaseURIUpdated(uri);
    }
}
