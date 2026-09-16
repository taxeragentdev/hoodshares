import { CARDS } from "@/lib/cards";
import { copyIndexOf, pointsForPick, totalScore } from "@/lib/game/scoring";
import { sessionId } from "@/lib/game/sessionId";
import { buildPricePath, pctMoveAtProgress } from "@/lib/game/simulate";
import { ROUND_DURATION_MS, type SavedPlay } from "@/lib/game/types";
import type { PlayerRecord, PlayerSnapshot, RoundResult } from "@/lib/player";
import { livePctMove } from "@/lib/server/prices";
import type { SessionQuoteBook } from "@/lib/server/store";

export function snapshot(player: PlayerRecord): PlayerSnapshot {
  return {
    address: player.address,
    ticketHeld: Boolean(player.ticketHeld),
    ticketSerial: player.ticketSerial ?? null,
    freePackAvailable: Boolean(player.freePackAvailable),
    inventory: player.inventory,
    play: player.play,
    lastResult: player.results.at(-1) ?? null,
  };
}

export function stampLocks(
  prev: SavedPlay | null,
  next: SavedPlay,
  live: Record<string, number>,
): SavedPlay {
  return {
    ...next,
    lineup: next.lineup.map((pick) => {
      if (!pick.locked) {
        return { ...pick, lockedUsd: undefined };
      }
      const existing = prev?.lineup.find((row) => row.slotId === pick.slotId);
      if (existing?.locked && existing.lockedUsd != null) {
        return { ...pick, lockedUsd: existing.lockedUsd };
      }
      const usd = live[pick.cardId];
      return usd != null ? { ...pick, lockedUsd: usd } : pick;
    }),
  };
}

export function scoreSavedPlay(
  play: SavedPlay,
  book?: SessionQuoteBook | null,
): number {
  const cardIds = play.lineup.map((pick) => pick.cardId);
  const points = play.lineup.map((pick, index) => {
    const live = livePctMove(book ?? null, pick.cardId, pick.lockedUsd);
    const path = buildPricePath(`${play.roundId}:${pick.cardId}`);
    const pctMove = live ?? pctMoveAtProgress(path, pick.lockedAtProgress ?? 1);
    return pointsForPick(pctMove, pick.direction, copyIndexOf(cardIds, index));
  });
  return totalScore(points);
}

export function chipsFromPlay(play: SavedPlay) {
  return play.lineup.map((pick) => {
    const card = CARDS.find((item) => item.id === pick.cardId);
    return { ticker: card?.ticker ?? pick.cardId, direction: pick.direction };
  });
}

export function expireActivePlay(
  player: PlayerRecord,
  book?: SessionQuoteBook | null,
): void {
  const play = player.play;
  if (!play || play.phase !== "active") return;
  if (Date.now() - play.startedAt < ROUND_DURATION_MS) return;
  settlePlayerRound(player, book);
}

export function settlePlayerRound(
  player: PlayerRecord,
  book?: SessionQuoteBook | null,
): RoundResult | null {
  const play = player.play;
  if (!play || play.lineup.length === 0 || !play.roundId) return null;
  play.phase = "settled";
  const existing = player.results.find((row) => row.roundId === play.roundId);
  if (existing) return existing;
  const result: RoundResult = {
    sessionId: sessionId(),
    roundId: play.roundId,
    score: Math.round(scoreSavedPlay(play, book)),
    lineup: chipsFromPlay(play),
    settledAt: Date.now(),
  };
  player.results.push(result);
  return result;
}
