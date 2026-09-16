import { connection, NextResponse } from "next/server";
import { sessionId } from "@/lib/game/sessionId";
import {
  configuredFeedCount,
  ensureSessionBook,
  readLiveQuotesCached,
  sessionQuotes,
} from "@/lib/server/prices";

export async function GET() {
  await connection();
  const live = await readLiveQuotesCached();
  let book = await sessionQuotes();
  if (Object.keys(live).length > 0 && (!book || Object.keys(book.open).length === 0)) {
    book = await ensureSessionBook("open");
  }
  return NextResponse.json({
    sessionId: sessionId(),
    feedsReady: configuredFeedCount(),
    quotesReady: Object.keys(live).length,
    book,
    live,
  });
}
