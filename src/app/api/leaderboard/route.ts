import { connection, NextResponse } from "next/server";
import { buildLeaderboard } from "@/lib/game/leaderboard";
import { sessionId } from "@/lib/game/sessionId";
import { expireActivePlay } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { withStore } from "@/lib/server/store";

export async function GET() {
  await connection();
  const today = sessionId();
  const book = await sessionQuotes();
  const entries = await withStore((store) => {
    return Object.values(store.players).flatMap((player) => {
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
  });

  return NextResponse.json({ board: buildLeaderboard(entries) });
}
