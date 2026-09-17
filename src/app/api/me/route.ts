import { NextResponse } from "next/server";
import { sessionAddress } from "@/lib/server/auth";
import { snapshot, syncPlayState } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { ensurePlayer, withStore } from "@/lib/server/store";

export async function GET() {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }
  const book = await sessionQuotes();
  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    syncPlayState(record, book);
    return snapshot(record);
  });
  return NextResponse.json(player);
}
