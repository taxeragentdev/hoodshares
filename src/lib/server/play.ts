import { CARDS } from "@/lib/cards";
import { copyIndexOf, pointsForPick, totalScore } from "@/lib/game/scoring";
import { sessionPhase } from "@/lib/game/session";
import { nextSessionId, sessionId } from "@/lib/game/sessionId";
import { LINEUP_SIZE, type SavedPlay } from "@/lib/game/types";
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
    nextPlay: player.nextPlay ?? null,
    lastResult: player.results.at(-1) ?? null,
    paidRounds: player.paidRounds ?? {},
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
    return pointsForPick(live ?? 0, pick.direction, copyIndexOf(cardIds, index));
  });
  return totalScore(points);
}

export function chipsFromPlay(play: SavedPlay) {
  return play.lineup.map((pick) => {
    const card = CARDS.find((item) => item.id === pick.cardId);
    return { ticker: card?.ticker ?? pick.cardId, direction: pick.direction };
  });
}

export function queuedRoundNumber(player: PlayerRecord): number {
  return (player.play?.roundNumber || 1) + 1;
}

/** Settle leftover rounds, promote a queued lineup at the open, drop stale drafts. */
export function syncPlayState(
  player: PlayerRecord,
  book?: SessionQuoteBook | null,
): void {
  reopenPrematureSettle(player);
  expireActivePlay(player, book);
  migrateBuildingPlay(player);
  promoteNextPlay(player);
  const today = sessionId();
  const market = sessionPhase();
  if (player.nextPlay && player.nextPlay.roundId && player.nextPlay.roundId < today) {
    player.nextPlay = null;
  }
  if (
    player.nextPlay &&
    player.nextPlay.roundId === today &&
    (market === "closed" || market === "weekend")
  ) {
    player.nextPlay = { ...player.nextPlay, roundId: nextSessionId() };
  }
}

/**
 * The play page used to boot with market = closed, then POST /api/play/settle
 * on first paint. That closed a live NYSE session. If today's play was
 * settled while the cash tape is still open, put it back.
 */
function reopenPrematureSettle(player: PlayerRecord): void {
  const play = player.play;
  if (!play || play.phase !== "settled") return;
  if (play.roundId !== sessionId()) return;
  if (sessionPhase() !== "open") return;
  play.phase = "active";
  player.results = player.results.filter((row) => row.roundId !== play.roundId);
}

function migrateBuildingPlay(player: PlayerRecord): void {
  const play = player.play;
  if (!play || play.phase !== "building") return;
  const today = sessionId();
  const market = sessionPhase();
  if (
    market === "open" &&
    play.lineup.length >= LINEUP_SIZE &&
    (play.roundId === today || !play.roundId)
  ) {
    play.phase = "active";
    play.roundId = today;
    return;
  }
  const queued: SavedPlay = {
    ...play,
    phase: "building",
    roundId: play.roundId && play.roundId >= today ? play.roundId : nextSessionId(),
  };
  if (!player.nextPlay || player.nextPlay.lineup.length === 0) {
    player.nextPlay = queued;
  }
  player.play = null;
}

function promoteNextPlay(player: PlayerRecord): void {
  if (sessionPhase() !== "open") return;
  const today = sessionId();
  const next = player.nextPlay;
  if (!next || next.roundId !== today) return;
  if (next.lineup.length < LINEUP_SIZE) {
    player.nextPlay = null;
    return;
  }
  if (player.play && player.play.roundId === today) {
    player.nextPlay = null;
    return;
  }
  player.play = { ...next, phase: "active", roundId: today };
  player.nextPlay = null;
}

export function expireActivePlay(
  player: PlayerRecord,
  book?: SessionQuoteBook | null,
): void {
  const play = player.play;
  if (!play || play.lineup.length < LINEUP_SIZE) return;
  if (play.phase === "settled") return;

  const today = sessionId();
  const market = sessionPhase();
  const isTodaysLineup = play.roundId === today;
  const sessionOver = market === "closed" || market === "weekend";
  const leftoverFromPriorDay = Boolean(play.roundId) && play.roundId !== today;

  if (leftoverFromPriorDay || (isTodaysLineup && sessionOver)) {
    settlePlayerRound(player, book);
  }
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
    sessionId: play.roundId || sessionId(),
    roundId: play.roundId,
    score: Math.round(scoreSavedPlay(play, book)),
    lineup: chipsFromPlay(play),
    settledAt: Date.now(),
  };
  player.results.push(result);
  return result;
}
