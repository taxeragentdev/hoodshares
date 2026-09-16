import { NextResponse } from "next/server";
import type { SavedPlay } from "@/lib/game/types";
import { LINEUP_SIZE } from "@/lib/game/types";
import { sessionAddress } from "@/lib/server/auth";
import { expireActivePlay, snapshot, stampLocks } from "@/lib/server/play";
import {
  configuredFeedCount,
  ensureSessionBook,
  readLiveQuotesCached,
  sessionQuotes,
} from "@/lib/server/prices";
import { ensurePlayer, withStore } from "@/lib/server/store";

export async function PUT(request: Request) {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }
  const play = (await request.json()) as SavedPlay;
  if (!play || !Array.isArray(play.lineup) || play.lineup.length > LINEUP_SIZE) {
    return NextResponse.json({ error: "bad play" }, { status: 400 });
  }

  const live =
    configuredFeedCount() > 0 ? await readLiveQuotesCached() : {};
  if (play.phase === "active" && configuredFeedCount() > 0) {
    await ensureSessionBook("open");
  }
  const book = await sessionQuotes();

  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    expireActivePlay(record, book);
    if (!record.ticketHeld) return null;
    if (record.play?.phase === "settled" && play.phase !== "settled") {
      return snapshot(record);
    }
    record.play = stampLocks(record.play, {
      phase: play.phase,
      lineup: play.lineup,
      roundId: play.roundId ?? "",
      roundNumber: play.roundNumber ?? 1,
      startedAt: play.startedAt ?? 0,
      slotCounter: play.slotCounter ?? 0,
    }, live);
    return snapshot(record);
  });

  if (!player) {
    return NextResponse.json({ error: "need pass" }, { status: 403 });
  }

  return NextResponse.json(player);
}
