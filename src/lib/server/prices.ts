import { createPublicClient, http } from "viem";
import { CARDS } from "@/lib/cards";
import { AGGREGATOR_V3_ABI, CHAINLINK_FEEDS } from "@/lib/feeds";
import { sessionId } from "@/lib/game/sessionId";
import { robinhoodChain } from "@/lib/chains";
import { readRobinhoodMids } from "./robinhoodQuotes";
import { withStore, type SessionQuoteBook } from "./store";

const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(process.env.ROBINHOOD_RPC_URL ?? robinhoodChain.rpcUrls.default.http[0]),
});

export function configuredFeedCount(): number {
  return Object.values(CHAINLINK_FEEDS).filter(Boolean).length;
}

let quoteCache: { at: number; quotes: Record<string, number> } | null = null;
const QUOTE_TTL_MS = 15_000;

export async function readLiveQuotes(): Promise<Record<string, number>> {
  const quotes: Record<string, number> = {};
  await Promise.all(
    CARDS.map(async (card) => {
      const feed = CHAINLINK_FEEDS[card.id];
      if (!feed) return;
      try {
        const round = await client.readContract({
          address: feed,
          abi: AGGREGATOR_V3_ABI,
          functionName: "latestRoundData",
        });
        const answer = round[1];
        const updatedAt = round[3];
        if (answer <= BigInt(0) || updatedAt === BigInt(0)) return;
        quotes[card.id] = Number(answer) / 1e8;
      } catch {
        /* fall through to the issuer quote */
      }
    }),
  );
  const missing = CARDS.filter((card) => quotes[card.id] == null);
  if (missing.length > 0) {
    const rest = await readRobinhoodMids(missing);
    Object.assign(quotes, rest);
  }
  return quotes;
}

export async function readLiveQuotesCached(): Promise<Record<string, number>> {
  if (quoteCache && Date.now() - quoteCache.at < QUOTE_TTL_MS) {
    return quoteCache.quotes;
  }
  const quotes = await readLiveQuotes();
  quoteCache = { at: Date.now(), quotes };
  return quotes;
}

export async function snapshotSession(phase: "open" | "close"): Promise<SessionQuoteBook> {
  const today = sessionId();
  const live = await readLiveQuotesCached();
  return withStore((store) => {
    const existing = store.quotes[today] ?? {
      sessionId: today,
      open: {},
      close: {},
      capturedAt: Date.now(),
    };
    if (phase === "open") existing.open = { ...existing.open, ...live };
    else existing.close = { ...existing.close, ...live };
    existing.capturedAt = Date.now();
    store.quotes[today] = existing;
    return existing;
  });
}

export async function sessionQuotes(id = sessionId()): Promise<SessionQuoteBook | null> {
  return withStore((store) => store.quotes[id] ?? null);
}

/** First visit of the day stamps the open. Close is written at settle or by the 16:00 ET cron. */
export async function ensureSessionBook(
  phase: "open" | "close" = "open",
): Promise<SessionQuoteBook | null> {
  const live = await readLiveQuotesCached();
  if (Object.keys(live).length === 0) return sessionQuotes();
  const existing = await sessionQuotes();
  if (phase === "open") {
    if (existing && Object.keys(existing.open).length > 0) return existing;
    return snapshotSession("open");
  }
  if (!existing || Object.keys(existing.open).length === 0) {
    await snapshotSession("open");
  }
  return snapshotSession("close");
}

/** Percent move from the official open. Falls back to null when the book is empty. */
export function livePctMove(
  book: SessionQuoteBook | null,
  cardId: string,
  lockedUsd?: number,
): number | null {
  const open = book?.open[cardId];
  if (!open || open === 0) return null;
  const now = lockedUsd ?? book?.close[cardId];
  if (now === undefined) return null;
  return ((now - open) / open) * 100;
}
