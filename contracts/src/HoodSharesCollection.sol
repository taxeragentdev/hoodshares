// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IRandomnessProvider, IRandomnessConsumer} from "./interfaces/IRandomnessProvider.sol";
import {Treasury} from "./Treasury.sol";

/// @notice Legacy ERC-721 card mint. Daily Lineup cards from packs are not
/// minted here — `PackShop` sells a sealed ERC-1155 and `SealedPack.open`
/// emits ticker indices for an off-chain inventory. This collection stays
/// as a closed ETH-mint fallback with its own VRF rarity reveal.
///
/// Tokens mint with no rarity attached; a single VRF draw after the mint
/// closes assigns every card's rarity at once via a cyclic shuffle offset.
contract HoodSharesCollection is ERC721, ERC2981, Ownable, ReentrancyGuard, IRandomnessConsumer {
    enum SalePhase {
        Closed,
        Allowlist,
        Public
    }

    enum Rarity {
        Common,
        Rare,
        Epic,
        Legendary,
        Mythic
    }

    uint256 public constant MAX_SUPPLY = 10_000;
    uint256 public constant MAX_PER_WALLET = 20;

    // Cumulative upper bounds of each rarity band over the shuffled index
    // space [0, MAX_SUPPLY). Mirrors the site's published distribution:
    // Common 5,500 / Rare 2,700 / Epic 1,300 / Legendary 420 / Mythic 80.
    uint256 public constant COMMON_CEILING = 5_500;
    uint256 public constant RARE_CEILING = 8_200;
    uint256 public constant EPIC_CEILING = 9_500;
    uint256 public constant LEGENDARY_CEILING = 9_920;
    // Mythic fills the remainder up to MAX_SUPPLY.

    Treasury public immutable treasury;
    IRandomnessProvider public randomnessProvider;

    uint256 public mintPrice;
    SalePhase public salePhase;
    bytes32 public allowlistMerkleRoot;
    string public unrevealedURI;
    string public baseURI;

    uint256 public totalMinted;
    mapping(address => uint256) public mintedBy;

    /// @notice The only address allowed to call `mintFromPack`. The live
    /// pack path no longer mints these tokens; this remains so the closed
    /// ETH fallback can still be wired if we ever wrap a card on-chain.
    address public packShop;

    bool public revealRequested;
    bool public revealed;
    uint256 public revealRequestId;
    uint256 public revealSeed;

    event SalePhaseUpdated(SalePhase phase);
    event MintPriceUpdated(uint256 price);
    event AllowlistRootUpdated(bytes32 root);
    event BaseURIUpdated(string uri);
    event RevealRequested(uint256 requestId);
    event Revealed(uint256 seed);
    event CardMinted(address indexed to, uint256 indexed tokenId);
    event PackShopUpdated(address packShop);

    constructor(
        address initialOwner,
        Treasury treasury_,
        IRandomnessProvider randomnessProvider_,
        uint256 mintPrice_,
        string memory unrevealedURI_,
        address royaltyReceiver,
        uint96 royaltyFeeBps
    ) ERC721("HoodShares", "HOOD") Ownable(initialOwner) {
        treasury = treasury_;
        randomnessProvider = randomnessProvider_;
        mintPrice = mintPrice_;
        unrevealedURI = unrevealedURI_;
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeBps);
    }

    // ---------------------------------------------------------------------
    // Minting
    // ---------------------------------------------------------------------

    function mintPublic(uint256 quantity) external payable nonReentrant {
        require(salePhase == SalePhase.Public, "public sale closed");
        _mintCards(msg.sender, quantity);
    }

    function mintAllowlist(uint256 quantity, bytes32[] calldata proof) external payable nonReentrant {
        require(salePhase == SalePhase.Allowlist || salePhase == SalePhase.Public, "allowlist sale closed");
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender))));
        require(MerkleProof.verify(proof, allowlistMerkleRoot, leaf), "not on allowlist");
        _mintCards(msg.sender, quantity);
    }

    function _mintCards(address to, uint256 quantity) private {
        require(quantity > 0, "quantity is zero");
        require(totalMinted + quantity <= MAX_SUPPLY, "exceeds max supply");
        require(mintedBy[to] + quantity <= MAX_PER_WALLET, "exceeds wallet cap");
        require(msg.value == mintPrice * quantity, "incorrect payment");

        mintedBy[to] += quantity;
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = totalMinted;
            totalMinted += 1;
            _safeMint(to, tokenId);
            emit CardMinted(to, tokenId);
        }

        treasury.depositMintRevenue{value: msg.value}();
    }

    /// @notice Mints cards that a pack opening paid for. No ETH, no per-wallet
    /// cap — the scarce resources here are remaining supply and the ERC-20
    /// the pack shop already pulled. Only `packShop` can call this.
    function mintFromPack(address to, uint256 quantity) external nonReentrant {
        require(msg.sender == packShop, "not pack shop");
        require(to != address(0), "zero recipient");
        require(quantity > 0, "quantity is zero");
        require(totalMinted + quantity <= MAX_SUPPLY, "exceeds max supply");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = totalMinted;
            totalMinted += 1;
            _safeMint(to, tokenId);
            emit CardMinted(to, tokenId);
        }
    }

    // ---------------------------------------------------------------------
    // Reveal
    // ---------------------------------------------------------------------

    /// @notice Requests the single randomness draw that reveals the whole
    /// collection at once. Callable once, only after minting has stopped
    /// being the only way tokens can exist (i.e. any time after deploy —
    /// the safety property comes from the seed being unknowable in advance,
    /// not from gating on sellout).
    function requestReveal() external onlyOwner {
        require(!revealRequested, "reveal already requested");
        revealRequested = true;
        revealRequestId = randomnessProvider.requestRandomness(address(this));
        emit RevealRequested(revealRequestId);
    }

    function fulfillRandomness(uint256 requestId, uint256 randomWord) external override {
        require(msg.sender == address(randomnessProvider), "not randomness provider");
        require(revealRequested && !revealed, "reveal not pending");
        require(requestId == revealRequestId, "unknown request id");
        revealSeed = randomWord;
        revealed = true;
        emit Revealed(randomWord);
    }

    /// @notice Rarity is a pure function of token id and the seed: every
    /// token's position is shifted by the same random offset around a fixed
    /// ring of MAX_SUPPLY slots, then binned by where it lands. One seed
    /// reveals every card simultaneously.
    function rarityOf(uint256 tokenId) public view returns (Rarity) {
        require(revealed, "not revealed yet");
        require(_ownerExists(tokenId), "token does not exist");
        uint256 shuffled = (tokenId + (revealSeed % MAX_SUPPLY)) % MAX_SUPPLY;
        if (shuffled < COMMON_CEILING) return Rarity.Common;
        if (shuffled < RARE_CEILING) return Rarity.Rare;
        if (shuffled < EPIC_CEILING) return Rarity.Epic;
        if (shuffled < LEGENDARY_CEILING) return Rarity.Legendary;
        return Rarity.Mythic;
    }

    /// @notice Score multiplier for the given token, expressed in basis
    /// points of 1x (10_000 = 1.00x), matching the 1.00x-1.50x band the
    /// game design deliberately keeps narrow.
    function multiplierBpsOf(uint256 tokenId) external view returns (uint256) {
        Rarity rarity = rarityOf(tokenId);
        if (rarity == Rarity.Common) return 10_000;
        if (rarity == Rarity.Rare) return 11_000;
        if (rarity == Rarity.Epic) return 12_000;
        if (rarity == Rarity.Legendary) return 13_500;
        return 15_000;
    }

    function _ownerExists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // ---------------------------------------------------------------------
    // Metadata
    // ---------------------------------------------------------------------

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        if (!revealed) return unrevealedURI;
        return string.concat(baseURI, Strings.toString(tokenId), ".json");
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setSalePhase(SalePhase phase) external onlyOwner {
        salePhase = phase;
        emit SalePhaseUpdated(phase);
    }

    function setMintPrice(uint256 price) external onlyOwner {
        mintPrice = price;
        emit MintPriceUpdated(price);
    }

    function setPackShop(address packShop_) external onlyOwner {
        packShop = packShop_;
        emit PackShopUpdated(packShop_);
    }

    function setAllowlistMerkleRoot(bytes32 root) external onlyOwner {
        allowlistMerkleRoot = root;
        emit AllowlistRootUpdated(root);
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        baseURI = uri;
        emit BaseURIUpdated(uri);
    }

    function setDefaultRoyalty(address receiver, uint96 feeBps) external onlyOwner {
        _setDefaultRoyalty(receiver, feeBps);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
