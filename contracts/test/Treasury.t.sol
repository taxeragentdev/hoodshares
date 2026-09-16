// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {Treasury} from "../src/Treasury.sol";
import {RewardDistributor} from "../src/RewardDistributor.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockBuybackRouter} from "../src/mocks/MockBuybackRouter.sol";

contract TreasuryTest is Test {
    Treasury private treasury;
    RewardDistributor private distributor;

    address private owner = address(0xA11CE);
    address private mintSource = address(0xBEEF);
    address private ticketSource = address(0xFACE);
    address private dev = address(0xD0);
    address private growth = address(0xD1);

    function setUp() public {
        treasury = new Treasury(owner);
        distributor = new RewardDistributor(owner, address(treasury));

        vm.prank(owner);
        treasury.setMintSource(mintSource, true);
        vm.prank(owner);
        treasury.setRewardDistributor(address(distributor));
    }

    function testMintRevenueSplitsIntoFourBuckets() public {
        vm.deal(mintSource, 10 ether);
        vm.prank(mintSource);
        treasury.depositMintRevenue{value: 10 ether}();

        assertEq(treasury.prizePoolBalance(), 6 ether, "60% to prize pool");
        assertEq(treasury.buybackBalance(), 3 ether, "30% to buyback and burn");
        assertEq(treasury.developmentBalance(), 0.5 ether, "5% to development");
        assertEq(treasury.growthBalance(), 0.5 ether, "5% to growth");
        assertEq(treasury.reserveBalance(), 0, "mint revenue no longer funds reserve");
        assertEq(treasury.totalManaged(), 10 ether, "buckets sum to total deposited");
    }

    function testOnlyRegisteredMintSourceCanDepositMintRevenue() public {
        vm.deal(address(this), 1 ether);
        vm.expectRevert("not a mint source");
        treasury.depositMintRevenue{value: 1 ether}();
    }

    function testPlainTransferIsTreatedAsRoyaltyIncome() public {
        vm.deal(address(this), 2 ether);
        (bool success,) = address(treasury).call{value: 2 ether}("");
        assertTrue(success);

        assertEq(treasury.prizePoolBalance(), 1 ether, "half of royalty to prize pool");
        assertEq(treasury.developmentBalance(), 1 ether, "half of royalty to development");
    }

    function testContestTicketsAreFullyRecycledToPrizePool() public {
        vm.deal(address(this), 1 ether);
        treasury.depositContestTicket{value: 1 ether}();
        assertEq(treasury.prizePoolBalance(), 1 ether);
    }

    function testNonOwnerCannotWithdrawDevelopment() public {
        vm.deal(mintSource, 1 ether);
        vm.prank(mintSource);
        treasury.depositMintRevenue{value: 1 ether}();

        vm.expectRevert();
        treasury.withdrawDevelopment(dev, 0.1 ether);
    }

    function testOwnerCanWithdrawEachBucketWithinItsBalance() public {
        vm.deal(mintSource, 10 ether);
        vm.prank(mintSource);
        treasury.depositMintRevenue{value: 10 ether}();

        vm.prank(owner);
        treasury.withdrawDevelopment(dev, 0.5 ether);
        vm.prank(owner);
        treasury.withdrawGrowth(growth, 0.5 ether);

        assertEq(dev.balance, 0.5 ether);
        assertEq(growth.balance, 0.5 ether);
        assertEq(treasury.prizePoolBalance(), 6 ether, "prize pool untouched by other withdrawals");
        assertEq(treasury.buybackBalance(), 3 ether, "buyback untouched by other withdrawals");
    }

    function testCannotWithdrawMoreThanBucketBalance() public {
        vm.deal(mintSource, 1 ether);
        vm.prank(mintSource);
        treasury.depositMintRevenue{value: 1 ether}();

        vm.prank(owner);
        vm.expectRevert("exceeds development balance");
        treasury.withdrawDevelopment(dev, 1 ether);
    }

    function testFundRewardEpochMovesEthFromPrizePoolToDistributor() public {
        vm.deal(mintSource, 10 ether);
        vm.prank(mintSource);
        treasury.depositMintRevenue{value: 10 ether}();

        bytes32 root = keccak256("epoch-0-root");
        vm.prank(owner);
        treasury.fundRewardEpoch(3 ether, 0, root);

        assertEq(treasury.prizePoolBalance(), 3 ether, "prize pool reduced by funded amount");
        assertEq(address(distributor).balance, 3 ether);
        (bytes32 storedRoot, uint256 totalFunded,,) = distributor.epochs(0);
        assertEq(storedRoot, root);
        assertEq(totalFunded, 3 ether);
    }

    function testFundRewardEpochCannotExceedPrizePoolBalance() public {
        vm.deal(mintSource, 1 ether);
        vm.prank(mintSource);
        treasury.depositMintRevenue{value: 1 ether}();

        vm.prank(owner);
        vm.expectRevert("exceeds prize pool");
        treasury.fundRewardEpoch(1 ether, 0, keccak256("root"));
    }

    // -------------------------------------------------------------------
    // Ticket revenue + buyback
    // -------------------------------------------------------------------

    function testTicketRevenueIsFullyTaggedForBuybackNotSplit() public {
        vm.prank(owner);
        treasury.setTicketSource(ticketSource, true);

        vm.deal(ticketSource, 5 ether);
        vm.prank(ticketSource);
        treasury.depositTicketRevenue{value: 5 ether}();

        assertEq(treasury.buybackBalance(), 5 ether);
        assertEq(treasury.prizePoolBalance(), 0, "ticket revenue never enters the mint-revenue split");
        assertEq(treasury.totalManaged(), 5 ether);
    }

    function testOnlyRegisteredTicketSourceCanDepositTicketRevenue() public {
        vm.deal(address(this), 1 ether);
        vm.expectRevert("not a ticket source");
        treasury.depositTicketRevenue{value: 1 ether}();
    }

    function testExecuteBuybackSwapsEthForTokenViaRouter() public {
        vm.prank(owner);
        treasury.setTicketSource(ticketSource, true);
        vm.deal(ticketSource, 3 ether);
        vm.prank(ticketSource);
        treasury.depositTicketRevenue{value: 3 ether}();

        MockERC20 token = new MockERC20();
        MockBuybackRouter router = new MockBuybackRouter(token);
        token.transfer(address(router), 10_000 ether);

        vm.prank(owner);
        treasury.executeBuyback(
            address(router), abi.encodeWithSignature("swap(address)", address(treasury)), 3 ether
        );

        assertEq(treasury.buybackBalance(), 0, "spent the whole buyback bucket");
        assertEq(token.balanceOf(address(treasury)), 3_000 ether, "received the swapped-back token");
    }

    function testExecuteBuybackCannotExceedBuybackBalance() public {
        vm.prank(owner);
        treasury.setTicketSource(ticketSource, true);
        vm.deal(ticketSource, 1 ether);
        vm.prank(ticketSource);
        treasury.depositTicketRevenue{value: 1 ether}();

        MockERC20 token = new MockERC20();
        MockBuybackRouter router = new MockBuybackRouter(token);

        vm.prank(owner);
        vm.expectRevert("exceeds buyback balance");
        treasury.executeBuyback(address(router), abi.encodeWithSignature("swap(address)", address(treasury)), 2 ether);
    }

    function testNonOwnerCannotExecuteBuyback() public {
        vm.expectRevert();
        treasury.executeBuyback(address(0x1), "", 0);
    }

    function testOwnerCanWithdrawBoughtBackToken() public {
        MockERC20 token = new MockERC20();
        token.transfer(address(treasury), 1_000 ether);

        vm.prank(owner);
        treasury.withdrawToken(address(token), dev, 1_000 ether);

        assertEq(token.balanceOf(dev), 1_000 ether);
    }
}
