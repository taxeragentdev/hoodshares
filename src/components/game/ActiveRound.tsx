"use client";

import { AssetCard } from "@/components/AssetCard";
import { CARDS } from "@/lib/cards";
import { copyIndexOf, pointsForPick, totalScore, ROUND_SCORE_CAP } from "@/lib/game/scoring";
import type { LineupPick } from "@/lib/game/types";

interface ActiveRoundProps {
  lineup: LineupPick[];
  moves: Record<string, number | null>;
  progress: number;
  timeLeftLabel: string;
  onLock: (slotId: string) => void;
}

export function ActiveRound({
  lineup,
  moves,
  progress,
  timeLeftLabel,
  onLock,
}: ActiveRoundProps) {
  const cardIds = lineup.map((pick) => pick.cardId);

  const rows = lineup.map((pick, index) => {
    const card = CARDS.find((c) => c.id === pick.cardId)!;
    const pctMove = moves[pick.cardId] ?? 0;
    const copyIndex = copyIndexOf(cardIds, index);
    const points = pointsForPick(pctMove, pick.direction, copyIndex);
    const waiting = moves[pick.cardId] == null;
    return { pick, card, pctMove, copyIndex, points, waiting };
  });

  const total = totalScore(rows.map((row) => row.points));
  const lockedCount = lineup.filter((pick) => pick.locked).length;

  return (
    <div>
      <div className="text-center">
        <span className="bg-acid/15 text-acid rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
          Daily Lineup
        </span>
        <h2 className="font-display text-ink mt-3 text-2xl font-bold tracking-wide uppercase">
          Session live
        </h2>
        <p className="text-ink-3 mt-1 font-mono text-sm tabular">
          {timeLeftLabel} to the close, {lockedCount}/{lineup.length} locked
        </p>
      </div>

      <div className="bg-surface-3 mx-auto mt-5 h-1 max-w-md overflow-hidden rounded-full">
        <div
          className="bg-acid h-full transition-[width] duration-200"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mt-8 grid grid-cols-5 gap-2 sm:gap-4">
        {rows.map(({ pick, card, pctMove, copyIndex, points, waiting }) => (
          <div key={pick.slotId} className="flex flex-col">
            <div className="relative">
              <AssetCard card={card} size="md" locked={pick.locked} />
              <span
                className={`absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest shadow-md ${
                  pick.direction === "up" ? "bg-up text-black" : "bg-down text-white"
                }`}
              >
                {pick.direction === "up" ? "▲ UP" : "▼ DOWN"}
              </span>
              {copyIndex > 1 && (
                <span className="bg-down absolute -top-2.5 right-0 rounded px-1.5 py-1 font-mono text-[10px] font-bold text-white">
                  ×{copyIndex}
                </span>
              )}
            </div>

            <p
              className={`mt-2.5 text-center font-mono text-[13px] tabular ${
                waiting ? "text-ink-3" : pctMove >= 0 ? "text-up" : "text-down"
              }`}
            >
              {waiting
                ? "Waiting on tape"
                : `${pctMove >= 0 ? "+" : ""}${pctMove.toFixed(2)}%`}
            </p>
            <p
              className={`text-center font-mono text-base font-bold tabular ${points >= 0 ? "text-up" : "text-down"}`}
            >
              {points >= 0 ? "+" : ""}
              {points.toFixed(0)} pts
            </p>

            {pick.locked ? (
              <span className="border-acid/40 bg-acid/10 text-acid mt-2.5 rounded-lg border py-2.5 text-center font-mono text-xs font-bold tracking-widest uppercase">
                Locked
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onLock(pick.slotId)}
                className="border-line hover:border-acid hover:text-acid text-ink-2 mt-2.5 rounded-lg border py-2.5 font-mono text-xs font-bold tracking-widest uppercase transition-colors"
              >
                Lock
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="border-line bg-surface-2 mt-8 flex items-center justify-center gap-10 rounded-2xl border p-6">
        <div className="text-center">
          <p
            className={`font-display text-4xl font-bold tabular ${total >= 0 ? "text-up" : "text-down"}`}
          >
            {total >= 0 ? "+" : ""}
            {total.toFixed(0)}
          </p>
          <p className="text-ink-3 mt-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Points
          </p>
        </div>
        <div className="bg-line h-12 w-px" />
        <div className="text-center">
          <p className="font-display text-ink-3 text-4xl font-bold tabular">
            ±{ROUND_SCORE_CAP}
          </p>
          <p className="text-ink-3 mt-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Score cap
          </p>
        </div>
      </div>
    </div>
  );
}
