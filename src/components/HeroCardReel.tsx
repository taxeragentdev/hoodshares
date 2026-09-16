"use client";

import { useEffect, useState } from "react";
import { AssetCard } from "@/components/AssetCard";
import { CARDS } from "@/lib/cards";

const FEATURED_IDS = ["tsla", "nvda", "gme", "aapl"] as const;

const DECK = FEATURED_IDS.map((id) => CARDS.find((card) => card.id === id)).filter(
  (card): card is NonNullable<typeof card> => Boolean(card),
);

export function HeroCardReel() {
  const [front, setFront] = useState(0);
  const count = DECK.length;

  useEffect(() => {
    if (count < 2) return;
    const tick = window.setInterval(() => {
      setFront((current) => (current + 1) % count);
    }, 2800);
    return () => window.clearInterval(tick);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[340px] pointer-events-none select-none sm:h-[460px] sm:max-w-[380px]">
      {DECK.map((card, index) => {
        const offset = (index - front + count) % count;
        const pose =
          offset === 0
            ? { x: 0, y: 0, rotate: -4, scale: 1, opacity: 1, z: 30 }
            : offset === 1
              ? { x: 48, y: 16, rotate: 11, scale: 0.9, opacity: 0.94, z: 20 }
              : offset === count - 1
                ? { x: -48, y: 16, rotate: -16, scale: 0.9, opacity: 0.9, z: 18 }
                : { x: 0, y: 28, rotate: 2, scale: 0.78, opacity: 0, z: 8 };

        return (
          <div
            key={card.id}
            className="absolute top-4 left-1/2 w-[210px] origin-bottom transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[236px]"
            style={{
              zIndex: pose.z,
              opacity: pose.opacity,
              transform: `translateX(calc(-50% + ${pose.x}px)) translateY(${pose.y}px) rotate(${pose.rotate}deg) scale(${pose.scale})`,
            }}
          >
            <AssetCard card={card} size="lg" />
          </div>
        );
      })}
    </div>
  );
}
