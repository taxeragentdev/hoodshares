import type { Sector } from "@/lib/cards";
import { DRAWN_VIEWBOX, type Mark } from "./types";

/**
 * One mark per sector — the guaranteed floor for every card.
 *
 * Sector marks are the last fallback. Cards prefer the company's own
 * monochrome mark (`logos.generated.tsx` / `logos.custom.tsx`). These
 * shapes only print when a ticker has no logo yet.
 *
 * Because this is typed `Record<Sector, Mark>`, adding a sector to `SECTORS`
 * without drawing it here fails the build. That is the point: a new card is a
 * data row, and it is impossible for it to ship without a face.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function drawn(node: Mark["node"]): Mark {
  return { viewBox: DRAWN_VIEWBOX, node };
}

export const SECTOR_MARKS: Record<Sector, Mark> = {
  "Electric Mobility": drawn(
    <path d="M60 6 26 58h18l-6 38 34-54H54z" fill="currentColor" />,
  ),

  "Consumer Hardware": drawn(
    <>
      <rect x="28" y="10" width="44" height="80" rx="10" {...STROKE} />
      <circle cx="50" cy="76" r="5" fill="currentColor" />
    </>,
  ),

  Semiconductors: drawn(
    <>
      <rect x="28" y="28" width="44" height="44" rx="6" {...STROKE} />
      <rect x="44" y="44" width="12" height="12" fill="currentColor" />
      <path
        d="M38 28V14M62 28V14M38 86V72M62 86V72M28 38H14M28 62H14M86 38H72M86 62H72"
        {...STROKE}
      />
    </>,
  ),

  "E-Commerce": drawn(
    <>
      <path d="M50 12 84 30v40L50 88 16 70V30z" {...STROKE} />
      <path d="M16 30l34 18 34-18M50 48v40" {...STROKE} />
    </>,
  ),

  Software: drawn(
    <>
      <rect x="14" y="24" width="72" height="54" rx="9" {...STROKE} />
      <path d="M32 44l10 8-10 8M54 60h16" {...STROKE} strokeWidth={7} />
    </>,
  ),

  "Data & AI": drawn(
    <>
      <path d="M24 26 50 50l26-24M24 74 50 50l26 24" {...STROKE} />
      <circle cx="24" cy="26" r="10" fill="currentColor" />
      <circle cx="76" cy="26" r="10" fill="currentColor" />
      <circle cx="50" cy="50" r="12" fill="currentColor" />
      <circle cx="24" cy="74" r="10" fill="currentColor" />
      <circle cx="76" cy="74" r="10" fill="currentColor" />
    </>,
  ),

  Streaming: drawn(<path d="M32 18 84 50 32 82z" fill="currentColor" />),

  "Digital Assets": drawn(
    <>
      <ellipse cx="50" cy="32" rx="30" ry="12" {...STROKE} />
      <path d="M20 32v20c0 7 13 12 30 12s30-5 30-12V32" {...STROKE} />
      <path d="M20 52v16c0 7 13 12 30 12s30-5 30-12V52" {...STROKE} />
    </>,
  ),

  Fintech: drawn(
    <>
      <circle cx="50" cy="50" r="34" {...STROKE} />
      <path d="M50 68V34M36 46l14-14 14 14" {...STROKE} />
    </>,
  ),

  "Social Platforms": drawn(
    <>
      <circle cx="38" cy="50" r="24" {...STROKE} />
      <circle cx="62" cy="50" r="24" {...STROKE} />
    </>,
  ),

  "Search & Cloud": drawn(
    <>
      <circle cx="44" cy="44" r="26" {...STROKE} />
      <path d="M63 63 84 84" {...STROKE} />
    </>,
  ),

  "Meme & Retail": drawn(
    <>
      <path d="M50 10c22 0 38 16 38 36S72 82 50 90c-22-8-38-24-38-44S28 10 50 10z" {...STROKE} />
      <path d="M38 46l6 10 8-16 8 16 6-10" {...STROKE} />
    </>,
  ),

  "Quantum Computing": drawn(
    <>
      <circle cx="50" cy="50" r="10" fill="currentColor" />
      <ellipse cx="50" cy="50" rx="38" ry="16" {...STROKE} />
      <ellipse cx="50" cy="50" rx="38" ry="16" {...STROKE} transform="rotate(60 50 50)" />
      <ellipse cx="50" cy="50" rx="38" ry="16" {...STROKE} transform="rotate(120 50 50)" />
    </>,
  ),

  Gaming: drawn(
    <>
      <path d="M26 40h48a16 16 0 0 1 16 16v6a12 12 0 0 1-22 7l-6-9H38l-6 9a12 12 0 0 1-22-7v-6a16 16 0 0 1 16-16z" {...STROKE} />
      <path d="M40 48v12M34 54h12" {...STROKE} strokeWidth={7} />
      <circle cx="70" cy="50" r="3.5" fill="currentColor" />
      <circle cx="78" cy="58" r="3.5" fill="currentColor" />
    </>,
  ),

  "Health Tech": drawn(
    <>
      <path d="M50 86C26 70 12 54 12 36a20 20 0 0 1 38-9 20 20 0 0 1 38 9c0 18-14 34-38 50z" {...STROKE} />
      <path d="M32 46h10l6-14 8 22 6-8h8" {...STROKE} strokeWidth={7} />
    </>,
  ),

  Aerospace: drawn(
    <>
      <path d="M50 8 62 48l26 10-26 8-4 26-8-26-26-8 26-10z" fill="currentColor" />
      <path d="M28 72c8 8 20 12 22 12s14-4 22-12" {...STROKE} strokeWidth={7} />
    </>,
  ),

  Apparel: drawn(
    <>
      <path d="M22 28 38 16h24l16 12-10 10v46H32V38z" {...STROKE} />
      <path d="M38 16c0 10 24 10 24 0" {...STROKE} />
    </>,
  ),

  Media: drawn(
    <>
      <path d="M22 38h18l22-16v56L40 62H22z" fill="currentColor" />
      <path d="M70 36c8 6 8 22 0 28M80 28c14 12 14 32 0 44" {...STROKE} />
    </>,
  ),
};
