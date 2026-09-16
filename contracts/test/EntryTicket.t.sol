// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {EntryTicket} from "../src/EntryTicket.sol";
import {Treasury} from "../src/Treasury.sol";

contract EntryTicketTest is Test {
    EntryTicket private ticket;
    Treasury private treasury;

    address private owner = address(0xA11CE);
    uint256 private constant PRICE = 0.01 ether;
    uint256 private constant MAX_SUPPLY = 2_700;

    function setUp() public {
        treasury = new Treasury(owner);

        vm.prank(owner);
        ticket = new EntryTicket(owner, treasury, PRICE, MAX_SUPPLY, "ipfs://ticket.json");

        vm.prank(owner);
        treasury.setTicketSource(address(ticket), true);

        vm.prank(owner);
        ticket.setSalePhase(EntryTicket.SalePhase.Public);
    }

    function _mint(address to, uint256 quantity) private {
        vm.deal(to, PRICE * quantity);
        vm.prank(to);
        ticket.mintPublic{value: PRICE * quantity}(quantity);
    }

    function testMintTagsRevenueAsBuyback() public {
        address buyer = address(0x1);
        _mint(buyer, 1);

        assertEq(ticket.totalMinted(), 1);
        assertEq(ticket.ownerOf(0), buyer);
        assertEq(treasury.buybackBalance(), PRICE);
        assertEq(treasury.prizePoolBalance(), 0, "ticket revenue never touches the mint-revenue split");
        assertEq(address(ticket).balance, 0, "ticket contract never holds proceeds");
    }

    function testHoldsTicketReflectsBalance() public {
        address buyer = address(0x1);
        assertFalse(ticket.holdsTicket(buyer));
        _mint(buyer, 1);
        assertTrue(ticket.holdsTicket(buyer));
    }

    function testMintRejectsQuantityOverOne() public {
        address buyer = address(0x1);
        vm.deal(buyer, PRICE * 2);
        vm.prank(buyer);
        vm.expectRevert("one pass per wallet");
        ticket.mintPublic{value: PRICE * 2}(2);
    }

    function testMintFailsWhenSaleClosed() public {
        vm.prank(owner);
        ticket.setSalePhase(EntryTicket.SalePhase.Closed);

        address buyer = address(0x1);
        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert("public sale closed");
        ticket.mintPublic{value: PRICE}(1);
    }

    function testMintFailsPastWalletCap() public {
        address buyer = address(0x1);
        _mint(buyer, 1);
        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert("already minted");
        ticket.mintPublic{value: PRICE}(1);
    }

    function testMintFailsPastMaxSupply() public {
        vm.prank(owner);
        ticket.setMaxSupply(1);
        _mint(address(0x1), 1);

        address buyer = address(0x2);
        vm.deal(buyer, PRICE);
        vm.prank(buyer);
        vm.expectRevert("exceeds max supply");
        ticket.mintPublic{value: PRICE}(1);
    }

    function testOwnerCanRaiseMaxSupply() public {
        vm.prank(owner);
        ticket.setMaxSupply(MAX_SUPPLY + 1_000);
        assertEq(ticket.maxSupply(), MAX_SUPPLY + 1_000);
    }

    function testCannotLowerMaxSupplyBelowMinted() public {
        _mint(address(0x1), 1);

        vm.prank(owner);
        vm.expectRevert("below current mint count");
        ticket.setMaxSupply(0);
    }

    function testAllowlistMintRequiresValidProof() public {
        vm.prank(owner);
        ticket.setSalePhase(EntryTicket.SalePhase.Allowlist);

        address buyer = address(0x1);
        vm.deal(buyer, PRICE);
        bytes32[] memory emptyProof = new bytes32[](0);
        vm.prank(buyer);
        vm.expectRevert("not on allowlist");
        ticket.mintAllowlist{value: PRICE}(1, emptyProof);
    }

    function testTokenURIReturnsBaseURI() public {
        _mint(address(0x1), 1);
        assertEq(ticket.tokenURI(0), "ipfs://ticket.json");
    }
}
