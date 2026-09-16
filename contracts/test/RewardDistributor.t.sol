// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {RewardDistributor} from "../src/RewardDistributor.sol";

contract RewardDistributorTest is Test {
    RewardDistributor private distributor;

    address private owner = address(0xA11CE);
    address private treasury = address(0xBEEF);

    address private alice = address(0x1);
    address private bob = address(0x2);
    uint256 private constant ALICE_AMOUNT = 1 ether;
    uint256 private constant BOB_AMOUNT = 0.5 ether;

    bytes32 private leafAlice;
    bytes32 private leafBob;
    bytes32 private root;

    function setUp() public {
        distributor = new RewardDistributor(owner, treasury);

        leafAlice = keccak256(bytes.concat(keccak256(abi.encode(alice, uint256(0), ALICE_AMOUNT))));
        leafBob = keccak256(bytes.concat(keccak256(abi.encode(bob, uint256(0), BOB_AMOUNT))));
        root = _hashPair(leafAlice, leafBob);

        vm.deal(treasury, 10 ether);
        vm.prank(treasury);
        distributor.fundEpoch{value: ALICE_AMOUNT + BOB_AMOUNT}(0, root);
    }

    function _hashPair(bytes32 a, bytes32 b) private pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    function testAliceCanClaimWithValidProof() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafBob;

        vm.prank(alice);
        distributor.claim(0, ALICE_AMOUNT, proof);
        assertEq(alice.balance, ALICE_AMOUNT);
        assertTrue(distributor.isClaimed(0, alice));
    }

    function testCannotClaimTwice() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafBob;

        vm.prank(alice);
        distributor.claim(0, ALICE_AMOUNT, proof);

        vm.prank(alice);
        vm.expectRevert("already claimed");
        distributor.claim(0, ALICE_AMOUNT, proof);
    }

    function testWrongAmountFailsProof() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafBob;

        vm.prank(alice);
        vm.expectRevert("invalid proof");
        distributor.claim(0, ALICE_AMOUNT + 1, proof);
    }

    function testOnlyTreasuryCanFundAnEpoch() public {
        vm.deal(address(this), 1 ether);
        vm.expectRevert("not treasury");
        distributor.fundEpoch{value: 1 ether}(1, keccak256("root"));
    }

    function testCannotFundTheSameEpochTwice() public {
        vm.deal(treasury, 1 ether);
        vm.prank(treasury);
        vm.expectRevert("epoch already funded");
        distributor.fundEpoch{value: 1 ether}(0, keccak256("root"));
    }

    function testBobClaimUsesAliceLeafAsSibling() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafAlice;

        vm.prank(bob);
        distributor.claim(0, BOB_AMOUNT, proof);
        assertEq(bob.balance, BOB_AMOUNT);
    }
}
