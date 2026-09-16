import { CARDS, type CardDefinition } from "./cards";

/** One pack is one playable Daily Lineup. Extra packs are inventory. */
export const CARDS_PER_PACK = 5;

/** Display ticker for the project's own ERC-20 until the Pons launch fills
 * `PACK_TOKEN_ADDRESS`. Not a claim that a token of this name exists yet. */
export const PACK_TOKEN_SYMBOL = "HOOD";

/** Demo-only price shown when the pack shop is not deployed. */
export const DEMO_PACK_PRICE = 100;

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
