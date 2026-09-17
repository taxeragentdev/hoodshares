import { NextResponse } from "next/server";
import { applyOpenedPack } from "@/lib/inventory";
import { openDemoPack } from "@/lib/packs";
import { sessionAddress } from "@/lib/server/auth";
import { snapshot, syncPlayState } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { ensurePlayer, withStore } from "@/lib/server/store";

export async function POST() {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }

  const opened = openDemoPack(`${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const book = await sessionQuotes();

  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    syncPlayState(record, book);
    if (!record.ticketHeld) return null;
    if (record.inventory.packs < 1) return null;
    record.inventory = applyOpenedPack(record.inventory, opened);
    return snapshot(record);
  });

  if (!player) {
    return NextResponse.json({ error: "need pass or pack" }, { status: 400 });
  }

  return NextResponse.json({
    ...player,
    opened: opened.map((item) => item.card.id),
  });
}
