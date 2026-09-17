import { NextResponse } from "next/server";
import { sessionAddress } from "@/lib/server/auth";
import { settlePlayerRound, snapshot, syncPlayState } from "@/lib/server/play";
import { configuredFeedCount, ensureSessionBook } from "@/lib/server/prices";
import { ensurePlayer, withStore } from "@/lib/server/store";

export async function POST() {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }
  const book =
    configuredFeedCount() > 0
      ? await ensureSessionBook("close")
      : null;
  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    settlePlayerRound(record, book);
    syncPlayState(record, book);
    return snapshot(record);
  });
  return NextResponse.json(player);
}
