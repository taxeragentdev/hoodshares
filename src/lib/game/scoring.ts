import type { Direction } from "./types";

export const POINTS_PER_PERCENT = 100;
export const ROUND_SCORE_CAP = 2_500;

/**
 * Risk scaling for repeating the same card in a lineup. Copy 1 is full
 * value; every copy after that keeps less of a gain and loses more on a
 * miss. This is what makes "just pick your best card five times" a losing
 * strategy instead of the obvious optimal play.
 */
const PROFIT_FACTOR_BY_COPY = [1, 0.75, 0.5, 0.25, 0] as const;
const LOSS_FACTOR_BY_COPY = [1, 1.25, 1.5, 1.75, 2] as const;

export function duplicateFactor(copyIndex: number, isProfit: boolean): number {
  const clamped = Math.min(Math.max(copyIndex, 1), 5) - 1;
  return isProfit ? PROFIT_FACTOR_BY_COPY[clamped] : LOSS_FACTOR_BY_COPY[clamped];
}

/** Raw points before the duplicate penalty.
 *
 * `pctMove` is the stock's percentage change from the official 09:30 ET
 * open to either the player's lock or the 16:00 ET close. A correct UP
 * call profits from a rise, a correct DOWN call profits from a fall —
 * both scored the same way, so there is no permanent bull-market bias.
 * Every ticker scores the same; foil on the card face does not multiply. */
export function rawPoints(pctMove: number, direction: Direction): number {
  const directional = direction === "up" ? pctMove : -pctMove;
  return directional * POINTS_PER_PERCENT;
}

export function pointsForPick(pctMove: number, direction: Direction, copyIndex: number): number {
  const points = rawPoints(pctMove, direction);
  return points * duplicateFactor(copyIndex, points >= 0);
}

/** Total lineup score, capped both ways so no single volatile card can turn
 * a session into a lottery ticket. */
export function totalScore(cardPoints: number[]): number {
  const sum = cardPoints.reduce((total, points) => total + points, 0);
  return Math.max(-ROUND_SCORE_CAP, Math.min(ROUND_SCORE_CAP, sum));
}

/** Occurrence count (1-based) of `cardId` up to and including `slotIndex`. */
export function copyIndexOf(cardIds: string[], slotIndex: number): number {
  const cardId = cardIds[slotIndex];
  let count = 0;
  for (let i = 0; i <= slotIndex; i++) {
    if (cardIds[i] === cardId) count += 1;
  }
  return count;
}
