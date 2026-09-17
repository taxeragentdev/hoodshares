// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SealedPack} from "./SealedPack.sol";

/// @notice Sells sealed packs paid in HOOD via `buyPacks`. ETH mint is
/// optional (`buyPacksWithEth`) and off by default.
///
/// The payment token is launched outside this repo (a Pons drop on
/// Robinhood Chain). This contract only ever *reads* that address, so it
/// can be pointed at the real token after that launch, or swapped if the
/// token is ever migrated.
///
/// Pulled tokens go straight to the Treasury. How that inventory is split,
/// burned, or paid out is a multisig decision (`Treasury.withdrawToken`).
contract PackShop is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    SealedPack public immutable packs;
    address public immutable treasury;

    IERC20 public paymentToken;
    uint256 public packPrice;
    uint256 public ethPackPrice;
    bool public saleOpen;

    event PaymentTokenUpdated(address token);
    event PackPriceUpdated(uint256 price);
    event EthPackPriceUpdated(uint256 price);
    event SaleOpenUpdated(bool open);
    event PacksBought(address indexed buyer, uint256 packs, uint256 paid);

    constructor(
        address initialOwner,
        SealedPack packs_,
        address treasury_,
        IERC20 paymentToken_,
        uint256 packPrice_
    ) Ownable(initialOwner) {
        require(address(packs_) != address(0), "zero packs");
        require(treasury_ != address(0), "zero treasury");
        packs = packs_;
        treasury = treasury_;
        paymentToken = paymentToken_;
        packPrice = packPrice_;
        ethPackPrice = 0;
    }

    /// @notice Buys `quantity` sealed packs. Pulls `packPrice * quantity` of
    /// the payment token into the treasury and mints that many ERC-1155
    /// packs to the caller. Packs stay sealed until the holder burns them
    /// with `SealedPack.open`.
    function buyPacks(uint256 quantity) external nonReentrant {
        require(saleOpen, "pack sale closed");
        require(address(paymentToken) != address(0), "payment token not set");
        require(quantity > 0, "quantity is zero");
        require(packPrice > 0, "pack price not set");

        uint256 paid = packPrice * quantity;
        paymentToken.safeTransferFrom(msg.sender, treasury, paid);
        packs.mint(msg.sender, quantity);
        emit PacksBought(msg.sender, quantity, paid);
    }

    /// @notice Optional ETH buy. Off unless the owner sets `ethPackPrice`.
    function buyPacksWithEth(uint256 quantity) external payable nonReentrant {
        require(saleOpen, "pack sale closed");
        require(quantity > 0, "quantity is zero");
        require(ethPackPrice > 0, "eth pack price not set");

        uint256 paid = ethPackPrice * quantity;
        require(msg.value == paid, "wrong eth");

        (bool ok, ) = treasury.call{value: paid}("");
        require(ok, "eth transfer failed");
        packs.mint(msg.sender, quantity);
        emit PacksBought(msg.sender, quantity, paid);
    }

    function setPaymentToken(address token) external onlyOwner {
        paymentToken = IERC20(token);
        emit PaymentTokenUpdated(token);
    }

    function setPackPrice(uint256 price) external onlyOwner {
        packPrice = price;
        emit PackPriceUpdated(price);
    }

    function setEthPackPrice(uint256 price) external onlyOwner {
        ethPackPrice = price;
        emit EthPackPriceUpdated(price);
    }

    function setSaleOpen(bool open) external onlyOwner {
        saleOpen = open;
        emit SaleOpenUpdated(open);
    }
}
