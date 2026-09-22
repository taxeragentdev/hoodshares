import Link from "next/link";
import { CARDS } from "@/lib/cards";
import { HeroCardReel } from "@/components/HeroCardReel";
import { TICKET_NAME } from "@/lib/ticket";
import { BuySoodButton } from "@/components/BuySoodButton";
import { ROUND_ENTRY_LABEL, TOKEN_SYMBOL } from "@/lib/token";

const STATS = [
  { value: String(CARDS.length), label: "Robinhood stocks" },
  { value: "5", label: "Cards per pack" },
  { value: "1", label: "HoodPass per wallet" },
  { value: "1999", label: "Season 01 supply" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="animate-glow pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(204,255,0,0.16) 0%, transparent 68%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-5 pt-16 pb-20 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:pb-28">
        <div className="animate-rise">
          <span className="border-acid/25 bg-acid/8 text-acid inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
            <span className="bg-acid h-1.5 w-1.5 rounded-full" />
            Built on Robinhood Chain
          </span>

          <h1 className="font-display mt-6 text-5xl leading-[0.95] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Collect the
            <br />
            <span className="text-acid">Market.</span>
          </h1>

          <p className="text-ink-2 mt-6 max-w-lg text-lg leading-relaxed">
            Thirty stocks. Five cards. One session. Mint a {TICKET_NAME}, open a
            pack, and play Daily Lineup against the live tape. Each round is{" "}
            {ROUND_ENTRY_LABEL} {TOKEN_SYMBOL}.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/mint"
              className="bg-acid hover:bg-acid-dim rounded-full px-7 py-3.5 text-sm font-semibold text-black transition-colors"
            >
              Mint {TICKET_NAME}
            </Link>
            <BuySoodButton size="hero" />
            <Link
              href="/packs"
              className="border-line-bright text-ink hover:bg-surface-2 rounded-full border px-7 py-3.5 text-sm font-semibold transition-colors"
            >
              Open a pack
            </Link>
          </div>

          <dl className="border-line mt-12 grid grid-cols-2 gap-x-6 gap-y-7 border-t pt-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex min-w-0 flex-col">
                <dt className="text-ink-3 flex min-h-8 items-end font-mono text-[10px] leading-tight tracking-[0.16em] uppercase sm:whitespace-nowrap">
                  {stat.label}
                </dt>
                <dd className="font-display text-ink tabular mt-1.5 text-xl font-bold">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="animate-rise">
          <HeroCardReel />
        </div>
      </div>
    </section>
  );
}
