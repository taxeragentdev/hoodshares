import { NextResponse } from "next/server";
import { sessionPhase } from "@/lib/game/session";
import { sessionAddress } from "@/lib/server/auth";
import { settlePlayerRound, snapshot, syncPlayState } from "@/lib/server/play";
import { configuredFeedCount, ensureSessionBook, sessionQuotes } from "@/lib/server/prices";
import { ensurePlayer, withStore } from "@/lib/server/store";

export async function POST() {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }

  const market = sessionPhase();
  if (market === "open" || market === "preopen") {
    const book = await sessionQuotes();
    const player = await withStore((store) => {
      const record = ensurePlayer(store, address);
      syncPlayState(record, book);
      return snapshot(record);
    });
    return NextResponse.json(player);
  }

  const book =
    configuredFeedCount() > 0 ? await ensureSessionBook("close") : await sessionQuotes();
  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    settlePlayerRound(record, book);
    syncPlayState(record, book);
    return snapshot(record);
  });
  return NextResponse.json(player);
}
