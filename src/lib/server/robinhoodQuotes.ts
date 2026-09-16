import type { CardDefinition } from "@/lib/cards";

interface RobinhoodQuote {
  tokenSymbol?: string;
  bid?: string;
  ask?: string;
}

interface RobinhoodPricesResponse {
  quotes?: RobinhoodQuote[];
}

const RH_PRICES = "https://api.robinhood.com/rhj/prices";

function midUsd(quote: RobinhoodQuote): number | null {
  const bid = Number(quote.bid);
  const ask = Number(quote.ask);
  const parts = [bid, ask].filter((n) => Number.isFinite(n) && n > 0);
  if (parts.length === 0) return null;
  return parts.reduce((sum, n) => sum + n, 0) / parts.length;
}

/** Issuer bid/ask for Stock Tokens that do not yet have a Chainlink proxy. */
export async function readRobinhoodMids(
  cards: CardDefinition[],
): Promise<Record<string, number>> {
  const quotes: Record<string, number> = {};
  await Promise.all(
    cards.map(async (card) => {
      try {
        const response = await fetch(`${RH_PRICES}/${encodeURIComponent(card.ticker)}`, {
          headers: {
            Accept: "application/json",
            "User-Agent": "HoodShares/1.0",
          },
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = (await response.json()) as RobinhoodPricesResponse & RobinhoodQuote;
        const row = body.quotes?.[0] ?? body;
        const usd = midUsd(row);
        if (usd != null) quotes[card.id] = usd;
      } catch {
        /* leave the card for the next source */
      }
    }),
  );
  return quotes;
}
