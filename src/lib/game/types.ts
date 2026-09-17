export type Direction = "up" | "down";

/** One slot in a five-card lineup. The same card can appear more than once —
 * see `duplicateFactor` in `scoring.ts` for why that is risky rather than
 * simply better. */
export interface LineupPick {
  /** Unique per-slot id (not the card id) so duplicates render as distinct rows. */
  slotId: string;
  cardId: string;
  direction: Direction;
  locked: boolean;
  /** Round progress (0..1) at the moment the player pressed Lock. */
  lockedAtProgress?: number;
  /** Live USD at lock, when a Chainlink feed exists for this ticker. */
  lockedUsd?: number;
}

export type RoundPhase = "building" | "active" | "settled";

export const LINEUP_SIZE = 5;

export interface SavedPlay {
  phase: RoundPhase;
  lineup: LineupPick[];
  roundId: string;
  roundNumber: number;
  startedAt: number;
  slotCounter: number;
}
