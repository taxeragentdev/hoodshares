import { NextResponse } from "next/server";
import type { SavedPlay } from "@/lib/game/types";
import { LINEUP_SIZE } from "@/lib/game/types";
import { sessionId } from "@/lib/game/sessionId";
import {
  playActionMessage,
  type PlayIntent,
} from "@/lib/playAuth";
import { sessionAddress, verifyPlaySignature } from "@/lib/server/auth";
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
  const body = (await request.json()) as {
    play?: SavedPlay;
    nonce?: string;
    signature?: string;
    intent?: PlayIntent;
    lockedSlotId?: string;
  };
  const play = body.play;
  if (!play || !Array.isArray(play.lineup) || play.lineup.length > LINEUP_SIZE) {
    return NextResponse.json({ error: "bad play" }, { status: 400 });
  }
  if (!body.nonce || !body.signature) {
    return NextResponse.json({ error: "sign this lineup" }, { status: 400 });
  }
  const intent: PlayIntent = body.intent === "lock" ? "lock" : "save";
  if (intent === "lock") {
    const locked = body.lockedSlotId
      ? play.lineup.find((pick) => pick.slotId === body.lockedSlotId)
      : undefined;
    if (!locked?.locked) {
      return NextResponse.json({ error: "bad lock" }, { status: 400 });
    }
  }

  const message = playActionMessage(
    intent,
    address,
    body.nonce,
    play,
    body.lockedSlotId,
  );
  const ok = await verifyPlaySignature(
    address,
    body.nonce,
    body.signature as `0x${string}`,
    message,
  );
  if (!ok) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
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
      const last = record.results.at(-1);
      if (last?.sessionId === sessionId()) {
        return snapshot(record);
      }
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
