# HoodShares contracts

Foundry project for the contracts that make up the on-chain protocol.
Deploys to **Robinhood Chain** (mainnet `4663`, testnet `46630`), fully
EVM-compatible so nothing here is chain-specific beyond the RPC endpoints in
`foundry.toml`.

## Contracts

| Contract | Responsibility |
| --- | --- |
| `Treasury.sol` | Receives every ETH inflow, splits it into four internal buckets by source (mint revenue, secondary royalties, contest tickets), and is the only path funds take out to a `RewardDistributor` epoch or an owner-controlled withdrawal. |
| `SealedPack.sol` | ERC-1155 sealed booster. One token id, fungible until opened. `open` burns the pack, asks VRF for a seed, and emits five ticker indices. Cards are not minted. |
| `PackShop.sol` | Sells sealed packs paid in the project's ERC-20. Pulled tokens go to the Treasury. Opening is a later call on `SealedPack`. |
| `HoodSharesCollection.sol` | Legacy ERC-721 card mint. The live pack path does not mint these. A paid ETH mint remains as a closed fallback with a collection-wide VRF rarity reveal. |
| `RewardDistributor.sol` | Merkle-root payout contract. The Treasury funds one epoch per contest session with a root over every winner's payout; winners claim directly, so the full payout list is publicly verifiable against the root rather than trusted from a script. |
| `mocks/MockRandomnessProvider.sol` | Local/testnet stand-in for Chainlink VRF. **Never deploy on mainnet** — see the warning in the file. `Deploy.s.sol` hard-reverts if you try. |

## Design decisions worth knowing before you touch this code

- **Sealed packs are the on-chain product.** Buy with HOOD, hold, trade, burn to
  open. Unopened packs are identical, so they are ERC-1155, not 721.
- **Opened cards stay off-chain.** `PackOpened` is the verifiable receipt
  (player, request id, five ticker indices). The game inventory indexes that
  event. Daily Lineup only needs "this wallet owns these tickers."
- **Pulls are assigned at open, not at mint.** One VRF word expands into five
  uniform draws over the 30-ticker roster. All five can be the same name.
- **Rarity is not a scoring axis.** Score is percent move × 100, then the
  duplicate cut. Foil on the card face is cosmetic.
- **The prize pool bucket has no generic withdrawal function.** It can only
  move to a `RewardDistributor` epoch. This is deliberate — it is the
  on-chain enforcement of "the treasury cannot be quietly drained," not just
  a policy on a website.
- **Archetype ("hood") cards are intentionally out of scope for this
  contract set.** They are awarded off-chain-computed, on-chain-claimed the
  same way contest rewards are — as a Merkle-distributed grant, likely of a
  separate ERC-721 contract — once the scoring history needed to judge a
  season actually exists.

## Packs

The intended sale is `PackShop.buyPacks`. The buyer pays the project's
ERC-20 (`paymentToken`, set after the Pons launch), the shop forwards those
tokens to the Treasury, and `SealedPack.mint` credits sealed packs to the
wallet. The holder later calls `SealedPack.open`, which burns the pack and
emits `PackOpened`. The paid ETH mint on `HoodSharesCollection` stays as a
closed fallback and is not how Daily Lineup cards are dealt.

## Setup

```bash
forge install
forge build
forge test
```

`lib/` is gitignored; running `forge install` re-fetches `forge-std` and
`openzeppelin-contracts` at the pinned versions in `.gitmodules`-equivalent
lockfiles under `lib/*/`.

## Deploying

```bash
export PRIVATE_KEY=0x<deployer_key>
export MULTISIG_OWNER=0x<safe_address>   # required for a mainnet deploy

forge script script/Deploy.s.sol \
  --rpc-url robinhood_testnet \
  --broadcast
```

The script deploys `Treasury`, `RewardDistributor`, a randomness provider,
`HoodSharesCollection`, `SealedPack`, and optionally `PackShop`, then prints
the owner-only wiring calls (`treasury.setMintSource`,
`treasury.setRewardDistributor`, `packs.setShop`) that still need to be
executed from the multisig — intentionally not automated, since the
deployer key and the multisig are different keys in any real deployment.

Verify after deploying:

```bash
forge verify-contract <address> src/Treasury.sol:Treasury \
  --chain-id 46630 \
  --verifier blockscout \
  --verifier-url https://explorer.testnet.chain.robinhood.com/api/
```

## What is still missing

- A real Chainlink VRF v2.5 adapter implementing `IRandomnessProvider` for
  the mainnet deploy path (the script currently refuses to deploy to chain
  id `4663` without one).
- An indexer that credits off-chain card inventory from `PackOpened`.
- The off-chain scoring job that computes each session's Merkle tree and
  calls `treasury.fundRewardEpoch`.
- An external audit — required before any mainnet deployment, not optional.
