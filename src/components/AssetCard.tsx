"use client";

import { useRef, useState, type ReactNode } from "react";
import { cardCompany, cardTicker, type CardDefinition } from "@/lib/cards";
import { CardGlyph } from "./CardGlyph";

type CardSize = "md" | "lg";

interface AssetCardProps {
  card: CardDefinition;
  size?: CardSize;
  /** 3D tilt on pointer move. Off for dense grids and lineup slots. */
  interactive?: boolean;
  /** Small pill in the top-right corner — copy count, points, anything. */
  badge?: ReactNode;
  /** Dims and chains the face, used for locked cards mid-round. */
  locked?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

/** Footer type has to stay legible at the width each tier actually renders at:
 * `md` around 150–180px in grids and hand slots, `lg` as hero art. */
const SIZE = {
  md: {
    frame: "rounded-xl p-[5px]",
    face: "rounded-lg",
    ticker: "text-[15px]",
    sector: "text-[11px]",
    footer: "px-2 pt-2 pb-1.5",
  },
  lg: {
    frame: "rounded-2xl p-[6px]",
    face: "rounded-xl",
    ticker: "text-xl",
    sector: "text-[13px]",
    footer: "px-2.5 pt-2.5 pb-2",
  },
} as const;

/** Deterministic pseudo-noise so each card's chart motif is its own but
 * never changes between renders or between viewers. */
function seededNoise(seed: string, index: number): number {
  let hash = 2166136261;
  const input = `${seed}:${index}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

/** The angular chart motif behind the ticker, drawn across the full 100x140
 * face. Generated from the card's own id, so a new asset needs a ticker and
 * a colour rather than commissioned artwork. */
function chartPath(seed: string): string {
  const points = 7;
  const step = 100 / (points - 1);
  let path = "";
  for (let i = 0; i < points; i++) {
    const x = i * step;
    const y = 34 + seededNoise(seed, i) * 72;
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return path;
}

export function AssetCard({
  card,
  size = "md",
  interactive = false,
  badge,
  locked = false,
  selected = false,
  onClick,
  className = "",
}: AssetCardProps) {
  const s = SIZE[size];
  const ticker = cardTicker(card);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);

  const face = card.accent2
    ? `linear-gradient(135deg, ${card.accent} 0%, ${card.accent2} 100%)`
    : card.accent;

  function handlePointerMove(event: React.PointerEvent) {
    if (!interactive || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 12, y: px * 12 });
  }

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      ref={frameRef as never}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: interactive
          ? `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
          : undefined,
        boxShadow: selected ? `0 0 0 2px var(--color-acid)` : undefined,
      }}
      className={`bg-surface-3 block border border-black/60 transition-transform duration-150 ${s.frame} ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div
        className={`relative aspect-[5/7] w-full overflow-hidden ${s.face}`}
        style={{ background: face }}
      >
        {/* Halftone texture */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, rgba(0,0,0,0.18) 1.1px, transparent 1.2px)",
            backgroundSize: "7px 7px",
          }}
        />

        {/* Generative chart motif + ticker wordmark */}
        {/* Faint price motif, kept behind the mark for depth */}
        <svg
          viewBox="0 0 100 140"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <path
            d={chartPath(card.id)}
            fill="none"
            stroke="rgba(0,0,0,0.13)"
            strokeWidth="12"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>

        {/* The mark */}
        <div className="absolute inset-0 flex items-center justify-center">
          <CardGlyph card={card} className="h-[62%] w-[62%] text-black/80" />
        </div>

        {/* Round badge, mirroring the token chip on the reference cards */}
        <span
          aria-hidden
          className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/75"
        >
          <CardGlyph card={card} className="h-3 w-3 text-white" />
        </span>

        {badge && (
          <span className="absolute top-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[8px] font-bold text-white">
            {badge}
          </span>
        )}

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <svg
              viewBox="0 0 24 24"
              className="h-1/4 w-1/4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <rect x="4" y="10" width="16" height="11" rx="2.5" fill="currentColor" stroke="none" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      <div className={s.footer}>
        <p className={`font-display text-ink truncate font-bold ${s.ticker}`}>
          {ticker}
        </p>
        {/* Mono rather than the body face: at this size Inter's regular
            weight goes thin and washes out, while the monospace stems hold
            their density. Paired with ink-2 for a readable contrast ratio
            against the card frame. */}
        <p className={`text-ink-2 truncate font-mono font-medium ${s.sector}`}>
          {cardCompany(card)}
        </p>
      </div>
    </Wrapper>
  );
}
