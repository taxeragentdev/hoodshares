// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {SealedPack} from "../src/SealedPack.sol";
import {PackShop} from "../src/PackShop.sol";
import {Treasury} from "../src/Treasury.sol";
import {MockRandomnessProvider} from "../src/mocks/MockRandomnessProvider.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

contract PackShopTest is Test {
    SealedPack private packs;
    PackShop private shop;
    Treasury private treasury;
    MockERC20 private token;
    MockRandomnessProvider private randomness;

    address private owner = address(0xA11CE);
    address private buyer = address(0xB0B);
    uint256 private constant PACK_PRICE = 100 ether;
    uint256 private constant DECK_SIZE = 30;

    function setUp() public {
        treasury = new Treasury(owner);
        randomness = new MockRandomnessProvider();
        token = new MockERC20();

        vm.prank(owner);
        packs = new SealedPack(owner, randomness, DECK_SIZE, "ipfs://pack/{id}.json");

        vm.prank(owner);
        shop = new PackShop(owner, packs, address(treasury), token, PACK_PRICE);

        vm.prank(owner);
        packs.setShop(address(shop));
        vm.prank(owner);
        shop.setSaleOpen(true);

        token.mint(buyer, 10_000 ether);
        vm.prank(buyer);
        token.approve(address(shop), type(uint256).max);
    }

    function testBuyOnePackMintsSealedTokenAndPaysTreasury() public {
        vm.prank(buyer);
        shop.buyPacks(1);

        assertEq(packs.balanceOf(buyer, packs.PACK_ID()), 1);
        assertEq(token.balanceOf(address(treasury)), PACK_PRICE);
        assertEq(token.balanceOf(buyer), 10_000 ether - PACK_PRICE);
    }

    function testBuyMultiplePacks() public {
        vm.prank(buyer);
        shop.buyPacks(3);

        assertEq(packs.balanceOf(buyer, packs.PACK_ID()), 3);
        assertEq(token.balanceOf(address(treasury)), PACK_PRICE * 3);
    }

    function testBuyFailsWhenSaleClosed() public {
        vm.prank(owner);
        shop.setSaleOpen(false);

        vm.prank(buyer);
        vm.expectRevert("pack sale closed");
        shop.buyPacks(1);
    }

    function testBuyFailsWithoutAllowance() public {
        address broke = address(0xBAD);
        token.mint(broke, PACK_PRICE);
        vm.prank(broke);
        vm.expectRevert();
        shop.buyPacks(1);
    }

    function testOnlyShopCanMint() public {
        vm.prank(buyer);
        vm.expectRevert("not pack shop");
        packs.mint(buyer, 1);
    }

    function testOpenBurnsPack() public {
        vm.prank(buyer);
        shop.buyPacks(1);

        vm.prank(buyer);
        packs.open(1);
        assertEq(packs.balanceOf(buyer, packs.PACK_ID()), 0);
    }

    function testOpenPullsStayInsideDeck() public {
        vm.prank(buyer);
        shop.buyPacks(2);

        vm.recordLogs();
        vm.prank(buyer);
        packs.open(2);
        randomness.fulfillLatest(1);

        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 openedSig = keccak256("PackOpened(address,uint256,uint256,uint8[5])");
        uint256 opened;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] != openedSig) continue;
            opened += 1;
            (uint256 packIndex, uint8[5] memory tickers) = abi.decode(logs[i].data, (uint256, uint8[5]));
            assertLt(packIndex, 2);
            for (uint256 j = 0; j < 5; j++) {
                assertLt(tickers[j], DECK_SIZE);
            }
        }
        assertEq(opened, 2);
    }

    function testBuyWithEthMintsAndPaysTreasury() public {
        vm.prank(owner);
        shop.setEthPackPrice(0.001 ether);

        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        shop.buyPacksWithEth{value: 0.001 ether}(1);

        assertEq(packs.balanceOf(buyer, packs.PACK_ID()), 1);
        assertEq(address(treasury).balance, 0.001 ether);
    }

    function testBuyWithEthRejectsWrongValue() public {
        vm.prank(owner);
        shop.setEthPackPrice(0.001 ether);

        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert("wrong eth");
        shop.buyPacksWithEth{value: 0.002 ether}(1);
    }

    function testBuyWithEthFailsWhenPriceUnset() public {
        vm.deal(buyer, 1 ether);
        vm.prank(buyer);
        vm.expectRevert("eth pack price not set");
        shop.buyPacksWithEth{value: 0.001 ether}(1);
    }

    function testCannotOpenWithoutAPack() public {
        vm.prank(buyer);
        vm.expectRevert();
        packs.open(1);
    }
}
