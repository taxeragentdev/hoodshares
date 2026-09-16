import { connection, NextResponse } from "next/server";
import { boardWithPlayer } from "@/lib/game/lastResult";
import { DEMO_LEADERBOARD } from "@/lib/game/leaderboard";
import { sessionId } from "@/lib/game/sessionId";
import { expireActivePlay } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { withStore } from "@/lib/server/store";

export async function GET() {
  await connection();
  const today = sessionId();
  const book = await sessionQuotes();
  const rows = await withStore((store) => {
    const results = Object.values(store.players).flatMap((player) => {
      expireActivePlay(player, book);
      const latest = [...player.results].reverse().find((row) => row.sessionId === today);
      if (!latest) return [];
      return [
        {
          address: player.address,
          score: Math.round(latest.score),
          lineup: latest.lineup,
        },
      ];
    });
    return results;
  });

  let board = DEMO_LEADERBOARD;
  for (const row of rows) {
    board = boardWithPlayer(board, {
      address: row.address,
      score: row.score,
      lineup: row.lineup,
    });
  }

  return NextResponse.json({ board });
}
