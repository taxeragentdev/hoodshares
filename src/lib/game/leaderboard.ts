import { PACK_TOKEN_SYMBOL } from "@/lib/packs";
import type { Direction } from "./types";

/** Share of each session's HOOD prize pool, top 10 only. The rest of the
 * field scores for rank, not payout — same Merkle-claim path as ETH prizes
 * once the token exists. */
export const LEADERBOARD_PAYOUT_BPS = [
  4000, 2000, 1200, 800, 500, 400, 400, 300, 200, 200,
] as const;

export const DEMO_PRIZE_POOL = 10_000;
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

export function payoutForRank(rank: number, pool = DEMO_PRIZE_POOL): number {
  const bps = LEADERBOARD_PAYOUT_BPS[rank - 1];
  if (bps === undefined) return 0;
  return (pool * bps) / 10_000;
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Deterministic demo board so /leaderboard is not an empty state. Live
 * ranks will come from the scoring job once sessions persist. */
export const DEMO_LEADERBOARD: LeaderboardRow[] = [
  {
    rank: 1,
    address: "0xA11CE0000000000000000000000000000000f3a1",
    score: 1840,
    payout: payoutForRank(1),
    lineup: [
      { ticker: "NVDA", direction: "up" },
      { ticker: "TSLA", direction: "up" },
      { ticker: "GME", direction: "up" },
      { ticker: "PLTR", direction: "down" },
      { ticker: "IONQ", direction: "up" },
    ],
  },
  {
    rank: 2,
    address: "0xB0B000000000000000000000000000000000091c",
    score: 1622,
    payout: payoutForRank(2),
    lineup: [
      { ticker: "SPCX", direction: "up" },
      { ticker: "AMD", direction: "up" },
      { ticker: "MU", direction: "up" },
      { ticker: "INTC", direction: "down" },
      { ticker: "SOFI", direction: "up" },
    ],
  },
  {
    rank: 3,
    address: "0xCAFE000000000000000000000000000000000007",
    score: 1490,
    payout: payoutForRank(3),
    lineup: [
      { ticker: "META", direction: "down" },
      { ticker: "AAPL", direction: "up" },
      { ticker: "MSFT", direction: "up" },
      { ticker: "GOOGL", direction: "up" },
      { ticker: "AMZN", direction: "down" },
    ],
  },
  {
    rank: 4,
    address: "0xD00D000000000000000000000000000000000044",
    score: 1311,
    payout: payoutForRank(4),
    lineup: [
      { ticker: "COIN", direction: "up" },
      { ticker: "GLXY", direction: "up" },
      { ticker: "CRCL", direction: "down" },
      { ticker: "MSTR", direction: "up" },
      { ticker: "HIMS", direction: "up" },
    ],
  },
  {
    rank: 5,
    address: "0xEE00000000000000000000000000000000000018",
    score: 1184,
    payout: payoutForRank(5),
    lineup: [
      { ticker: "NFLX", direction: "up" },
      { ticker: "RBLX", direction: "up" },
      { ticker: "SNAP", direction: "down" },
      { ticker: "SHOP", direction: "up" },
      { ticker: "LULU", direction: "down" },
    ],
  },
  {
    rank: 6,
    address: "0xF0000000000000000000000000000000000000c2",
    score: 990,
    payout: payoutForRank(6),
    lineup: [
      { ticker: "BABA", direction: "up" },
      { ticker: "AMC", direction: "up" },
      { ticker: "GME", direction: "down" },
      { ticker: "DJT", direction: "down" },
      { ticker: "RIVN", direction: "up" },
    ],
  },
  {
    rank: 7,
    address: "0x11000000000000000000000000000000000000ab",
    score: 875,
    payout: payoutForRank(7),
    lineup: [
      { ticker: "TSLA", direction: "down" },
      { ticker: "RIVN", direction: "up" },
      { ticker: "AMD", direction: "up" },
      { ticker: "SNDK", direction: "up" },
      { ticker: "INTC", direction: "up" },
    ],
  },
  {
    rank: 8,
    address: "0x22000000000000000000000000000000000000de",
    score: 640,
    payout: payoutForRank(8),
    lineup: [
      { ticker: "AAPL", direction: "down" },
      { ticker: "NVDA", direction: "down" },
      { ticker: "MSFT", direction: "down" },
      { ticker: "GOOGL", direction: "down" },
      { ticker: "META", direction: "up" },
    ],
  },
  {
    rank: 9,
    address: "0x3300000000000000000000000000000000000090",
    score: 410,
    payout: payoutForRank(9),
    lineup: [
      { ticker: "SOFI", direction: "down" },
      { ticker: "PLTR", direction: "up" },
      { ticker: "IONQ", direction: "down" },
      { ticker: "SPCX", direction: "up" },
      { ticker: "COIN", direction: "down" },
    ],
  },
  {
    rank: 10,
    address: "0x440000000000000000000000000000000000001f",
    score: 188,
    payout: payoutForRank(10),
    lineup: [
      { ticker: "HIMS", direction: "down" },
      { ticker: "LULU", direction: "up" },
      { ticker: "SHOP", direction: "down" },
      { ticker: "NFLX", direction: "down" },
      { ticker: "AMZN", direction: "up" },
    ],
  },
  {
    rank: 11,
    address: "0x5500000000000000000000000000000000000077",
    score: 42,
    payout: 0,
    lineup: [
      { ticker: "GME", direction: "down" },
      { ticker: "AMC", direction: "down" },
      { ticker: "DJT", direction: "up" },
      { ticker: "SNAP", direction: "up" },
      { ticker: "RBLX", direction: "down" },
    ],
  },
  {
    rank: 12,
    address: "0x66000000000000000000000000000000000000e4",
    score: -85,
    payout: 0,
    lineup: [
      { ticker: "MU", direction: "down" },
      { ticker: "SNDK", direction: "down" },
      { ticker: "INTC", direction: "up" },
      { ticker: "AMD", direction: "down" },
      { ticker: "NVDA", direction: "down" },
    ],
  },
  {
    rank: 13,
    address: "0x77000000000000000000000000000000000000b9",
    score: -210,
    payout: 0,
    lineup: [
      { ticker: "TSLA", direction: "up" },
      { ticker: "TSLA", direction: "up" },
      { ticker: "RIVN", direction: "down" },
      { ticker: "SPCX", direction: "down" },
      { ticker: "AMC", direction: "up" },
    ],
  },
  {
    rank: 14,
    address: "0x8800000000000000000000000000000000000031",
    score: -364,
    payout: 0,
    lineup: [
      { ticker: "MSTR", direction: "down" },
      { ticker: "COIN", direction: "down" },
      { ticker: "GLXY", direction: "down" },
      { ticker: "CRCL", direction: "up" },
      { ticker: "BABA", direction: "down" },
    ],
  },
];

export const DEMO_PLAYER_COUNT = DEMO_LEADERBOARD.length;
export const DEMO_TOP_SCORE = DEMO_LEADERBOARD[0]?.score ?? 0;

export { PACK_TOKEN_SYMBOL as REWARD_TOKEN };
