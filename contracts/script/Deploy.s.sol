// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {Treasury} from "../src/Treasury.sol";
import {HoodSharesCollection} from "../src/HoodSharesCollection.sol";
import {EntryTicket} from "../src/EntryTicket.sol";
import {PackShop} from "../src/PackShop.sol";
import {SealedPack} from "../src/SealedPack.sol";
import {RewardDistributor} from "../src/RewardDistributor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockRandomnessProvider} from "../src/mocks/MockRandomnessProvider.sol";
import {IRandomnessProvider} from "../src/interfaces/IRandomnessProvider.sol";

/// @notice Deploys the full protocol in dependency order: Treasury first
/// (nothing depends on it existing), then the collection and distributor,
/// then wires the three together.
///
/// Usage:
///   export PRIVATE_KEY=0x...
///   export MULTISIG_OWNER=0x...        # Safe address; falls back to the deployer on testnet
///   forge script script/Deploy.s.sol --rpc-url $RH_TESTNET_RPC --broadcast
///
/// The mock randomness provider is only ever selected for local/testnet
/// chain ids. Deploying to mainnet (4663) without swapping in a real VRF
/// adapter is a hard failure, on purpose.
contract Deploy is Script {
    uint256 private constant ROBINHOOD_MAINNET_CHAIN_ID = 4663;
    uint256 private constant MINT_PRICE = 0.021 ether;
    uint96 private constant ROYALTY_FEE_BPS = 500; // 5%
    uint256 private constant TICKET_PRICE = 0.001 ether;
    uint256 private constant TICKET_MAX_SUPPLY = 1999;
    uint256 private constant DECK_SIZE = 30;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address owner = vm.envOr("MULTISIG_OWNER", deployer);

        if (block.chainid == ROBINHOOD_MAINNET_CHAIN_ID) {
            require(owner != deployer, "set MULTISIG_OWNER before a mainnet deploy");
        }

        vm.startBroadcast(deployerKey);

        Treasury treasury = new Treasury(owner);
        RewardDistributor distributor = new RewardDistributor(owner, address(treasury));

        address randomnessProvider;
        if (block.chainid == ROBINHOOD_MAINNET_CHAIN_ID) {
            revert("Wire a real VRF adapter before deploying to mainnet");
        } else {
            randomnessProvider = address(new MockRandomnessProvider());
        }

        HoodSharesCollection collection = new HoodSharesCollection(
            owner,
            treasury,
            IRandomnessProvider(randomnessProvider),
            MINT_PRICE,
            "ipfs://unrevealed/hoodshares.json",
            address(treasury),
            ROYALTY_FEE_BPS
        );

        EntryTicket ticket = new EntryTicket(
            owner, treasury, TICKET_PRICE, TICKET_MAX_SUPPLY, "ipfs://unrevealed/hoodshares-ticket.json"
        );

        SealedPack packs = new SealedPack(
            owner, IRandomnessProvider(randomnessProvider), DECK_SIZE, "ipfs://sealed-pack/{id}.json"
        );

        address packToken = vm.envOr("PACK_TOKEN", address(0));
        uint256 packPrice = vm.envOr("PACK_PRICE", uint256(0));
        PackShop shop = new PackShop(owner, packs, address(treasury), IERC20(packToken), packPrice);

        vm.stopBroadcast();

        // Post-deploy wiring needs the owner key, which on a real deployment
        // is the multisig — run these as a second batch of Safe transactions
        // rather than from the deployer key.
        console.log("Treasury:", address(treasury));
        console.log("RewardDistributor:", address(distributor));
        console.log("HoodSharesCollection:", address(collection));
        console.log("SealedPack:", address(packs));
        console.log("EntryTicket:", address(ticket));
        console.log("PackShop:", address(shop));
        console.log("Randomness provider:", randomnessProvider);
        console.log("--- Owner-only steps still required ---");
        console.log("treasury.setMintSource(collection, true)");
        console.log("treasury.setTicketSource(ticket, true)");
        console.log("treasury.setRewardDistributor(distributor)");
        console.log("packs.setShop(shop)");
        console.log("shop.setSaleOpen(true)");
        console.log("shop.setPackPrice(50000 ether)                        # 50,000 HOOD at 18 decimals");
        console.log("ticket.setSalePhase(EntryTicket.SalePhase.Public)      # or .Allowlist first");
        console.log("--- Still pending ---");
        console.log("PACK_TOKEN + PACK_PRICE=50000e18 if HOOD already exists");
        console.log("Treasury.executeBuyback(router, swapData, ethAmount)  # once the token + pool exist");
    }
}
