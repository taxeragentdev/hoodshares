# HoodShares

A collectible card protocol built on **Robinhood Chain**. The loop is one sentence:

**Buy SOOD → buy a sealed pack NFT → open it → play a five-card Daily Lineup against real Robinhood Chain stock prices.**

No crypto tickers. Every card tracks an official Robinhood Stock Token from the same book Uniswap lists under Robinhood → Stocks (see `src/lib/cards.ts`). Packs cost the project's own token, five cards each — one pack is a playable hand. The sealed pack is an ERC-1155. Opening burns it and credits five tickers to off-chain game inventory.

This repository currently contains the **design system, marketing site, pack-opening flow, a client-side Daily Lineup demo, and the core smart contracts** (sealed pack, pack shop, treasury, reward distributor — see `contracts/README.md`). A live VRF open, a real backend for rounds and the leaderboard, and indexing `PackOpened` into inventory are the next phases.

---

## Positioning

Cards are collectibles that each track one real **Robinhood Chain Stock Token** —
verified against the issuer's own registry (chain id `4663`), not an invented ticker.
That underlying token is itself a tokenized debt security issued by Robinhood Assets
(Jersey) Limited, not the share. A card is one step further removed still: it is
deliberately **not** a claim on the Stock Token, the company, or anything else — no
ownership, no dividend, no redemption right, and no price exposure. The Stock Token's
Chainlink-fed price serves only as the scoring input for skill-based contests, in the
same way a fantasy sports game scores a real match.

This distinction shapes every product decision and should be preserved in all future
copy, contracts, and metadata.

Crypto is explicitly out of scope for the initial deck. Every card is a Robinhood Chain
Stock Token; see `src/lib/cards.ts` for the current 30 and their verified addresses.

## Stack

| Layer      | Choice                                    |
| ---------- | ----------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack)        |
| Language   | TypeScript                                |
| Styling    | Tailwind CSS v4 (CSS-first `@theme`)      |
| Fonts      | Space Grotesk, Inter, JetBrains Mono      |
| Chain      | Robinhood Chain (Arbitrum Orbit L2)       |

### Robinhood Chain reference

|              | Mainnet                              | Testnet                              |
| ------------ | ------------------------------------ | ------------------------------------ |
| Chain ID     | `4663`                               | `46630`                              |
| RPC          | `rpc.mainnet.chain.robinhood.com`    | `rpc.testnet.chain.robinhood.com`    |
| Explorer     | `robinhoodchain.blockscout.com`      | `explorer.testnet.chain.robinhood.com` |
| Gas token    | ETH                                  | Testnet ETH (faucet)                 |

Fully EVM-compatible, so Foundry and Hardhat work unmodified. Chainlink price feeds
run natively on the chain, which is what the contest scoring engine will read from.

## Design system

Defined in `src/app/globals.css` under `@theme`.

**Surfaces** are layered dark greys (`--color-void` through `--color-surface-3`) rather
than pure black, so card edges and shadows remain visible on OLED displays.

**Accent** (`--color-acid`, `#ccff00`) is reserved exclusively for actions and brand
moments. It is deliberately never used as a rarity colour, so the two visual languages
stay distinct.

**Rarity scale** runs common → rare → epic → legendary → mythic, each with its own hue,
foil treatment, and contest multiplier. See `src/lib/rarity.ts`.

**Market direction** uses a separate green/red pair (`--color-up` / `--color-down`) that
reads clearly against both the accent and the rarity colours.

## Adding a card

**A card is a data row.** Append it to `CARDS` in `src/lib/cards.ts` and it renders
immediately — artwork is never a prerequisite for shipping one. Look up the real
contract address on the [issuer's Stock Token contract registry](https://docs.robinhood.com/chain/contracts)
before adding one; see the warning on `CardDefinition.contractAddress` about lookalike
tokens and verifying by full address, not ticker.

That holds because `CardGlyph` resolves a card's mark in two steps, and the second one
can't fail:

1. `marks/overrides.tsx` — bespoke art for one specific card, keyed by card id — needed
   only when a second card in an already-used sector would otherwise print the same
   face (`AMD`, `INTC`, and `MU` are the worked example; `NVDA` keeps the
   Semiconductors sector mark)
2. `marks/sectors.tsx` — the card's sector mark

Step 2 is typed `Record<Sector, Mark>` against the `SECTORS` union, so a sector without
artwork is a build error rather than a blank card in production. A new stock in an
existing sector needs no mark work at all; a stock in a new sector needs one entry added
to `SECTORS` and one mark drawn, which the compiler will insist on.

### Why equities have no logos

Corporate marks are registered trademarks, and printing them on a sold collectible is
the single largest legal exposure this project has. A card is therefore represented by
what its company does rather than who it is: a bolt for electric mobility, a die for
semiconductors, a terminal for software.

## Packs and scoring

Sealed packs are the on-chain product (ERC-1155). Buy with HOOD, hold or trade,
burn to open. Contents are rolled **at open** from a Chainlink VRF seed: five
uniform draws over the 30-ticker roster. All five can be the same name.

Opened cards stay off-chain. `PackOpened` is the receipt the inventory indexes.
Daily Lineup only needs "this wallet owns these tickers." Individual cards are
not minted as ERC-721.

Score is percent move from the 09:30 ET open × 100, then the duplicate cut.
Foil on the card face is cosmetic and does not multiply.

## Treasury

Mint revenue splits 60% prize pool / 30% buyback and burn / 5% development / 5% growth,
enforced by the treasury contract rather than by policy, behind a multisig.

Daily rewards are defined as a **percentage of the treasury** rather than a fixed
figure, so payouts scale down as the pool shrinks and the protocol cannot run dry.
Secondary royalties and contest tickets recycle back into the same pool.

Prize distribution uses a **Merkle root published per session**, so winners claim
directly and the payout list is publicly verifiable.

## Packs page

`/packs` is how packs are sold. With no pack shop deployed it mints a **demo sealed
pack** in the browser, then opening burns it and credits five cards to local
inventory. Once `PackShop` and the SOOD token exist, the same page reads
`packPrice` / `saleOpen` / `paymentToken`, asks for an ERC-20 approve, and writes
`buyPacks`. Opening live is `SealedPack.open`.

```bash
# .env.local
NEXT_PUBLIC_PACK_SHOP_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_PACK_SHOP_ADDRESS_MAINNET=0x...
NEXT_PUBLIC_SEALED_PACK_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_SEALED_PACK_ADDRESS_MAINNET=0x...
NEXT_PUBLIC_PACK_TOKEN_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_PACK_TOKEN_ADDRESS_MAINNET=0xe5A8Fe54e0D367DB85Ebb1B9245BE8cB1EfBE7df
NEXT_PUBLIC_COLLECTION_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_COLLECTION_ADDRESS_MAINNET=0x...
```

`/mint` redirects here. The collection's paid ETH mint still exists on-chain as a
closed fallback; it is not the intended path.

### Allowlist

The contract verifies allowlist mints against a Merkle root (`setAllowlistMerkleRoot`,
owner/multisig only). To generate it:

```bash
cp data/allowlist.sample.json data/allowlist.json   # fill in real addresses
npm run allowlist:build
```

This writes `src/data/allowlist-proofs.generated.json` — bundled into the app so the
mint page can look up a connected wallet's proof with no network round trip — and
prints the Merkle root to send to the multisig. A wallet with no proof simply can't
mint during the Allowlist phase; everyone mints through `mintPublic` once the sale
moves to Public, allowlist wallets included.

`mintPublic`/`mintAllowlist` are a closed ETH fallback. They exist on the collection
contract if cards ever need to sell for ETH; they are **not** the intended path. Packs
paid in SOOD are.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build
npm run lint    # eslint
```

## Project structure

```
src/
  app/
    globals.css        design tokens, keyframes, base styles
    layout.tsx         fonts and metadata
    page.tsx           landing page composition
    packs/page.tsx     pack opening (demo + live token payment)
    mint/page.tsx      redirects to /packs
    play/page.tsx      Daily Lineup demo
  components/
    AssetCard.tsx      the collectible card (tilt, halftone face, footer)
    CardGlyph.tsx      resolves which mark a card prints
    marks/
      sectors.tsx           one mark per sector — the guaranteed fallback
      overrides.tsx         bespoke art for individual cards, where a sector has more than one
    game/
      LineupBuilder.tsx  card pool, hand slots, up/down calls
      ActiveRound.tsx    live scores and per-card lock
      RoundSummary.tsx   final scores and standing
    mint/
      MintPanel.tsx      phase/price/supply reads, quantity, mint write
    Hero.tsx           headline, stats, fanned card display
    TickerTape.tsx     scrolling price marquee
    CollectionSection.tsx
    ScoringSection.tsx scoring rules, no rarity multiplier
    GameModes.tsx      Daily Lineup, Duels, Prediction Cup
    TreasurySection.tsx
    Roadmap.tsx
    Faq.tsx
    Footer.tsx         includes the legal disclaimers
    HoodCard.tsx       archetype card (SVG figure, stat bars, neon frame)
    HoodsSection.tsx   archetype grid and "why access not power" explainer
    ConnectWalletButton.tsx
    Providers.tsx      wagmi and react-query context
    ui/Section.tsx     shared section shell and headings
  lib/
    rarity.ts          foil colours on the card face (not a score axis)
    cards.ts           card definitions — real Robinhood Chain Stock Token addresses
    pfpClaim.ts        PFP tier → card count table
    pfpClaims.ts        looks up a PFP token id's claim proof in the generated file
    hoods.ts           archetype definitions, stats, earn criteria
    chains.ts          Robinhood Chain definition
    wagmi.ts           wallet connectors
    contracts.ts       collection ABI + deployed address, keyed by chain id
    allowlist.ts       looks up a wallet's proof in the generated file
    game/
      scoring.ts       percent move, duplicate penalty, score cap
      simulate.ts      deterministic price paths for the demo
      types.ts         lineup size, round duration, shared types

scripts/
  build-allowlist.mjs     builds the Merkle tree and per-wallet mint proofs
  assign-pfp-tiers.mjs    decides PFP tier counts, pre-mint, with no token ids yet
  reveal-pfp.mjs          links tiers to real token ids, seeded only after mint closes
  build-pfp-claims.mjs    builds the Merkle tree and per-PFP-token claim proofs

data/
  allowlist.sample.json     shape reference — copy to allowlist.json and fill in
  pfp-rarities.sample.json  shape reference — same shape reveal-pfp.mjs writes


contracts/
  src/
    Treasury.sol                 revenue split, prize pool custody
    SealedPack.sol               ERC-1155 sealed booster, burn-to-open, VRF pulls
    HoodSharesCollection.sol      legacy ERC-721 mint, closed ETH fallback
    PackShop.sol                 sell sealed packs paid in the project token
    RewardDistributor.sol        Merkle-based prize claims
    interfaces/IRandomnessProvider.sol
    mocks/MockRandomnessProvider.sol   testnet-only VRF stand-in
  script/Deploy.s.sol
```

See `contracts/README.md` for the contract architecture in depth, including
what is deliberately still missing before a mainnet deploy.

## Roadmap

1. **Deck design** — Robinhood Chain stocks only _(done)_
2. **Contracts** — sealed pack, pack shop, treasury, distributor written and tested
   _(done — external audit and a real VRF adapter still required before mainnet)_
3. **Game engine** — lineup builder and scoring are live client-side against simulated
   prices _(demo done — real price feed, persistence, and a live leaderboard still needed)_
4. **SOOD token + pack shop live** — token launches externally (Pons); pack shop is
   pointed at it and `/packs` writes `buyPacks` _(blocked on the token launch)_
5. **Contests live** — Daily Lineup first, then Duels, once `PackOpened` is indexed
   into a real inventory instead of this browser's localStorage

Opened cards stay off-chain on purpose. The expensive object to get right first is
the sealed pack NFT.

## Disclaimer

HoodShares is an independent project. It is not affiliated with, endorsed by, or
sponsored by Robinhood Markets, Inc. or any company depicted in the collection. All
company names and ticker symbols are the property of their respective owners.
