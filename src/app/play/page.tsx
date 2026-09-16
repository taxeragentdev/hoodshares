"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TicketGate } from "@/components/TicketGate";
import { useAuth } from "@/components/AuthProvider";
import { LineupBuilder } from "@/components/game/LineupBuilder";
import { ActiveRound } from "@/components/game/ActiveRound";
import { RoundSummary } from "@/components/game/RoundSummary";
import { buildPricePath } from "@/lib/game/simulate";
import { sessionPhase, sessionPhaseLabel, SESSION_LABEL } from "@/lib/game/session";
import { LINEUP_SIZE, ROUND_DURATION_MS, type LineupPick, type RoundPhase } from "@/lib/game/types";

function formatTimeLeft(msLeft: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msLeft / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PlayPage() {
  const { inventory, player, signedIn, savePlay, settlePlay } = useAuth();
  const [phase, setPhase] = useState<RoundPhase>("building");
  const [lineup, setLineup] = useState<LineupPick[]>([]);
  const [roundId, setRoundId] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [progress, setProgress] = useState(0);
  const [clockLabel, setClockLabel] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const startTimeRef = useRef(0);
  const slotCounter = useRef(0);
  const restored = useRef(false);

  const paths = useMemo(() => {
    if (!roundId) return {};
    const uniqueCardIds = Array.from(new Set(lineup.map((pick) => pick.cardId)));
    const map: Record<string, number[]> = {};
    for (const cardId of uniqueCardIds) {
      map[cardId] = buildPricePath(`${roundId}:${cardId}`);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  useEffect(() => {
    setClockLabel(sessionPhaseLabel(sessionPhase()));
  }, []);

  useEffect(() => {
    if (!signedIn) {
      restored.current = false;
      setHydrated(false);
      return;
    }
    if (restored.current) return;
    restored.current = true;
    const play = player?.play;
    if (play) {
      setPhase(play.phase);
      setLineup(play.lineup);
      setRoundId(play.roundId);
      setRoundNumber(play.roundNumber || 1);
      startTimeRef.current = play.startedAt;
      slotCounter.current = play.slotCounter || 0;
      if (play.phase === "active" && play.startedAt) {
        const next = Math.min(1, (Date.now() - play.startedAt) / ROUND_DURATION_MS);
        setProgress(next);
        if (next >= 1) {
          setPhase("settled");
          void settlePlay();
        }
      }
    }
    setHydrated(true);
  }, [signedIn, player, settlePlay]);

  useEffect(() => {
    if (phase !== "active") return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const next = Math.min(1, elapsed / ROUND_DURATION_MS);
      setProgress(next);
      if (next >= 1) {
        clearInterval(interval);
        setPhase("settled");
      }
    }, 150);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (!hydrated || !signedIn) return;
    if (phase === "settled") {
      void settlePlay().catch(() => undefined);
      return;
    }
    const handle = window.setTimeout(() => {
      void savePlay({
        phase,
        lineup,
        roundId,
        roundNumber,
        startedAt: startTimeRef.current,
        slotCounter: slotCounter.current,
      }).catch(() => undefined);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [hydrated, signedIn, phase, lineup, roundId, roundNumber, savePlay, settlePlay]);

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

  function handleStart() {
    const startedAt = Date.now();
    const id = `${startedAt}-${Math.random().toString(36).slice(2, 8)}`;
    startTimeRef.current = startedAt;
    setRoundId(id);
    setProgress(0);
    setPhase("active");
    void savePlay({
      phase: "active",
      lineup,
      roundId: id,
      roundNumber,
      startedAt,
      slotCounter: slotCounter.current,
    });
  }

  function handleLock(slotId: string) {
    setLineup((prev) =>
      prev.map((pick) =>
        pick.slotId === slotId ? { ...pick, locked: true, lockedAtProgress: progress } : pick,
      ),
    );
  }

  function handlePlayAgain() {
    setPhase("building");
    setLineup([]);
    setRoundId("");
    setProgress(0);
    startTimeRef.current = 0;
    setRoundNumber((current) => current + 1);
  }

  return (
    <>
      <Navbar />
      <main className="bg-void mx-auto w-full max-w-5xl flex-1 px-5 py-14 sm:px-8">
        <div className="mb-10 text-center">
          <span className="border-acid/30 bg-acid/10 text-acid inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            {SESSION_LABEL}
          </span>
          <h1 className="font-display text-ink mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Daily Lineup
          </h1>
          <p className="text-ink-3 mt-2 min-h-[1rem] font-mono text-xs">
            {clockLabel ?? "\u00a0"}
          </p>
          <p className="text-ink-2 mx-auto mt-3 max-w-xl text-sm leading-relaxed">
            Five stock cards from your packs, each called up or down. Score is
            that name&apos;s percent move from the 09:30 ET open times 100.
            Lock to bank it early, or take the 16:00 ET close. This page
            compresses one session into {ROUND_DURATION_MS / 1000} seconds so
            you can try the lock now.
          </p>
        </div>

        <TicketGate title="Connect to play">
          {phase === "building" && !hydrated && (
            <p className="text-ink-3 py-16 text-center font-mono text-xs tracking-wide">
              Loading your cards…
            </p>
          )}

          {phase === "building" && hydrated && (
            <LineupBuilder
              lineup={lineup}
              owned={inventory.cards}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onToggleDirection={handleToggleDirection}
              onStart={handleStart}
            />
          )}

          {phase === "active" && (
            <ActiveRound
              lineup={lineup}
              paths={paths}
              progress={progress}
              roundNumber={roundNumber}
              timeLeftLabel={formatTimeLeft(ROUND_DURATION_MS - progress * ROUND_DURATION_MS)}
              onLock={handleLock}
            />
          )}

          {phase === "settled" && (
            <RoundSummary
              lineup={lineup}
              paths={paths}
              roundNumber={roundNumber}
              onPlayAgain={handlePlayAgain}
            />
          )}
        </TicketGate>
      </main>
      <Footer />
    </>
  );
}
