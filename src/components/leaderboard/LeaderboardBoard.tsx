"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { api } from "@/lib/api";
import {
  SESSION_PRIZE_POOL,
  LEADERBOARD_PAYOUT_BPS,
  PAID_RANKS,
  REWARD_TOKEN,
  truncateAddress,
  type LeaderboardRow,
  type LineupChip,
} from "@/lib/game/leaderboard";
import { isYouAddress } from "@/lib/game/lastResult";
import {
  SESSION_LABEL,
  sessionPhase,
  sessionPhaseLabel,
  type SessionPhase,
} from "@/lib/game/session";

export function LeaderboardBoard() {
  const { address } = useAccount();
  const [phase, setPhase] = useState<SessionPhase>("closed");
  const [board, setBoard] = useState<LeaderboardRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPhase(sessionPhase());
    let cancelled = false;
    void api<{ board: LeaderboardRow[] }>("/api/leaderboard")
      .then((data) => {
        if (!cancelled) setBoard(data.board);
      })
      .catch(() => {
        if (!cancelled) setBoard([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const phaseLabel = sessionPhaseLabel(phase);
  const live = phase === "open";
  const podium = board.slice(0, 3);
  const field = board.slice(3);
  const topScore = board[0]?.score ?? 0;
  const yourRow = board.find((row) => isYouAddress(row.address, address));
  const empty = loaded && board.length === 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="This week's pool"
          value={`${SESSION_PRIZE_POOL.toLocaleString("en-US")} ${REWARD_TOKEN}`}
          hint="Paid once a week after Friday's close"
        />
        <StatCard
          label="Field"
          value={String(board.length)}
          hint="Lineups lock each weekday at 09:30 ET"
        />
        <StatCard
          label="High score"
          value={topScore.toLocaleString("en-US")}
          hint="Percent move × 100, then the duplicate cut"
        />
        <StatCard
          label="Your rank"
          value={yourRow ? `#${yourRow.rank}` : "None"}
          hint={
            yourRow
              ? `${yourRow.score.toLocaleString("en-US")} pts`
              : "Play Daily Lineup this week to land on this board"
          }
        />
      </div>

      <div className="border-line bg-surface-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 rounded-full ${live ? "bg-up shadow-[0_0_10px_#00e08f]" : "bg-ink-3"}`}
          />
          <p className="text-ink text-sm font-medium">{phaseLabel}</p>
        </div>
        <p className="text-ink-3 font-mono text-xs">{SESSION_LABEL}</p>
      </div>

      {empty ? (
        <div className="border-line bg-surface-2 rounded-2xl border px-6 py-16 text-center">
          <h2 className="font-display text-ink text-xl font-bold">No scores yet</h2>
          <p className="text-ink-2 mx-auto mt-2 max-w-md text-sm leading-relaxed">
            This week's board adds each Daily Lineup score from Monday to
            Friday. {REWARD_TOKEN} pays after Friday's 16:00 ET close.
          </p>
          <Link
            href="/play"
            className="bg-acid hover:bg-acid-dim mt-6 inline-block rounded-full px-6 py-3 text-sm font-bold tracking-wide text-black uppercase transition-colors"
          >
            Daily Lineup
          </Link>
        </div>
      ) : (
        <>
      <div className="grid items-end gap-3 md:grid-cols-3">
        <PodiumCard row={podium[0]} place="first" you={yourRow?.rank === podium[0]?.rank} />
        <PodiumCard row={podium[1]} place="second" you={yourRow?.rank === podium[1]?.rank} />
        <PodiumCard row={podium[2]} place="third" you={yourRow?.rank === podium[2]?.rank} />
      </div>

      <div className="border-line bg-surface-2 overflow-hidden rounded-2xl border">
        <div className="border-line text-ink-3 hidden grid-cols-[3rem_minmax(8rem,1fr)_minmax(0,1.6fr)_6rem_5.5rem_7rem] gap-3 border-b px-5 py-2.5 font-mono text-[10px] tracking-[0.16em] uppercase sm:grid">
          <span>#</span>
          <span>Player</span>
          <span>Lineup</span>
          <span className="text-right">Score</span>
          <span className="text-right">Gap</span>
          <span className="text-right">Payout</span>
        </div>
        <ol className="divide-y divide-[#242424]">
          {field.map((row) => (
            <LeaderboardRowItem
              key={row.rank}
              row={row}
              topScore={topScore}
              highlight={yourRow?.rank === row.rank}
              you={yourRow?.rank === row.rank}
            />
          ))}
        </ol>
      </div>

      <PayoutSplit />
        </>
      )}

      <p className="text-ink-3 text-center text-xs leading-relaxed">
        After Friday's close, the top ten split a weekly {REWARD_TOKEN} pool.{" "}
        <Link href="/play" className="text-ink hover:text-acid underline-offset-2 hover:underline">
          Run a lineup
        </Link>
        .
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="border-line bg-surface-2 rounded-2xl border px-5 py-4">
      <p className="text-ink-3 font-mono text-[10px] tracking-[0.2em] uppercase">{label}</p>
      <p className="font-display text-ink mt-1 text-2xl font-bold tabular">{value}</p>
      <p className="text-ink-3 mt-1 text-xs leading-relaxed">{hint}</p>
    </div>
  );
}

function PodiumCard({
  row,
  place,
  you,
}: {
  row: LeaderboardRow | undefined;
  place: "first" | "second" | "third";
  you: boolean;
}) {
  if (!row) return null;
  const frame =
    place === "first"
      ? "border-acid/50 bg-acid/5 md:mb-0 md:py-6"
      : place === "second"
        ? "border-line bg-surface-2 md:mb-4"
        : "border-line bg-surface-2 md:mb-8";
  const medal = place === "first" ? "text-acid" : place === "second" ? "text-ink" : "text-[#c48a5a]";

  return (
    <article className={`rounded-2xl border px-5 py-5 ${frame} ${place === "first" ? "md:order-2" : place === "second" ? "md:order-1" : "md:order-3"}`}>
      <p className={`font-mono text-[11px] font-bold tracking-[0.18em] uppercase ${medal}`}>
        {place === "first" ? "1st" : place === "second" ? "2nd" : "3rd"}
      </p>
      <p className="font-display text-ink mt-2 text-lg font-bold">
        {you ? "You" : truncateAddress(row.address)}
      </p>
      <p className="font-display text-ink mt-1 text-3xl font-bold tabular">{row.score.toLocaleString("en-US")}</p>
      <p className="text-up mt-1 font-mono text-sm tabular">
        {row.payout.toLocaleString("en-US")} {REWARD_TOKEN}
      </p>
      <div className="mt-4">
        <LineupChips lineup={row.lineup} />
      </div>
    </article>
  );
}

function LeaderboardRowItem({
  row,
  highlight,
  you,
  topScore,
}: {
  row: LeaderboardRow;
  highlight: boolean;
  you: boolean;
  topScore: number;
}) {
  const gap = row.score - topScore;
  const paid = row.rank <= PAID_RANKS;

  return (
    <li
      className={`grid grid-cols-1 items-center gap-3 px-5 py-3.5 sm:grid-cols-[3rem_minmax(8rem,1fr)_minmax(0,1.6fr)_6rem_5.5rem_7rem] ${
        highlight ? "bg-acid/5" : ""
      }`}
    >
      <span className="text-ink-3 font-mono text-sm font-bold tabular">
        {row.rank}
      </span>
      <span className="text-ink font-mono text-sm">
        {you ? "You" : truncateAddress(row.address)}
      </span>
      <LineupChips lineup={row.lineup} />
      <span
        className={`text-left font-mono text-sm font-bold tabular sm:text-right ${
          row.score >= 0 ? "text-ink" : "text-down"
        }`}
      >
        {row.score.toLocaleString("en-US")}
      </span>
      <span className="text-ink-3 hidden text-right font-mono text-xs tabular sm:block">
        {gap === 0 ? "0" : gap.toLocaleString("en-US")}
      </span>
      <span
        className={`text-left font-mono text-sm tabular sm:text-right ${
          paid ? "text-up" : "text-ink-3"
        }`}
      >
        {paid ? `${row.payout.toLocaleString("en-US")} ${REWARD_TOKEN}` : "None"}
      </span>
    </li>
  );
}

function LineupChips({ lineup }: { lineup: LineupChip[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {lineup.map((chip, index) => (
        <span
          key={`${chip.ticker}-${index}`}
          title={`${chip.ticker} ${chip.direction.toUpperCase()}`}
          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide ${
            chip.direction === "up"
              ? "bg-up/10 text-up"
              : "bg-down/10 text-down"
          }`}
        >
          {chip.ticker}
          <span className="ml-0.5 opacity-70">{chip.direction === "up" ? "↑" : "↓"}</span>
        </span>
      ))}
    </div>
  );
}

function PayoutSplit() {
  const slices = LEADERBOARD_PAYOUT_BPS.map((bps, index) => ({
    rank: index + 1,
    bps,
    pct: bps / 100,
  }));

  return (
    <div className="border-line bg-surface-2 rounded-2xl border px-5 py-5">
      <p className="text-ink-3 font-mono text-[10px] tracking-[0.2em] uppercase">
        Pool split
      </p>
      <p className="text-ink-2 mt-1 text-sm">
        Rank 1 takes 40%. Rank 10 takes 2%. Nothing below the cut line.
      </p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full">
        {slices.map((slice) => (
          <span
            key={slice.rank}
            title={`#${slice.rank} · ${slice.pct}%`}
            className="h-full"
            style={{
              width: `${slice.pct}%`,
              background:
                slice.rank === 1
                  ? "#ccff00"
                  : slice.rank === 2
                    ? "#9cc400"
                    : `rgba(204,255,0,${Math.max(0.18, 0.55 - slice.rank * 0.04)})`,
            }}
          />
        ))}
      </div>
      <div className="text-ink-3 mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tabular">
        {slices.map((slice) => (
          <span key={slice.rank}>
            #{slice.rank} {slice.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}
