import { getAddress, parseUnits } from "viem";
import { robinhoodChain } from "./chains";

/** Player-facing ticker for the protocol ERC-20. */
export const TOKEN_SYMBOL = "SOOD";

/** Robinhood Chain (4663) ERC-20. Name on chain is HoodShares. */
export const TOKEN_ADDRESS =
  "0xe5A8Fe54e0D367DB85Ebb1B9245BE8cB1EfBE7df" as `0x${string}`;

export const TOKEN_DECIMALS = 18;

/** Pons launchpad. Extra packs and Daily Lineup pull from this market. */
export const TOKEN_BUY_URL =
  "https://www.ponsfamily.com/launchpad/0xe5A8Fe54e0D367DB85Ebb1B9245BE8cB1EfBE7df";

/**
 * Wallet that receives pack and round payments.
 * Override with NEXT_PUBLIC_SOOD_TREASURY.
 */
export const TOKEN_TREASURY = getAddress(
  process.env.NEXT_PUBLIC_SOOD_TREASURY ??
    "0x579c3812621b9503AF46B56c579C4D92850a6DC0",
) as `0x${string}`;

export function tokenExplorerUrl(): string {
  return `${robinhoodChain.blockExplorers.default.url}/token/${TOKEN_ADDRESS}`;
}

/** Daily Lineup entry from Season 1. One payment per weekday round. */
export const ROUND_ENTRY = 5_000;
export const ROUND_ENTRY_LABEL = "5,000";
export const ROUND_ENTRY_WEI = parseUnits(String(ROUND_ENTRY), TOKEN_DECIMALS);
