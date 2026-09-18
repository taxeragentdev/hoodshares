import { CARDS, type CardDefinition } from "./cards";
import { TOKEN_SYMBOL } from "./token";

/** One pack is one playable Daily Lineup. Extra packs are inventory. */
export const CARDS_PER_PACK = 5;

export const PACK_TOKEN_SYMBOL = TOKEN_SYMBOL;

/** Extra packs on HoodShares, paid in SOOD. HoodPass stays 0.0005 ETH on OpenSea. */
export const PACK_PRICE_HOOD = 50_000;
export const PACK_PRICE_HOOD_LABEL = "50,000";

export interface OpenedCard {
  card: CardDefinition;
}

/**
 * Builds a sealed pack of `CARDS_PER_PACK` cards. Each slot is a uniform
 * pick from the full 30-ticker roster, independent of the others, so all
 * five can be the same name. Deterministic given `seed` so a replay of
 * the same open always shows the same faces.
 */
export function openDemoPack(seed: string): OpenedCard[] {
  const rng = mulberry32(hashSeed(seed));
  return Array.from({ length: CARDS_PER_PACK }, () => ({
    card: CARDS[Math.floor(rng() * CARDS.length)]!,
  }));
}

export function openedFromIds(ids: string[]): OpenedCard[] {
  return ids.flatMap((id) => {
    const card = CARDS.find((item) => item.id === id);
    return card ? [{ card }] : [];
  });
}

function hashSeed(seed: string): number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
