import { NextResponse } from "next/server";
import type { LineupPick, SavedPlay } from "@/lib/game/types";
import { LINEUP_SIZE } from "@/lib/game/types";
import { sessionPhase } from "@/lib/game/session";
import { nextSessionId, sessionId } from "@/lib/game/sessionId";
import {
  playActionMessage,
  type PlayIntent,
} from "@/lib/playAuth";
import { sessionAddress, verifyPlaySignature } from "@/lib/server/auth";
import { queuedRoundNumber, snapshot, stampLocks, syncPlayState } from "@/lib/server/play";
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
  if (intent === "save" && play.lineup.length !== LINEUP_SIZE) {
    return NextResponse.json({ error: "need five cards" }, { status: 400 });
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
  if (intent === "lock" && configuredFeedCount() > 0) {
    await ensureSessionBook("open");
  }
  const book = await sessionQuotes();
  const today = sessionId();
  const upcoming = nextSessionId();
  const market = sessionPhase();

  const outcome = await withStore((store) => {
    const record = ensurePlayer(store, address);
    syncPlayState(record, book);
    if (!record.ticketHeld) return { ok: false as const, error: "need pass", status: 403 };

    if (intent === "lock") {
      const current = record.play;
      if (!current || current.roundId !== today || market !== "open") {
        return { ok: false as const, error: "no live round", status: 400 };
      }
      const lockedSlotId = body.lockedSlotId;
      const submitted = play.lineup.find((pick) => pick.slotId === lockedSlotId);
      if (!lockedSlotId || !submitted?.locked) {
        return { ok: false as const, error: "bad lock", status: 400 };
      }
      const nextLineup = current.lineup.map((row) =>
        row.slotId === lockedSlotId
          ? { ...row, locked: true, lockedAtProgress: submitted.lockedAtProgress }
          : row,
      );
      record.play = stampLocks(
        current,
        { ...current, phase: "active", lineup: nextLineup },
        live,
      );
      return { ok: true as const, player: snapshot(record) };
    }

    record.nextPlay = {
      phase: "building",
      lineup: unlockedLineup(play.lineup),
      roundId: upcoming,
      roundNumber: queuedRoundNumber(record),
      startedAt: 0,
      slotCounter: play.slotCounter ?? 0,
    };
    return { ok: true as const, player: snapshot(record) };
  });

  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  }

  return NextResponse.json(outcome.player);
}

function unlockedLineup(lineup: LineupPick[]): LineupPick[] {
  return lineup.map((pick) => ({
    ...pick,
    locked: false,
    lockedUsd: undefined,
    lockedAtProgress: undefined,
  }));
}
