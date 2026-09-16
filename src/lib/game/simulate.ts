/**
 * Deterministic price path generator for the demo round. In production this
 * is replaced entirely by real closing-price deltas from the Chainlink feeds
 * already on Robinhood Chain — everything here exists so the Lock mechanic
 * and scoring can be demonstrated end to end without a live feed.
 *
 * The path is seeded, so every viewer of the same round id sees the exact
 * same price movement for a given card — nobody is watching a private
 * random number generator that could be manipulated after the fact.
 */

const STEPS = 240;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cumulative percent-move path for one card across a full round, sampled at
 * `STEPS` points from 0% at the open. */
export function buildPricePath(seed: string, volatility = 8): number[] {
  const random = mulberry32(hashSeed(seed));
  const path: number[] = [0];
  let cumulative = 0;
  for (let i = 1; i <= STEPS; i++) {
    // A small mean-reverting pull keeps paths from wandering to implausible
    // extremes over the compressed demo timescale.
    const pull = -cumulative * 0.01;
    const step = (random() - 0.5) * volatility * 0.12 + pull;
    cumulative += step;
    path.push(cumulative);
  }
  return path;
}

export function pctMoveAtProgress(path: number[], progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  const position = clamped * (path.length - 1);
  const lower = Math.floor(position);
  const upper = Math.min(path.length - 1, Math.ceil(position));
  const frac = position - lower;
  return path[lower] + (path[upper] - path[lower]) * frac;
}
