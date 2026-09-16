import {
  STAT_KEYS,
  STAT_LABEL,
  STAT_MAX,
  type EyeStyle,
  type HoodArchetype,
} from "@/lib/hoods";

const ACCENT = "#ccff00";

/** Deterministic barcode widths so server and client render identically. */
function barcodeBars(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return Array.from({ length: 34 }, (_, i) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    return ((h >>> (i % 8)) & 3) + 1;
  });
}

function Eyes({ style, accent }: { style: EyeStyle; accent: string }) {
  if (style === "visor") {
    return (
      <g>
        <rect x="76" y="66" width="48" height="16" rx="8" fill={accent} opacity="0.16" />
        <rect x="80" y="70" width="40" height="7" rx="3.5" fill={accent} opacity="0.95" />
      </g>
    );
  }

  if (style === "pixel") {
    const cells = [0, 1, 2].flatMap((col) =>
      [0, 1].map((row) => ({ col, row })),
    );
    return (
      <g fill={accent}>
        {cells.map(({ col, row }) => (
          <rect
            key={`l-${col}-${row}`}
            x={76 + col * 7}
            y={66 + row * 7}
            width="6"
            height="6"
          />
        ))}
        {cells.map(({ col, row }) => (
          <rect
            key={`r-${col}-${row}`}
            x={103 + col * 7}
            y={66 + row * 7}
            width="6"
            height="6"
          />
        ))}
      </g>
    );
  }

  if (style === "glow") {
    return (
      <g fill={accent}>
        <circle cx="86" cy="72" r="11" opacity="0.16" />
        <circle cx="114" cy="72" r="11" opacity="0.16" />
        <circle cx="86" cy="72" r="5.5" opacity="0.95" />
        <circle cx="114" cy="72" r="5.5" opacity="0.95" />
      </g>
    );
  }

  return (
    <g fill={accent}>
      <rect x="82" y="62" width="6" height="19" rx="3" transform="rotate(13 85 71)" />
      <rect x="112" y="62" width="6" height="19" rx="3" transform="rotate(-13 115 71)" />
    </g>
  );
}

/**
 * The hooded figure is drawn rather than illustrated, which keeps the whole
 * archetype set generable from code — the same reason it can scale to a full
 * collection without hand-drawing every variant.
 */
function HoodFigure({ hood }: { hood: HoodArchetype }) {
  return (
    <svg
      viewBox="0 0 200 172"
      preserveAspectRatio="xMidYMax meet"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={`cloth-${hood.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.30" />
          <stop offset="55%" stopColor={ACCENT} stopOpacity="0.13" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id={`halo-${hood.id}`} cx="0.5" cy="0.42" r="0.5">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.22" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Candlestick backdrop, kept faint and low so it reads as depth */}
      <g opacity="0.14">
        {Array.from({ length: 13 }, (_, i) => {
          const x = 2 + i * 16;
          const tall = 14 + ((i * 29) % 42);
          const y = 150 - tall;
          return (
            <g key={i} fill={ACCENT}>
              <rect x={x + 4.5} y={y - 8} width="1.6" height={tall + 18} opacity="0.6" />
              <rect x={x} y={y} width="10" height={tall} rx="1.5" />
            </g>
          );
        })}
      </g>

      <circle cx="100" cy="80" r="86" fill={`url(#halo-${hood.id})`} />

      {/* Hood, torso and shoulders as one silhouette */}
      <path
        d="M100 16
           C76 16 58 34 55 62
           L51 94
           C31 104 16 126 10 154
           L6 190
           L194 190
           L190 154
           C184 126 169 104 149 94
           L145 62
           C142 34 124 16 100 16 Z"
        fill={`url(#cloth-${hood.id})`}
        stroke={ACCENT}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />

      {/* Inner hood rim */}
      <path
        d="M66 74 C66 50 81 35 100 35 C119 35 134 50 134 74"
        fill="none"
        stroke={ACCENT}
        strokeWidth="2"
        strokeOpacity="0.5"
      />

      {/* Face cavity */}
      <path
        d="M68 72 C68 50 82 37 100 37 C118 37 132 50 132 72 C132 97 118 113 100 113 C82 113 68 97 68 72 Z"
        fill="#000000"
        stroke={ACCENT}
        strokeWidth="1.4"
        strokeOpacity="0.4"
      />

      <Eyes style={hood.eyes} accent={hood.accent} />

      {/* Drawstrings running down the chest */}
      <g stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" opacity="0.75">
        <path d="M84 112 L80 148" />
        <path d="M116 112 L120 148" />
      </g>
      <circle cx="80" cy="152" r="3.2" fill={ACCENT} opacity="0.75" />
      <circle cx="120" cy="152" r="3.2" fill={ACCENT} opacity="0.75" />

      {/* House mark on the chest, clear of the face */}
      <g transform="translate(88 132) scale(0.46)" opacity="0.8">
        <rect
          x="2"
          y="4"
          width="44"
          height="34"
          rx="7"
          stroke={ACCENT}
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M12 30 L21 21 L28 27 L38 15"
          stroke={ACCENT}
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

function StatBar({ value }: { value: number }) {
  return (
    <div className="mt-1.5 flex gap-[3px]">
      {Array.from({ length: STAT_MAX }, (_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-[1px] ${i < value ? "bg-acid" : "bg-acid/12"}`}
        />
      ))}
    </div>
  );
}

interface HoodCardProps {
  hood: HoodArchetype;
  /** Print number shown on the card face. */
  serial?: number;
}

export function HoodCard({ hood, serial = 1 }: HoodCardProps) {
  const bars = barcodeBars(hood.id);

  return (
    <article
      className="relative aspect-[5/7.4] w-full rounded-[26px] p-[9px] transition-shadow duration-500"
      style={{
        border: `3px solid ${ACCENT}`,
        backgroundColor: "#040404",
        boxShadow: `0 0 30px ${ACCENT}44, inset 0 0 22px ${ACCENT}1f`,
      }}
    >
      <div
        className="relative flex h-full flex-col overflow-hidden rounded-[16px] px-4 pt-4 pb-3.5"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(204,255,0,0.10) 0%, transparent 58%), #070707",
          border: `1px solid ${ACCENT}33`,
        }}
      >
        {/* Serial and edition */}
        <header className="flex items-start justify-between">
          <div>
            <p className="text-acid tabular font-mono text-[13px] leading-none font-bold tracking-wider">
              #{String(serial).padStart(5, "0")}
            </p>
            <p className="text-ink-3 mt-1 font-mono text-[9px] tracking-[0.22em] uppercase">
              {hood.edition}
            </p>
          </div>
          <span
            className="rounded-md px-2 py-1 font-mono text-[9px] tracking-[0.14em] uppercase"
            style={{
              color: hood.accent,
              border: `1px solid ${hood.accent}55`,
              backgroundColor: `${hood.accent}14`,
            }}
          >
            Earned
          </span>
        </header>

        {/* Figure — the shoulders fade into the card rather than cutting off */}
        <div className="relative mt-1 min-h-0 flex-1 overflow-hidden">
          <HoodFigure hood={hood} />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6"
            style={{
              background: "linear-gradient(to top, #070707 10%, transparent)",
            }}
          />
        </div>

        {/* Name plate */}
        <div
          className="mt-2.5 flex min-h-[62px] flex-col justify-center rounded-lg px-3 py-2 text-center"
          style={{
            border: `1px solid ${ACCENT}3d`,
            backgroundColor: "rgba(204,255,0,0.05)",
          }}
        >
          <h3 className="font-display text-acid text-[17px] leading-none font-bold tracking-tight uppercase">
            {hood.name}
          </h3>
          <p className="text-ink-2 mt-1.5 font-mono text-[8px] leading-[1.5] tracking-[0.08em] uppercase">
            {hood.tagline}
          </p>
        </div>

        {/* Stats */}
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {STAT_KEYS.map((key) => (
            <div key={key}>
              <p className="text-ink-3 font-mono text-[8px] leading-none tracking-[0.02em] uppercase">
                {STAT_LABEL[key]}
              </p>
              <StatBar value={hood.stats[key]} />
            </div>
          ))}
        </div>

        {/* Award criterion and barcode */}
        <footer className="mt-3 flex items-end justify-between gap-2">
          <p className="text-ink-3 min-w-0 font-mono text-[8px] leading-[1.4] tracking-[0.04em] uppercase">
            {hood.earnedByShort}
          </p>
          <div className="flex h-3.5 shrink-0 items-end gap-[1.5px]">
            {bars.slice(0, 22).map((w, i) => (
              <span
                key={i}
                className="bg-acid/40"
                style={{ width: w, height: i % 3 === 0 ? "100%" : "70%" }}
              />
            ))}
          </div>
        </footer>
      </div>
    </article>
  );
}
