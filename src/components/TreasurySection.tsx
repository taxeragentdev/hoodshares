import { PACK_PRICE_HOOD_LABEL, PACK_TOKEN_SYMBOL } from "@/lib/packs";
import { ROUND_ENTRY_LABEL, TOKEN_ADDRESS, TOKEN_SYMBOL, tokenExplorerUrl } from "@/lib/token";
import { Section, SectionHeading } from "./ui/Section";

const ALLOCATION = [
  {
    label: "Prize pool",
    percent: 60,
    color: "#ccff00",
    note: "Pays the weekly board and later contests",
  },
  {
    label: "Buyback and burn",
    percent: 30,
    color: "#fbbf24",
    note: `ETH buys ${TOKEN_SYMBOL} on the market and burns it`,
  },
  {
    label: "Development",
    percent: 5,
    color: "#38bdf8",
    note: "Engineering, audits, and infrastructure",
  },
  {
    label: "Growth",
    percent: 5,
    color: "#a855f7",
    note: "Partnerships and distribution",
  },
];

const INFLOWS = [
  {
    title: "Pack sales",
    body: `Packs are paid in ${PACK_TOKEN_SYMBOL}. Extra packs are ${PACK_PRICE_HOOD_LABEL} ${PACK_TOKEN_SYMBOL}. Those tokens go to the treasury.`,
  },
  {
    title: "Daily Lineup entry",
    body: `Season 1 charges ${ROUND_ENTRY_LABEL} ${TOKEN_SYMBOL} at the start of every round. The whole fee goes to the prize pool.`,
  },
  {
    title: "Secondary royalties",
    body: "A cut of each resale comes back in, so trading keeps funding the game after the first sale.",
  },
  {
    title: "Contest tickets",
    body: "Duel and Cup entry fees go back into the same prize pool. They are not withdrawn.",
  },
];

export function TreasurySection() {
  return (
    <Section id="treasury">
      <SectionHeading
        eyebrow="Treasury"
        title="Payouts scale with the treasury"
        description="Weekly rewards are a share of the prize pool, not a fixed amount. If the pool shrinks, payouts shrink with it, so the pool cannot be drained to zero."
      />

      <div className="border-acid/35 bg-acid/8 mt-10 rounded-2xl border p-6 sm:p-8">
        <p className="text-acid font-mono text-[10px] tracking-[0.2em] uppercase">
          Trade fees
        </p>
        <h3 className="font-display text-ink mt-3 text-2xl font-bold tracking-tight">
          50% of every {TOKEN_SYMBOL} trade fee feeds the prize pool
        </h3>
        <p className="text-ink-2 mt-3 max-w-2xl text-sm leading-relaxed">
          When {TOKEN_SYMBOL} trades, half of the fee is routed to Friday&apos;s
          prize pool. That cut sits on top of the mint split below. It is not
          withdrawn as revenue.
        </p>
        <a
          href={tokenExplorerUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink-3 hover:text-acid mt-4 inline-block font-mono text-xs tracking-wide transition-colors"
        >
          {TOKEN_SYMBOL} on Robinhood Chain {TOKEN_ADDRESS.slice(0, 6)}…
          {TOKEN_ADDRESS.slice(-4)}
        </a>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="border-line bg-surface rounded-2xl border p-6 sm:p-8">
          <h3 className="font-display text-ink text-lg font-bold">
            Where ETH revenue goes
          </h3>

          <div className="mt-7 space-y-5">
            {ALLOCATION.map((slice) => (
              <div key={slice.label}>
                <div className="flex items-baseline justify-between">
                  <span className="text-ink text-sm font-semibold">
                    {slice.label}
                  </span>
                  <span
                    className="tabular font-mono text-sm font-semibold"
                    style={{ color: slice.color }}
                  >
                    {slice.percent}%
                  </span>
                </div>
                <div className="bg-surface-3 mt-2 h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${slice.percent}%`,
                      backgroundColor: slice.color,
                    }}
                  />
                </div>
                <p className="text-ink-3 mt-1.5 text-xs">{slice.note}</p>
              </div>
            ))}
          </div>

          <p className="border-line text-ink-3 mt-7 border-t pt-5 text-xs leading-relaxed">
            The split is written into the treasury contract and the wallet sits
            behind a multisig. No single key can move funds.
          </p>
        </div>

        <div className="space-y-4">
          {INFLOWS.map((inflow) => (
            <div
              key={inflow.title}
              className="border-line bg-surface hover:border-line-bright rounded-2xl border p-6 transition-colors"
            >
              <h3 className="font-display text-ink text-base font-bold">
                {inflow.title}
              </h3>
              <p className="text-ink-2 mt-2 text-sm leading-relaxed">
                {inflow.body}
              </p>
            </div>
          ))}

          <div className="border-acid/25 bg-acid/6 rounded-2xl border p-6">
            <h3 className="font-display text-acid text-base font-bold">
              Claiming a prize
            </h3>
            <p className="text-ink-2 mt-2 text-sm leading-relaxed">
              After Friday&apos;s close, winners claim {TOKEN_SYMBOL} from the
              weekly prize pool. The payout list is public, so you can check it
              yourself.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
