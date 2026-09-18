import { PACK_TOKEN_SYMBOL } from "@/lib/packs";
import type { Direction } from "./types";

/** Share of the weekly SOOD prize pool, top 10 only. Rank 11+ is rank only. */
export const LEADERBOARD_PAYOUT_BPS = [
  4000, 2000, 1200, 800, 500, 400, 400, 300, 200, 200,
] as const;

/** SOOD paid this week. Stays 0 until the prize pool is funded. */
export const WEEKLY_PRIZE_POOL = 0;
export const SESSION_PRIZE_POOL = WEEKLY_PRIZE_POOL;
export const PAID_RANKS = LEADERBOARD_PAYOUT_BPS.length;

export interface LineupChip {
  ticker: string;
  direction: Direction;
}

export interface LeaderboardRow {
  rank: number;
  address: `0x${string}`;
  score: number;
  payout: number;
  lineup: LineupChip[];
}

export interface LeaderboardEntry {
  address: `0x${string}`;
  score: number;
  lineup: LineupChip[];
}

export function payoutForRank(rank: number, pool = SESSION_PRIZE_POOL): number {
  const bps = LEADERBOARD_PAYOUT_BPS[rank - 1];
  if (bps === undefined) return 0;
  return (pool * bps) / 10_000;
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function buildLeaderboard(entries: LeaderboardEntry[]): LeaderboardRow[] {
  return [...entries]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      rank: index + 1,
      address: entry.address,
      score: entry.score,
      payout: payoutForRank(index + 1),
      lineup: entry.lineup,
    }));
}

export { PACK_TOKEN_SYMBOL as REWARD_TOKEN };
