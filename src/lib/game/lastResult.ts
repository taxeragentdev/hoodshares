import { payoutForRank, type LeaderboardRow, type LineupChip } from "./leaderboard";

export const LAST_RESULT_KEY = "hoodshares.lastResult.v1";

/** Used when the player finishes a demo round without a connected wallet. */
export const YOU_ADDRESS = "0x1111111111111111111111111111111111111111" as const;

export interface LastResult {
  score: number;
  lineup: LineupChip[];
  address: `0x${string}`;
}

export function saveLastResult(result: LastResult): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
}

export function loadLastResult(): LastResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LAST_RESULT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastResult>;
    if (typeof parsed.score !== "number" || !Array.isArray(parsed.lineup)) return null;
    const address =
      typeof parsed.address === "string" && parsed.address.startsWith("0x")
        ? (parsed.address as `0x${string}`)
        : YOU_ADDRESS;
    return { score: parsed.score, lineup: parsed.lineup, address };
  } catch {
    return null;
  }
}

export function isYouAddress(address: string, wallet?: string): boolean {
  if (address.toLowerCase() === YOU_ADDRESS.toLowerCase()) return true;
  if (wallet && address.toLowerCase() === wallet.toLowerCase()) return true;
  return false;
}

export function boardWithPlayer(
  board: LeaderboardRow[],
  player: LastResult | null,
): LeaderboardRow[] {
  if (!player) return board;
  const without = board.filter(
    (row) => row.address.toLowerCase() !== player.address.toLowerCase(),
  );
  const merged: LeaderboardRow[] = [
    ...without,
    {
      rank: 0,
      address: player.address,
      score: player.score,
      payout: 0,
      lineup: player.lineup,
    },
  ];
  merged.sort((a, b) => b.score - a.score);
  return merged.map((row, index) => ({
    ...row,
    rank: index + 1,
    payout: payoutForRank(index + 1),
  }));
}
