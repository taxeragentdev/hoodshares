import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LeaderboardBoard } from "@/components/leaderboard/LeaderboardBoard";
import { REWARD_TOKEN } from "@/lib/game/leaderboard";

export default function LeaderboardPage() {
  return (
    <>
      <Navbar />
      <main className="bg-void mx-auto w-full max-w-6xl flex-1 px-5 py-14 sm:px-8">
        <div className="mb-10 max-w-2xl">
          <span className="border-acid/30 bg-acid/10 text-acid inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            Today's board
          </span>
          <h1 className="font-display text-ink mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Daily leaderboard
          </h1>
          <p className="text-ink-2 mt-3 text-sm leading-relaxed">
            One session, one board. Score is each stock&apos;s percent move
            from the 09:30 ET open to your lock, or to the 16:00 ET close.
            The top ten split a {REWARD_TOKEN} pool.
          </p>
        </div>

        <LeaderboardBoard />
      </main>
      <Footer />
    </>
  );
}
