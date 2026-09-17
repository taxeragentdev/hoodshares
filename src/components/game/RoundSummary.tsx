"use client";

import Link from "next/link";
import { AssetCard } from "@/components/AssetCard";
import { CARDS } from "@/lib/cards";
import { copyIndexOf, pointsForPick, totalScore } from "@/lib/game/scoring";
import type { LineupPick } from "@/lib/game/types";

interface RoundSummaryProps {
  lineup: LineupPick[];
  moves: Record<string, number | null>;
  rank: number | null;
  canPlayAgain: boolean;
  onPlayAgain: () => void;
}

export function RoundSummary({
  lineup,
  moves,
  rank,
  canPlayAgain,
  onPlayAgain,
}: RoundSummaryProps) {
  const cardIds = lineup.map((pick) => pick.cardId);

  const rows = lineup.map((pick, index) => {
    const card = CARDS.find((c) => c.id === pick.cardId)!;
    const pctMove = moves[pick.cardId] ?? 0;
    const copyIndex = copyIndexOf(cardIds, index);
    const points = pointsForPick(pctMove, pick.direction, copyIndex);
    return { pick, card, points };
  });

  const total = totalScore(rows.map((row) => row.points));

  return (
    <div className="text-center">
      <span className="bg-acid/15 text-acid rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
        Session over
      </span>
      <h2 className="font-display text-ink mt-3 text-3xl font-bold tracking-wide uppercase">
        Settled at the close
      </h2>

      <div className="mt-8 grid grid-cols-5 gap-2 sm:gap-4">
        {rows.map(({ pick, card, points }) => (
          <div key={pick.slotId} className="flex flex-col">
            <AssetCard card={card} size="md" locked={pick.locked} />
            <p
              className={`mt-2.5 text-center font-mono text-base font-bold tabular ${points >= 0 ? "text-up" : "text-down"}`}
            >
              {points >= 0 ? "+" : ""}
              {points.toFixed(0)} pts
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-12">
        <div>
          <p
            className={`font-display text-5xl font-bold tabular ${total >= 0 ? "text-up" : "text-down"}`}
          >
            {total >= 0 ? "+" : ""}
            {total.toFixed(0)}
          </p>
          <p className="text-ink-3 mt-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Points
          </p>
        </div>
        <div>
          <p className="font-display text-ink text-5xl font-bold tabular">
            {rank != null ? `#${rank}` : "—"}
          </p>
          <p className="text-ink-3 mt-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Rank
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {canPlayAgain && (
          <button
            type="button"
            onClick={onPlayAgain}
            className="bg-acid hover:bg-acid-dim rounded-full px-10 py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors"
          >
            Set tomorrow
          </button>
        )}
        <Link
          href="/leaderboard"
          className="border-line hover:border-acid hover:text-acid text-ink-2 rounded-full border px-8 py-3.5 text-sm font-semibold transition-colors"
        >
          See the board
        </Link>
      </div>
    </div>
  );
}
