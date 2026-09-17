import type { Inventory } from "@/lib/inventory";
import type { LineupChip } from "@/lib/game/leaderboard";
import type { SavedPlay } from "@/lib/game/types";

export interface RoundResult {
  sessionId: string;
  roundId: string;
  score: number;
  lineup: LineupChip[];
  settledAt: number;
}

export interface PlayerRecord {
  address: `0x${string}`;
  ticketHeld: boolean;
  ticketSerial: string | null;
  /** True until the included pack from HoodPass is claimed. */
  freePackAvailable: boolean;
  /** Stays true after the included pack is claimed so extra HoodPass tokens cannot grant another. */
  includedPackClaimed: boolean;
  inventory: Inventory;
  play: SavedPlay | null;
  results: RoundResult[];
}

export interface PlayerSnapshot {
  address: `0x${string}`;
  ticketHeld: boolean;
  ticketSerial: string | null;
  freePackAvailable: boolean;
  inventory: Inventory;
  play: SavedPlay | null;
  lastResult: RoundResult | null;
}
