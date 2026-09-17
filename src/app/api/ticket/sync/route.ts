import { NextResponse } from "next/server";
import { sessionAddress } from "@/lib/server/auth";
import {
  hoodPassContractConfigured,
  walletHoldsHoodPass,
} from "@/lib/server/hoodpass";
import { snapshot, syncPlayState } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { ensurePlayer, issueTicket, withStore } from "@/lib/server/store";

export async function POST() {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }

  if (!hoodPassContractConfigured()) {
    return NextResponse.json(
      { error: "HoodPass contract is not set yet." },
      { status: 404 },
    );
  }

  const holds = await walletHoldsHoodPass(address);
  if (!holds) {
    return NextResponse.json({ error: "no pass on this wallet" }, { status: 403 });
  }

  const book = await sessionQuotes();
  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    syncPlayState(record, book);
    issueTicket(store, record);
    return snapshot(record);
  });
  return NextResponse.json(player);
}
