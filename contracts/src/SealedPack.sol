// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IRandomnessProvider, IRandomnessConsumer} from "./interfaces/IRandomnessProvider.sol";

/// @notice Fungible sealed booster. One token id, identical until opened.
/// Buying mints these; opening burns them and emits the five ticker indices
/// the off-chain inventory credits. Cards themselves are not minted here.
///
/// Contents are unknown at mint and assigned at open from one VRF word, so
/// unopened packs stay fungible and tradeable.
contract SealedPack is ERC1155, Ownable, ReentrancyGuard, IRandomnessConsumer {
    uint256 public constant PACK_ID = 1;
    uint256 public constant CARDS_PER_PACK = 5;
    uint256 public constant MAX_OPEN_PER_TX = 20;

    /// @notice Size of the playable ticker list. Must match `CARDS.length`
    /// in the app; opening maps each index onto that roster.
    uint256 public immutable deckSize;

    address public shop;
    IRandomnessProvider public randomnessProvider;

    struct PendingOpen {
        address player;
        uint64 quantity;
    }

    mapping(uint256 => PendingOpen) public pendingOpen;

    event ShopUpdated(address shop);
    event RandomnessProviderUpdated(address provider);
    event PackOpenRequested(address indexed player, uint256 indexed requestId, uint256 quantity);
    event PackOpened(address indexed player, uint256 indexed requestId, uint256 packIndex, uint8[5] tickers);

    constructor(
        address initialOwner,
        IRandomnessProvider randomnessProvider_,
        uint256 deckSize_,
        string memory uri_
    ) ERC1155(uri_) Ownable(initialOwner) {
        require(address(randomnessProvider_) != address(0), "zero randomness");
        require(deckSize_ > 0 && deckSize_ <= 255, "bad deck size");
        randomnessProvider = randomnessProvider_;
        deckSize = deckSize_;
    }

    function setShop(address shop_) external onlyOwner {
        require(shop_ != address(0), "zero shop");
        shop = shop_;
        emit ShopUpdated(shop_);
    }

    function setRandomnessProvider(IRandomnessProvider provider) external onlyOwner {
        require(address(provider) != address(0), "zero randomness");
        randomnessProvider = provider;
        emit RandomnessProviderUpdated(address(provider));
    }

    function setURI(string calldata uri_) external onlyOwner {
        _setURI(uri_);
    }

    /// @notice Called by the pack shop after payment lands in the treasury.
    function mint(address to, uint256 quantity) external {
        require(msg.sender == shop, "not pack shop");
        require(to != address(0), "zero recipient");
        require(quantity > 0, "quantity is zero");
        _mint(to, PACK_ID, quantity, "");
    }

    /// @notice Burns `quantity` sealed packs and asks VRF for the pulls.
    /// Tickers land in `PackOpened`; the game inventory indexes that event.
    function open(uint256 quantity) external nonReentrant {
        require(quantity > 0, "quantity is zero");
        require(quantity <= MAX_OPEN_PER_TX, "too many packs");
        _burn(msg.sender, PACK_ID, quantity);
        uint256 requestId = randomnessProvider.requestRandomness(address(this));
        pendingOpen[requestId] = PendingOpen({player: msg.sender, quantity: uint64(quantity)});
        emit PackOpenRequested(msg.sender, requestId, quantity);
    }

    function fulfillRandomness(uint256 requestId, uint256 randomWord) external override {
        require(msg.sender == address(randomnessProvider), "not randomness provider");
        PendingOpen memory pending = pendingOpen[requestId];
        require(pending.player != address(0), "unknown request");
        delete pendingOpen[requestId];

        uint256 size = deckSize;
        for (uint256 i = 0; i < pending.quantity; i++) {
            uint256 seed = uint256(keccak256(abi.encode(randomWord, i)));
            uint8[5] memory tickers;
            for (uint256 j = 0; j < CARDS_PER_PACK; j++) {
                tickers[j] = uint8(uint256(keccak256(abi.encode(seed, j))) % size);
            }
            emit PackOpened(pending.player, requestId, i, tickers);
        }
    }
}
