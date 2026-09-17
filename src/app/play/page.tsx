"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TicketGate } from "@/components/TicketGate";
import { useAuth } from "@/components/AuthProvider";
import { LineupBuilder } from "@/components/game/LineupBuilder";
import { ActiveRound } from "@/components/game/ActiveRound";
import { RoundSummary } from "@/components/game/RoundSummary";
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
import { sessionId } from "@/lib/game/sessionId";
import { LINEUP_SIZE, type LineupPick, type RoundPhase } from "@/lib/game/types";

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
  const [phase, setPhase] = useState<RoundPhase>("building");
  const [lineup, setLineup] = useState<LineupPick[]>([]);
  const [roundId, setRoundId] = useState("");
  const [roundNumber, setRoundNumber] = useState(1);
  const [progress, setProgress] = useState(0);
  const [market, setMarket] = useState<SessionPhase>("closed");
  const [clockLabel, setClockLabel] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [live, setLive] = useState<Record<string, number>>({});
  const [openPx, setOpenPx] = useState<Record<string, number>>({});
  const [closePx, setClosePx] = useState<Record<string, number>>({});
  const [rank, setRank] = useState<number | null>(null);
  const slotCounter = useRef(0);
  const restored = useRef(false);

  const today = sessionId();
  const moves = useMemo(() => {
    const next: Record<string, number | null> = {};
    for (const pick of lineup) {
      next[pick.cardId] = pctFromBook(
        pick.cardId,
        pick.lockedUsd,
        live,
        openPx,
        closePx,
      );
    }
    return next;
  }, [lineup, live, openPx, closePx]);

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
      slotCounter.current = play.slotCounter || 0;
    }
    setHydrated(true);
  }, [signedIn, player]);

  useEffect(() => {
    if (!hydrated || lineup.length < LINEUP_SIZE) return;
    if (market === "open" && phase === "building" && (roundId === today || !roundId)) {
      setRoundId(today);
      setPhase("active");
    }
    if ((market === "closed" || market === "weekend") && phase !== "settled") {
      if (lineup.length >= LINEUP_SIZE && (roundId === today || phase === "active")) {
        setPhase("settled");
      }
    }
  }, [hydrated, market, phase, lineup.length, roundId, today]);

  useEffect(() => {
    if (phase !== "active" && phase !== "settled") return;
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
  }, [phase]);

  useEffect(() => {
    if (phase !== "settled" || !player?.address) return;
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
  }, [phase, player?.address]);

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
        roundId: roundId || today,
        roundNumber,
        startedAt: 0,
        slotCounter: slotCounter.current,
      }).catch(() => undefined);
    }, 280);
    return () => window.clearTimeout(handle);
  }, [hydrated, signedIn, phase, lineup, roundId, roundNumber, today, savePlay, settlePlay]);

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

  function handleLockLineup() {
    setRoundId(today);
    void savePlay({
      phase: "building",
      lineup,
      roundId: today,
      roundNumber,
      startedAt: 0,
      slotCounter: slotCounter.current,
    });
  }

  function handleLock(slotId: string) {
    const at = sessionProgress();
    setLineup((prev) =>
      prev.map((pick) =>
        pick.slotId === slotId ? { ...pick, locked: true, lockedAtProgress: at } : pick,
      ),
    );
  }

  function handlePlayAgain() {
    setPhase("building");
    setLineup([]);
    setRoundId("");
    setProgress(0);
    setRank(null);
    setRoundNumber((current) => current + 1);
  }

  const canEdit = market === "preopen" && phase !== "settled";
  const showBuilder = hydrated && canEdit;
  const showLive =
    hydrated &&
    phase === "active" &&
    market === "open" &&
    lineup.length >= LINEUP_SIZE;
  const showSettled = hydrated && phase === "settled";
  const missedOpen =
    hydrated &&
    market === "open" &&
    lineup.length < LINEUP_SIZE &&
    phase !== "settled";
  const closedNoLineup =
    hydrated &&
    (market === "closed" || market === "weekend") &&
    phase !== "settled" &&
    lineup.length < LINEUP_SIZE;

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
            Lock to bank it early, or take the 16:00 ET close.
          </p>
        </div>

        <TicketGate title="Connect to play">
          {!hydrated && signedIn && (
            <p className="text-ink-3 py-16 text-center font-mono text-xs tracking-wide">
              Loading your cards…
            </p>
          )}

          {showBuilder && (
            <LineupBuilder
              lineup={lineup}
              owned={inventory.cards}
              onAdd={handleAdd}
              onRemove={handleRemove}
              onToggleDirection={handleToggleDirection}
              onStart={handleLockLineup}
              startLabel="Save lineup"
              startEnabled
            />
          )}

          {showLive && (
            <ActiveRound
              lineup={lineup}
              moves={moves}
              progress={progress}
              timeLeftLabel={formatTimeLeft(msUntilSessionClose())}
              onLock={handleLock}
            />
          )}

          {showSettled && (
            <RoundSummary
              lineup={lineup}
              moves={moves}
              rank={rank}
              canPlayAgain={market === "preopen"}
              onPlayAgain={handlePlayAgain}
            />
          )}

          {missedOpen && (
            <ClosedPanel
              title="Lineups are locked"
              body="Calls lock at the 09:30 ET open. Come back before the next open and set five cards."
            />
          )}

          {closedNoLineup && (
            <ClosedPanel
              title={market === "weekend" ? "Market closed for the weekend" : "Session settled"}
              body="Daily Lineup runs 09:30 to 16:00 ET on weekdays. Set five calls before the next open."
            />
          )}
        </TicketGate>
      </main>
      <Footer />
    </>
  );
}

function ClosedPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-line bg-surface-2 rounded-2xl border p-8 text-center">
      <h2 className="font-display text-ink text-xl font-bold">{title}</h2>
      <p className="text-ink-2 mx-auto mt-2 max-w-md text-sm leading-relaxed">{body}</p>
    </div>
  );
}
