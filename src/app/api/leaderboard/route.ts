import { connection, NextResponse } from "next/server";
import { buildLeaderboard } from "@/lib/game/leaderboard";
import { isSessionInWeek, weekId } from "@/lib/game/sessionId";
import { syncPlayState } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { withStore } from "@/lib/server/store";

export async function GET() {
  await connection();
  const week = weekId();
  const book = await sessionQuotes();
  const entries = await withStore((store) => {
    return Object.values(store.players).flatMap((player) => {
      syncPlayState(player, book);
      const weekRows = player.results.filter((row) =>
        isSessionInWeek(row.sessionId, week),
      );
      if (weekRows.length === 0) return [];
      const latest = weekRows[weekRows.length - 1]!;
      const score = weekRows.reduce((sum, row) => sum + row.score, 0);
      return [
        {
          address: player.address,
          score: Math.round(score),
          lineup: latest.lineup,
        },
      ];
    });
  });

  return NextResponse.json({ board: buildLeaderboard(entries), week });
}
