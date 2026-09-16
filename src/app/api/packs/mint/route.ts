import { NextResponse } from "next/server";
import { creditPacks } from "@/lib/inventory";
import { sessionAddress } from "@/lib/server/auth";
import { expireActivePlay, snapshot } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { claimIncludedPack, ensurePlayer, withStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { grant?: boolean };
  const grant = body.grant === true;
  const book = await sessionQuotes();
  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    expireActivePlay(record, book);
    if (!record.ticketHeld) return null;
    if (grant) {
      if (!claimIncludedPack(record)) return "no-grant" as const;
    } else {
      record.inventory = creditPacks(record.inventory, 1);
    }
    return snapshot(record);
  });
  if (player === null) {
    return NextResponse.json({ error: "need pass" }, { status: 403 });
  }
  if (player === "no-grant") {
    return NextResponse.json({ error: "no included pack" }, { status: 409 });
  }
  return NextResponse.json(player);
}
