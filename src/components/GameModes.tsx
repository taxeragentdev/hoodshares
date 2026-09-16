import Link from "next/link";
import { SESSION_LABEL } from "@/lib/game/session";
import { REWARD_TOKEN } from "@/lib/game/leaderboard";
import { Section, SectionHeading } from "./ui/Section";

const MODES = [
  {
    tag: "Daily",
    title: "Daily Lineup",
    cadence: SESSION_LABEL,
    body: "Before the 09:30 ET open, pick five stock cards and call each one up or down. Your score is that stock's percent move from the official open. Lock a card to freeze it, or wait for the 16:00 ET close.",
    points: [
      "Points equal today's percent change times 100",
      "Lock banks the move so far. Unlocked cards take the close.",
      "Using the same card twice cuts a win and raises a miss.",
    ],
    accent: "#ccff00",
  },
  {
    tag: "Rewards",
    title: "HOOD leaderboard",
    cadence: "Settles at the close",
    body: `When the session ends, ranks go up and the top ten split a ${REWARD_TOKEN} pool.`,
    points: [
      "Ranked by session score, not by wallet size",
      `${REWARD_TOKEN} paid to the top ten`,
      "No round on weekends or US market holidays",
    ],
    accent: "#38bdf8",
  },
  {
    tag: "Later",
    title: "Duels",
    cadence: "After Daily Lineup is live",
    body: "Three card matches on the same session clock. Both sides post a ticket, the treasury adds a match, and the winner takes it at the close. This comes after the daily board has real scores.",
    points: [
      "Same lock and percent move rules as Daily Lineup",
      "Equal tickets, winner takes the pot",
      "Not required to play the daily",
    ],
    accent: "#a855f7",
  },
];

export function GameModes() {
  return (
    <Section id="play">
      <SectionHeading
        eyebrow="Play"
        title="Daily Lineup follows US market hours"
        description="Lineups lock at the 09:30 ET open. Your score follows each stock's percent move from that print until you lock the card or the 16:00 ET close."
      />

      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {MODES.map((mode) => (
          <article
            key={mode.title}
            className="border-line bg-surface hover:border-line-bright group relative overflow-hidden rounded-2xl border p-7 transition-colors"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 -right-16 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ backgroundColor: `${mode.accent}30` }}
            />

            <div className="relative">
              <span
                className="font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{ color: mode.accent }}
              >
                {mode.tag}
              </span>
              <h3 className="font-display text-ink mt-3 text-2xl font-bold tracking-tight">
                {mode.title}
              </h3>
              <p className="text-ink-3 mt-1.5 font-mono text-[11px] tracking-wide">
                {mode.cadence}
              </p>
              <p className="text-ink-2 mt-5 text-sm leading-relaxed">
                {mode.body}
              </p>

              <ul className="border-line mt-6 space-y-2.5 border-t pt-5">
                {mode.points.map((point) => (
                  <li
                    key={point}
                    className="text-ink-2 flex gap-2.5 text-sm leading-snug"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: mode.accent }}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/play"
          className="bg-acid hover:bg-acid-dim inline-block rounded-full px-6 py-3 text-sm font-semibold text-black transition-colors"
        >
          Try Daily Lineup
        </Link>
        <Link
          href="/leaderboard"
          className="border-line hover:border-acid hover:text-acid text-ink-2 inline-block rounded-full border px-6 py-3 text-sm font-semibold transition-colors"
        >
          View the board
        </Link>
      </div>
    </Section>
  );
}
