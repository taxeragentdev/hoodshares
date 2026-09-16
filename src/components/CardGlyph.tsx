import type { CardDefinition } from "@/lib/cards";
import { CUSTOM_LOGOS } from "./marks/logos.custom";
import { GENERATED_LOGOS } from "./marks/logos.generated";
import { MARK_OVERRIDES } from "./marks/overrides";
import { SECTOR_MARKS } from "./marks/sectors";
import type { Mark } from "./marks/types";

/**
 * Resolves the mark printed across a card face:
 *
 * 1. Official ticker logo (simple-icons, or a hand-traced brand mark)
 * 2. A leftover per-card override
 * 3. The sector mark — always defined, so a new card never renders blank
 */
function markFor(card: CardDefinition): Mark {
  return (
    GENERATED_LOGOS[card.ticker] ??
    CUSTOM_LOGOS[card.ticker] ??
    MARK_OVERRIDES[card.id] ??
    SECTOR_MARKS[card.sector]
  );
}

export function CardGlyph({
  card,
  className = "",
}: {
  card: CardDefinition;
  className?: string;
}) {
  const { viewBox, node } = markFor(card);
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden
    >
      {node}
    </svg>
  );
}
