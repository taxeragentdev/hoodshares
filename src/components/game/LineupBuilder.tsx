"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AssetCard } from "@/components/AssetCard";
import { CARDS, cardTicker, type CardDefinition } from "@/lib/cards";
import { LINEUP_SIZE, type Direction, type LineupPick } from "@/lib/game/types";

interface LineupBuilderProps {
  lineup: LineupPick[];
  owned: Record<string, number>;
  onAdd: (cardId: string) => void;
  onRemove: (slotId: string) => void;
  onToggleDirection: (slotId: string) => void;
  onStart: () => void;
  startLabel?: string;
  startEnabled?: boolean;
}

export function LineupBuilder({
  lineup,
  owned,
  onAdd,
  onRemove,
  onToggleDirection,
  onStart,
  startLabel = "Lock lineup",
  startEnabled = true,
}: LineupBuilderProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const isFull = lineup.length >= LINEUP_SIZE;
  const held = CARDS.filter((card) => (owned[card.id] ?? 0) > 0);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [pickerOpen]);

  useEffect(() => {
    if (isFull) setPickerOpen(false);
  }, [isFull]);

  if (held.length === 0) {
    return (
      <div className="border-line bg-surface-2 rounded-2xl border p-8 text-center">
        <h2 className="font-display text-ink text-xl font-bold">No cards yet</h2>
        <p className="text-ink-2 mx-auto mt-2 max-w-md text-sm leading-relaxed">
          Daily Lineup uses the cards you pulled from packs. Open a pack
          first, then come back and set five calls.
        </p>
        <Link
          href="/packs"
          className="bg-acid hover:bg-acid-dim mt-6 inline-block rounded-full px-6 py-3 text-sm font-bold tracking-wide text-black uppercase transition-colors"
        >
          Open a pack
        </Link>
      </div>
    );
  }

  function remainingFor(cardId: string) {
    const total = owned[cardId] ?? 0;
    const used = lineup.filter((pick) => pick.cardId === cardId).length;
    return { total, used, remaining: total - used };
  }

  function handlePick(cardId: string) {
    onAdd(cardId);
    setPickerOpen(false);
  }

  return (
    <div>
      <div className="border-line bg-surface-2 rounded-2xl border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-ink text-sm font-bold tracking-wide uppercase">
            Your hand
          </h2>
          <span className="text-ink-3 font-mono text-xs">
            {lineup.length}/{LINEUP_SIZE}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {Array.from({ length: LINEUP_SIZE }).map((_, i) => {
            const pick = lineup[i];
            if (!pick) {
              return (
                <button
                  key={`empty-${i}`}
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  aria-label={`Add a card to slot ${i + 1}`}
                  className="border-line/60 text-ink-2 hover:border-acid/50 hover:bg-acid/6 flex aspect-[5/8] flex-col items-center justify-center gap-3 rounded-xl border border-dashed transition-colors"
                >
                  <span
                    aria-hidden
                    className="border-line-bright text-acid flex h-10 w-10 items-center justify-center rounded-full border text-2xl leading-none"
                  >
                    +
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase">
                    Add
                  </span>
                </button>
              );
            }
            const card = CARDS.find((c) => c.id === pick.cardId)!;
            return (
              <div key={pick.slotId} className="flex flex-col gap-2">
                <div className="relative">
                  <AssetCard card={card} size="md" />
                  <button
                    type="button"
                    onClick={() => onRemove(pick.slotId)}
                    aria-label={`Remove ${cardTicker(card)}`}
                    className="border-surface-3 hover:bg-down absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-black text-sm leading-none text-white shadow-md transition-colors"
                  >
                    ×
                  </button>
                </div>
                <DirectionToggle
                  direction={pick.direction}
                  onClick={() => onToggleDirection(pick.slotId)}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!isFull || !startEnabled}
          onClick={onStart}
          className="bg-acid hover:bg-acid-dim mt-5 w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-25"
        >
          {isFull ? startLabel : `Pick ${LINEUP_SIZE - lineup.length} more`}
        </button>
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="font-display text-ink text-sm font-bold tracking-wide uppercase">
            Your collection
          </h2>
          <p className="text-ink-3 mt-1 text-xs">
            You need a copy for each slot. Repeating a ticker keeps less of a
            win and costs more on a miss. You can also tap an empty slot above.
          </p>
        </div>

        <CardGrid
          cards={held}
          remainingFor={remainingFor}
          blocked={(cardId) => isFull || remainingFor(cardId).remaining <= 0}
          onPick={onAdd}
        />
      </div>

      {pickerOpen && (
        <CardPicker
          cards={held}
          remainingFor={remainingFor}
          onPick={handlePick}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function CardGrid({
  cards,
  remainingFor,
  blocked,
  onPick,
}: {
  cards: CardDefinition[];
  remainingFor: (cardId: string) => { total: number; used: number; remaining: number };
  blocked: (cardId: string) => boolean;
  onPick: (cardId: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {cards.map((card) => {
        const { total, used, remaining } = remainingFor(card.id);
        const isBlocked = blocked(card.id);
        return (
          <AssetCard
            key={card.id}
            card={card}
            size="md"
            interactive={!isBlocked}
            badge={remaining < total ? `${used}/${total}` : `×${total}`}
            onClick={isBlocked ? undefined : () => onPick(card.id)}
            className={isBlocked ? "opacity-75" : ""}
          />
        );
      })}
    </div>
  );
}

function CardPicker({
  cards,
  remainingFor,
  onPick,
  onClose,
}: {
  cards: CardDefinition[];
  remainingFor: (cardId: string) => { total: number; used: number; remaining: number };
  onPick: (cardId: string) => void;
  onClose: () => void;
}) {
  const available = cards.filter((card) => remainingFor(card.id).remaining > 0);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pick-card-title"
        className="border-line bg-surface max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3
              id="pick-card-title"
              className="font-display text-ink text-lg font-bold tracking-tight"
            >
              Your cards
            </h3>
            <p className="text-ink-3 mt-1 text-sm">
              Pick a copy to put in this slot.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close card picker"
            className="border-line text-ink-2 hover:text-ink hover:bg-surface-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg leading-none"
          >
            ×
          </button>
        </div>

        {available.length === 0 ? (
          <p className="text-ink-2 py-10 text-center text-sm">
            Every copy is already in the hand.
          </p>
        ) : (
          <CardGrid
            cards={available}
            remainingFor={remainingFor}
            blocked={() => false}
            onPick={onPick}
          />
        )}
      </div>
    </div>
  );
}

function DirectionToggle({
  direction,
  onClick,
}: {
  direction: Direction;
  onClick: () => void;
}) {
  const isUp = direction === "up";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Change call, currently ${isUp ? "up" : "down"}`}
      className={`flex w-full items-center justify-center gap-1.5 rounded-lg border py-2.5 font-mono text-xs font-bold tracking-widest transition-colors ${
        isUp
          ? "border-up/40 bg-up/15 text-up hover:bg-up/25"
          : "border-down/40 bg-down/15 text-down hover:bg-down/25"
      }`}
    >
      <span aria-hidden className="text-[10px]">
        {isUp ? "▲" : "▼"}
      </span>
      {isUp ? "UP" : "DOWN"}
    </button>
  );
}
