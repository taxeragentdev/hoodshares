import { robinhoodChain } from "./chains";

/** Player-facing ticker for the protocol ERC-20. */
export const TOKEN_SYMBOL = "SOOD";

/** Robinhood Chain (4663) ERC-20. Name on chain is HoodShares. */
export const TOKEN_ADDRESS =
  "0xe5A8Fe54e0D367DB85Ebb1B9245BE8cB1EfBE7df" as `0x${string}`;

export function tokenExplorerUrl(): string {
  return `${robinhoodChain.blockExplorers.default.url}/token/${TOKEN_ADDRESS}`;
}

/** Daily Lineup entry from Season 1. One payment per weekday round. */
export const ROUND_ENTRY = 5_000;
export const ROUND_ENTRY_LABEL = "5,000";
