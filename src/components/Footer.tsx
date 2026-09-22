import { BuySoodButton } from "./BuySoodButton";
import { Logo } from "./Logo";
import { XMark, X_URL } from "./XLink";
import { TOKEN_ADDRESS, TOKEN_SYMBOL, tokenExplorerUrl } from "@/lib/token";

const COLUMNS = [
  {
    title: "Protocol",
    links: [
      { href: "/#collection", label: "Collection" },
      { href: "/#scoring", label: "Scoring" },
      { href: "/#treasury", label: "Treasury" },
      { href: "/#roadmap", label: "Roadmap" },
    ],
  },
  {
    title: "Play",
    links: [
      { href: "/mint", label: "HoodPass" },
      { href: "/inventory", label: "Inventory" },
      { href: "/play", label: "Daily Lineup" },
      { href: "/leaderboard", label: "Leaderboard" },
      { href: "/packs", label: "Open packs" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/#faq", label: "FAQ" },
      { href: "/#treasury", label: "Treasury" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-line bg-surface mt-8 border-t">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="text-ink-2 mt-4 max-w-sm text-sm leading-relaxed">
              Stock cards on Robinhood Chain. Scores come from the market.
              Cards are not a position in any stock.
            </p>
            <a
              href={X_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-line hover:border-acid hover:bg-acid/8 group mt-6 inline-flex items-center gap-3 rounded-full border px-3.5 py-2.5 transition-colors"
            >
              <span className="bg-surface-3 text-ink group-hover:bg-acid group-hover:text-black flex h-8 w-8 items-center justify-center rounded-full transition-colors">
                <XMark className="h-3.5 w-3.5" />
              </span>
              <span className="text-left">
                <span className="text-ink block text-sm font-semibold">
                  Follow on X
                </span>
                <span className="text-ink-3 font-mono text-[11px]">
                  @hoodshares
                </span>
              </span>
            </a>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <BuySoodButton />
              <div className="border-line bg-surface-2 inline-flex items-center gap-2.5 rounded-full border px-3.5 py-2">
                <span className="bg-up h-1.5 w-1.5 animate-pulse rounded-full" />
                <span className="text-ink-2 font-mono text-[11px] tracking-wider">
                  Chain ID 4663, gas in ETH
                </span>
              </div>
              <a
                href={tokenExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="border-line hover:border-acid hover:text-acid text-ink-2 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 font-mono text-[11px] tracking-wider transition-colors"
              >
                {TOKEN_SYMBOL}
                <span className="text-ink-3">
                  {TOKEN_ADDRESS.slice(0, 6)}…{TOKEN_ADDRESS.slice(-4)}
                </span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-ink-3 font-mono text-[10px] tracking-[0.18em] uppercase">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-ink-2 hover:text-acid text-sm transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-line mt-14 space-y-4 border-t pt-8">
          <p className="text-ink-3 max-w-4xl text-xs leading-relaxed">
            HoodShares cards are digital collectibles. They are not securities,
            not derivatives, and not claims on any company. Holding a card
            confers no ownership interest, dividend, voting right, or economic
            exposure to any listed equity. Share prices are used solely as a
            scoring input for skill based contests. Nothing on this site is
            investment advice.
          </p>
          <p className="text-ink-3 max-w-4xl text-xs leading-relaxed">
            HoodShares is an independent project. It is not affiliated with,
            endorsed by, or sponsored by Robinhood Markets, Inc. or any company
            depicted in the collection. All company names and ticker symbols are
            the property of their respective owners.
          </p>
          <p className="text-ink-3 pt-2 font-mono text-[11px]">
            © 2026 HoodShares
          </p>
        </div>
      </div>
    </footer>
  );
}
