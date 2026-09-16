import { DRAWN_VIEWBOX, type Mark } from "./types";

/**
 * Bespoke art for individual cards, keyed by card id. Highest priority in the
 * lookup, so an entry here beats the sector mark.
 *
 * The only reason to add one: a second (or third, or fourth) card in a
 * sector that already has a card, so they don't all print the same face.
 * Semiconductors has four cards below (`nvda` keeps the sector die; `amd`,
 * `intc`, and `mu` each get their own) for exactly that reason.
 *
 * Everything else should stay out of here. A card with no override is the
 * normal case, not an unfinished one.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const MARK_OVERRIDES: Record<string, Mark> = {
  amd: {
    viewBox: DRAWN_VIEWBOX,
    node: <path d="M22 34 50 14l28 20M22 56 50 36l28 20M22 78 50 58l28 20" {...STROKE} />,
  },
  intc: {
    viewBox: DRAWN_VIEWBOX,
    node: (
      <>
        <circle cx="50" cy="50" r="30" {...STROKE} />
        <path d="M50 26v-8M50 82v-8M26 50h-8M82 50h-8" {...STROKE} />
      </>
    ),
  },
  mu: {
    viewBox: DRAWN_VIEWBOX,
    node: (
      <>
        <rect x="18" y="18" width="28" height="28" {...STROKE} />
        <rect x="54" y="18" width="28" height="28" {...STROKE} />
        <rect x="18" y="54" width="28" height="28" {...STROKE} />
        <rect x="54" y="54" width="28" height="28" {...STROKE} />
      </>
    ),
  },
};
