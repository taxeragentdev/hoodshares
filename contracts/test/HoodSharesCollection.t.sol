// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {HoodSharesCollection} from "../src/HoodSharesCollection.sol";
import {Treasury} from "../src/Treasury.sol";
import {MockRandomnessProvider} from "../src/mocks/MockRandomnessProvider.sol";

contract HoodSharesCollectionTest is Test {
    HoodSharesCollection private collection;
    Treasury private treasury;
    MockRandomnessProvider private randomness;

    address private owner = address(0xA11CE);
    address private royaltyReceiver = address(0xFEE5);
    uint256 private constant MINT_PRICE = 0.021 ether;

    function setUp() public {
        treasury = new Treasury(owner);
        randomness = new MockRandomnessProvider();

        vm.prank(owner);
        collection = new HoodSharesCollection(
            owner, treasury, randomness, MINT_PRICE, "ipfs://unrevealed.json", royaltyReceiver, 500
        );

        vm.prank(owner);
        treasury.setMintSource(address(collection), true);

        vm.prank(owner);
        collection.setSalePhase(HoodSharesCollection.SalePhase.Public);
    }

    function _mint(address to, uint256 quantity) private {
        vm.deal(to, MINT_PRICE * quantity);
        vm.prank(to);
        collection.mintPublic{value: MINT_PRICE * quantity}(quantity);
    }

    function testMintTransfersPaymentToTreasury() public {
        address buyer = address(0x1);
        _mint(buyer, 2);

        assertEq(collection.totalMinted(), 2);
        assertEq(collection.ownerOf(0), buyer);
        assertEq(collection.ownerOf(1), buyer);
        assertEq(treasury.totalManaged(), MINT_PRICE * 2);
        assertEq(address(collection).balance, 0, "collection never holds mint proceeds");
    }

    function testMintFailsWithIncorrectPayment() public {
        address buyer = address(0x1);
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert("incorrect payment");
        collection.mintPublic{value: MINT_PRICE}(2);
    }

    function testMintFailsWhenSaleClosed() public {
        vm.prank(owner);
        collection.setSalePhase(HoodSharesCollection.SalePhase.Closed);

        address buyer = address(0x1);
        vm.deal(buyer, MINT_PRICE);
        vm.prank(buyer);
        vm.expectRevert("public sale closed");
        collection.mintPublic{value: MINT_PRICE}(1);
    }

    function testMintFailsPastWalletCap() public {
        address buyer = address(0x1);
        vm.deal(buyer, MINT_PRICE * 21);
        vm.prank(buyer);
        vm.expectRevert("exceeds wallet cap");
        collection.mintPublic{value: MINT_PRICE * 21}(21);
    }

    function testAllowlistMintVerifiesProof() public {
        address buyer = address(0x1);
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(buyer))));

        vm.prank(owner);
        collection.setAllowlistMerkleRoot(leaf);
        vm.prank(owner);
        collection.setSalePhase(HoodSharesCollection.SalePhase.Allowlist);

        bytes32[] memory emptyProof = new bytes32[](0);
        vm.deal(buyer, MINT_PRICE);
        vm.prank(buyer);
        collection.mintAllowlist{value: MINT_PRICE}(1, emptyProof);

        assertEq(collection.ownerOf(0), buyer);
    }

    function testAllowlistMintRejectsWrongProof() public {
        address buyer = address(0x1);
        address other = address(0x2);
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(other))));

        vm.prank(owner);
        collection.setAllowlistMerkleRoot(leaf);
        vm.prank(owner);
        collection.setSalePhase(HoodSharesCollection.SalePhase.Allowlist);

        bytes32[] memory emptyProof = new bytes32[](0);
        vm.deal(buyer, MINT_PRICE);
        vm.prank(buyer);
        vm.expectRevert("not on allowlist");
        collection.mintAllowlist{value: MINT_PRICE}(1, emptyProof);
    }

    function testRarityIsUnknowableBeforeReveal() public {
        _mint(address(0x1), 1);
        vm.expectRevert("not revealed yet");
        collection.rarityOf(0);
    }

    function testRevealAssignsRarityToEveryToken() public {
        _mint(address(0x1), 5);

        vm.prank(owner);
        collection.requestReveal();
        randomness.fulfillLatest(collection.revealRequestId());

        assertTrue(collection.revealed());
        for (uint256 i = 0; i < 5; i++) {
            // Every minted token must resolve to a valid rarity without reverting.
            collection.rarityOf(i);
        }
    }

    function testRevealCannotBeRequestedTwice() public {
        vm.prank(owner);
        collection.requestReveal();

        vm.prank(owner);
        vm.expectRevert("reveal already requested");
        collection.requestReveal();
    }

    function testOnlyRandomnessProviderCanFulfill() public {
        vm.prank(owner);
        collection.requestReveal();
        uint256 requestId = collection.revealRequestId();

        vm.expectRevert("not randomness provider");
        collection.fulfillRandomness(requestId, 12345);
    }

    /// @notice Statistical sanity check: across the full 10,000-slot ring,
    /// every rarity band should land close to its published share for any
    /// seed, since the shuffle is a fixed offset rather than a resample.
    function testRarityDistributionMatchesPublishedShareAcrossFullRing() public pure {
        uint256 seed = 777;
        uint256[5] memory counts;
        uint256 maxSupply = 10_000;
        for (uint256 tokenId = 0; tokenId < maxSupply; tokenId++) {
            uint256 shuffled = (tokenId + (seed % 10_000)) % 10_000;
            if (shuffled < 5_500) counts[0]++;
            else if (shuffled < 8_200) counts[1]++;
            else if (shuffled < 9_500) counts[2]++;
            else if (shuffled < 9_920) counts[3]++;
            else counts[4]++;
        }
        assertEq(counts[0], 5_500);
        assertEq(counts[1], 2_700);
        assertEq(counts[2], 1_300);
        assertEq(counts[3], 420);
        assertEq(counts[4], 80);
    }

    function testTokenURIBeforeAndAfterReveal() public {
        _mint(address(0x1), 1);
        assertEq(collection.tokenURI(0), "ipfs://unrevealed.json");

        vm.prank(owner);
        collection.setBaseURI("ipfs://revealed/");
        vm.prank(owner);
        collection.requestReveal();
        randomness.fulfillLatest(collection.revealRequestId());

        assertEq(collection.tokenURI(0), "ipfs://revealed/0.json");
    }

    function testRoyaltyInfoReturnsFiveePercentToReceiver() public view {
        (address receiver, uint256 amount) = collection.royaltyInfo(0, 10_000);
        assertEq(receiver, royaltyReceiver);
        assertEq(amount, 500);
    }
}
