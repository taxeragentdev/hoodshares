"use client";

import { useEffect, useState } from "react";
import { cardTicker, CARDS } from "@/lib/cards";

interface TapeQuote {
  price: number;
  change: number;
}

export function TickerTape() {
  const [quotes, setQuotes] = useState<Record<string, TapeQuote>>({});
  const row = [...CARDS, ...CARDS];

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/prices");
        if (!response.ok) return;
        const data = (await response.json()) as {
          live?: Record<string, number>;
          book?: { open?: Record<string, number> } | null;
        };
        if (cancelled || !data.live) return;
        const next: Record<string, TapeQuote> = {};
        for (const [id, price] of Object.entries(data.live)) {
          const open = data.book?.open?.[id];
          next[id] = {
            price,
            change: open ? ((price - open) / open) * 100 : 0,
          };
        }
        setQuotes(next);
      } catch {
        /* keep the static tape */
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="border-line bg-surface relative overflow-hidden border-y py-3">
      <div className="from-void pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r to-transparent" />
      <div className="from-void pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l to-transparent" />

      <div className="animate-marquee flex w-max gap-8">
        {row.map((card, index) => {
          const live = quotes[card.id];
          const price = live?.price ?? card.price;
          const change = live?.change ?? card.change;
          const isUp = change >= 0;
          return (
            <span
              key={`${card.id}-${index}`}
              className="flex shrink-0 items-center gap-2.5 font-mono text-xs"
            >
              <span className="text-ink font-semibold tracking-wider">
                {cardTicker(card)}
              </span>
              <span className="text-ink-3 tabular">
                ${price.toFixed(2)}
              </span>
              <span
                className={`tabular font-medium ${isUp ? "text-up" : "text-down"}`}
              >
                {isUp ? "+" : "−"}
                {Math.abs(change).toFixed(2)}%
              </span>
              <span className="text-line-bright">/</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
