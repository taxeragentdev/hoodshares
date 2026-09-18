"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TicketGate } from "@/components/TicketGate";
import { useAuth } from "@/components/AuthProvider";
import { LineupBuilder } from "@/components/game/LineupBuilder";
import { ActiveRound } from "@/components/game/ActiveRound";
import { RoundSummary } from "@/components/game/RoundSummary";
import { RoundSection } from "@/components/game/RoundSection";
import { api } from "@/lib/api";
import type { LeaderboardRow } from "@/lib/game/leaderboard";
import {
  msUntilSessionClose,
  sessionPhase,
  sessionPhaseLabel,
  sessionProgress,
  SESSION_LABEL,
  type SessionPhase,
} from "@/lib/game/session";
import { formatSessionLabel, nextSessionId, sessionId } from "@/lib/game/sessionId";
import { LINEUP_SIZE, type LineupPick } from "@/lib/game/types";
import { ROUND_ENTRY_LABEL, TOKEN_SYMBOL } from "@/lib/token";

function formatTimeLeft(msLeft: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msLeft / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function pctFromBook(
  cardId: string,
  lockedUsd: number | undefined,
  live: Record<string, number>,
  open: Record<string, number>,
  close: Record<string, number>,
): number | null {
  const openPx = open[cardId];
  if (!openPx) return null;
  const now = lockedUsd ?? live[cardId] ?? close[cardId];
  if (now == null) return null;
  return ((now - openPx) / openPx) * 100;
}

export default function PlayPage() {
  const { inventory, player, signedIn, savePlay, settlePlay } = useAuth();
  const [lineup, setLineup] = useState<LineupPick[]>([]);
  const [progress, setProgress] = useState(() => sessionProgress());
  const [market, setMarket] = useState<SessionPhase>(() => sessionPhase());
  const [clockLabel, setClockLabel] = useState<string | null>(() => sessionPhaseLabel());
  const [hydrated, setHydrated] = useState(false);
  const [live, setLive] = useState<Record<string, number>>({});
  const [openPx, setOpenPx] = useState<Record<string, number>>({});
  const [closePx, setClosePx] = useState<Record<string, number>>({});
  const [rank, setRank] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [lockingSlotId, setLockingSlotId] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const slotCounter = useRef(0);
  const restored = useRef(false);

  const today = sessionId();
  const upcoming = nextSessionId();
  const activePlay =
    player?.play && player.play.roundId === today && player.play.lineup.length >= LINEUP_SIZE
      ? player.play
      : null;
  const sessionOver = market === "closed" || market === "weekend";
  const activeLive = Boolean(activePlay && activePlay.phase !== "settled" && market === "open");
  const activeSettled = Boolean(
    activePlay && (activePlay.phase === "settled" || (sessionOver && activePlay.phase !== "building")),
  );
  const activeNumber = player?.play?.roundNumber ?? 1;
  const nextNumber = player?.nextPlay?.roundNumber ?? activeNumber + 1;

  const moves = useMemo(() => {
    const next: Record<string, number | null> = {};
    if (!activePlay) return next;
    for (const pick of activePlay.lineup) {
      next[pick.cardId] = pctFromBook(
        pick.cardId,
        pick.lockedUsd,
        live,
        openPx,
        closePx,
      );
    }
    return next;
  }, [activePlay, live, openPx, closePx]);

  useEffect(() => {
    function tick() {
      const nextMarket = sessionPhase();
      setMarket(nextMarket);
      setClockLabel(sessionPhaseLabel(nextMarket));
      setProgress(sessionProgress());
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!signedIn) {
      restored.current = false;
      setHydrated(false);
      setLineup([]);
      return;
    }
    if (!player) return;
    if (restored.current) return;
    restored.current = true;
    const queued = player.nextPlay;
    if (queued) {
      setLineup(queued.lineup);
      slotCounter.current = queued.slotCounter || 0;
    }
    setHydrated(true);
  }, [signedIn, player]);

  useEffect(() => {
    if (!activePlay) return;
    let cancelled = false;
    async function loadQuotes() {
      try {
        const data = await api<{
          live: Record<string, number>;
          book: { open: Record<string, number>; close: Record<string, number> } | null;
        }>("/api/prices");
        if (cancelled) return;
        setLive(data.live ?? {});
        setOpenPx(data.book?.open ?? {});
        setClosePx(data.book?.close ?? {});
      } catch {
        /* tape can miss a beat */
      }
    }
    void loadQuotes();
    const id = window.setInterval(loadQuotes, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [activePlay]);

  useEffect(() => {
    if (!activeSettled || !player?.address) return;
    let cancelled = false;
    void api<{ board: LeaderboardRow[] }>("/api/leaderboard")
      .then((data) => {
        if (cancelled) return;
        const row = data.board.find(
          (item) => item.address.toLowerCase() === player.address.toLowerCase(),
        );
        setRank(row?.rank ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeSettled, player?.address]);

  useEffect(() => {
    if (!signedIn || !sessionOver) return;
    void settlePlay().catch(() => undefined);
  }, [sessionOver, signedIn, settlePlay]);

  const savedLineup = player?.nextPlay?.lineup ?? [];
  const lineupDirty = JSON.stringify(lineup) !== JSON.stringify(savedLineup);
  const alreadySaved = Boolean(player?.nextPlay && player.nextPlay.roundId === upcoming);

  function handleAdd(cardId: string) {
    if (lineup.length >= LINEUP_SIZE) return;
    const used = lineup.filter((pick) => pick.cardId === cardId).length;
    if (used >= (inventory.cards[cardId] ?? 0)) return;
    slotCounter.current += 1;
    setLineup((prev) => [
      ...prev,
      { slotId: `slot-${slotCounter.current}`, cardId, direction: "up", locked: false },
    ]);
  }

  function handleRemove(slotId: string) {
    setLineup((prev) => prev.filter((pick) => pick.slotId !== slotId));
  }

  function handleToggleDirection(slotId: string) {
    setLineup((prev) =>
      prev.map((pick) =>
        pick.slotId === slotId
          ? { ...pick, direction: pick.direction === "up" ? "down" : "up" }
          : pick,
      ),
    );
  }

  async function handleSaveNext() {
    setSignError(null);
    setSaving(true);
    const nextPlay = {
      phase: "building" as const,
      lineup,
      roundId: upcoming,
      roundNumber: nextNumber,
      startedAt: 0,
      slotCounter: slotCounter.current,
    };
    try {
      const next = await savePlay(nextPlay, { intent: "save" });
      if (next.nextPlay) setLineup(next.nextPlay.lineup);
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Could not save this lineup");
    } finally {
      setSaving(false);
    }
  }

  async function handleLock(slotId: string) {
    if (!activePlay) return;
    const at = sessionProgress();
    const nextLineup = activePlay.lineup.map((pick) =>
      pick.slotId === slotId ? { ...pick, locked: true, lockedAtProgress: at } : pick,
    );
    setSignError(null);
    setLockingSlotId(slotId);
    try {
      await savePlay(
        {
          ...activePlay,
          phase: "active",
          lineup: nextLineup,
        },
        { intent: "lock", lockedSlotId: slotId },
      );
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Could not lock this card");
    } finally {
      setLockingSlotId(null);
    }
  }

  function activeEmptyCopy() {
    if (market === "open") {
      return "This session is live. You cannot add or remove cards here. Lock a card to bank the move, or wait for the close. Set the next round below.";
    }
    if (market === "preopen") {
      return "No live session yet. The round below plays at 09:30 ET. Once it opens you can only lock.";
    }
    if (market === "weekend") {
      return "Market closed for the weekend. Set the next round below for Monday.";
    }
    return "This session is over. Set the next round below.";
  }

  const displayNextNumber = player?.nextPlay?.roundNumber ?? nextNumber;

  return (
    <>
      <Navbar />
      <main className="bg-void mx-auto w-full max-w-5xl flex-1 px-5 py-14 sm:px-8">
        <div className="mb-10 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="border-acid/30 bg-acid/10 text-acid inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
              {SESSION_LABEL}
            </span>
            <span className="border-line bg-surface-2 text-ink inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
              {ROUND_ENTRY_LABEL} {TOKEN_SYMBOL} to enter
            </span>
          </div>
          <h1 className="font-display text-ink mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Daily Lineup
          </h1>
          <p className="text-ink-3 mt-2 min-h-[1rem] font-mono text-xs">
            {clockLabel ?? "\u00a0"}
          </p>
          <p className="text-ink-2 mx-auto mt-3 max-w-xl text-sm leading-relaxed">
            The live round is locked except for the lock button. Build the next
            round anytime. Each round is {ROUND_ENTRY_LABEL} {TOKEN_SYMBOL} from
            Season 1. Score is that name&apos;s percent move from the 09:30 ET
            open times 100.
          </p>
        </div>

        <TicketGate title="Connect to play">
          {signError && (
            <p className="text-down mb-4 text-center text-xs leading-relaxed">{signError}</p>
          )}
          {!hydrated && signedIn && (
            <p className="text-ink-3 py-16 text-center font-mono text-xs tracking-wide">
              Loading your cards…
            </p>
          )}

          {hydrated && (
            <div className="space-y-6">
              <RoundSection label="Active round" number={activeNumber}>
                {activeLive && activePlay ? (
                  <ActiveRound
                    embedded
                    lineup={activePlay.lineup}
                    moves={moves}
                    progress={progress}
                    timeLeftLabel={formatTimeLeft(msUntilSessionClose())}
                    onLock={(slotId) => void handleLock(slotId)}
                    lockingSlotId={lockingSlotId}
                  />
                ) : activeSettled && activePlay ? (
                  <RoundSummary
                    embedded
                    lineup={activePlay.lineup}
                    moves={moves}
                    rank={rank}
                  />
                ) : (
                  <div>
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {Array.from({ length: LINEUP_SIZE }).map((_, i) => (
                        <div
                          key={i}
                          className="border-line/60 aspect-[5/8] rounded-xl border border-dashed"
                        />
                      ))}
                    </div>
                    <p className="text-ink-2 mt-4 max-w-xl text-sm leading-relaxed">
                      {activeEmptyCopy()}
                    </p>
                  </div>
                )}
              </RoundSection>

              <RoundSection label="Next round" number={displayNextNumber}>
                <LineupBuilder
                  bare
                  lineup={lineup}
                  owned={inventory.cards}
                  onAdd={handleAdd}
                  onRemove={handleRemove}
                  onToggleDirection={handleToggleDirection}
                  onStart={() => void handleSaveNext()}
                  startLabel={
                    alreadySaved && !lineupDirty
                      ? "Lineup saved"
                      : lineupDirty && alreadySaved
                        ? "Save changes"
                        : "Save picks"
                  }
                  startEnabled={lineupDirty || !alreadySaved}
                  startBusy={saving}
                  hint={`Plays ${formatSessionLabel(upcoming)} from 09:30 ET. Each round is ${ROUND_ENTRY_LABEL} ${TOKEN_SYMBOL}. Your wallet signs this lineup.`}
                />
              </RoundSection>
            </div>
          )}
        </TicketGate>
      </main>
      <Footer />
    </>
  );
}
