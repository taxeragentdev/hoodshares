import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LeaderboardBoard } from "@/components/leaderboard/LeaderboardBoard";
import { REWARD_TOKEN } from "@/lib/game/leaderboard";
import { ROUND_ENTRY_LABEL } from "@/lib/token";

export default function LeaderboardPage() {
  return (
    <>
      <Navbar />
      <main className="bg-void mx-auto w-full max-w-6xl flex-1 px-5 py-14 sm:px-8">
        <div className="mb-10 max-w-2xl">
          <span className="border-acid/30 bg-acid/10 text-acid inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            This week's board
          </span>
          <h1 className="font-display text-ink mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Weekly leaderboard
          </h1>
          <p className="text-ink-2 mt-3 text-sm leading-relaxed">
            Play Daily Lineup on weekdays. Each round is {ROUND_ENTRY_LABEL}{" "}
            {REWARD_TOKEN}. Scores add up Monday to Friday. After
            Friday&apos;s 16:00 ET close, the top ten split a weekly{" "}
            {REWARD_TOKEN} pool.
          </p>
        </div>

        <LeaderboardBoard />
      </main>
      <Footer />
    </>
  );
}
