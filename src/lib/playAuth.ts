import { CARDS, cardTicker } from "@/lib/cards";
import { sessionId } from "@/lib/game/sessionId";
import type { LineupPick, SavedPlay } from "@/lib/game/types";

export type PlayIntent = "save" | "lock";

export function lineupDigest(picks: LineupPick[]): string {
  return picks
    .map((pick) => {
      const card = CARDS.find((item) => item.id === pick.cardId);
      const ticker = card ? cardTicker(card) : pick.cardId;
      const call = pick.direction === "up" ? "UP" : "DOWN";
      const lock = pick.locked ? " LOCKED" : "";
      return `${ticker} ${call}${lock}`;
    })
    .join(", ");
}

export function saveLineupMessage(
  address: string,
  nonce: string,
  play: SavedPlay,
): string {
  return [
    "HoodShares",
    "",
    "Save this Daily Lineup to this wallet.",
    "",
    `Wallet: ${address}`,
    `Session: ${play.roundId || sessionId()}`,
    `Lineup: ${lineupDigest(play.lineup)}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

export function lockCardMessage(
  address: string,
  nonce: string,
  play: SavedPlay,
  lockedSlotId: string,
): string {
  const pick = play.lineup.find((row) => row.slotId === lockedSlotId);
  const card = pick ? CARDS.find((item) => item.id === pick.cardId) : undefined;
  const locked = card && pick
    ? `${cardTicker(card)} ${pick.direction === "up" ? "UP" : "DOWN"}`
    : lockedSlotId;
  return [
    "HoodShares",
    "",
    "Lock this card until the close.",
    "",
    `Wallet: ${address}`,
    `Session: ${play.roundId || sessionId()}`,
    `Card: ${locked}`,
    `Lineup: ${lineupDigest(play.lineup)}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

export function playActionMessage(
  intent: PlayIntent,
  address: string,
  nonce: string,
  play: SavedPlay,
  lockedSlotId?: string,
): string {
  if (intent === "lock") {
    return lockCardMessage(address, nonce, play, lockedSlotId ?? "");
  }
  return saveLineupMessage(address, nonce, play);
}
