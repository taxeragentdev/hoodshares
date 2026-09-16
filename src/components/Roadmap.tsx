import { Section, SectionHeading } from "./ui/Section";

const NEXT = [
  {
    title: "Duels",
    body: "Three card matches on the same session clock. Both sides post a ticket. The winner takes the pot at the close.",
  },
  {
    title: "Partnerships",
    body: "Creator and brand drops that put new packs and cards in play. Same game, more hands to chase.",
  },
  {
    title: "Crypto cards",
    body: "Crypto tickers join the roster after the stock deck is live. Same percent move scoring. Same Daily Lineup rules.",
  },
];

export function Roadmap() {
  return (
    <Section id="roadmap">
      <SectionHeading
        eyebrow="Coming next"
        title="What else is on the table"
        description="Daily Lineup is the start. These land after the stock deck is in play."
      />

      <ol className="mt-14 grid gap-5 sm:grid-cols-3">
        {NEXT.map((item) => (
          <li
            key={item.title}
            className="border-line bg-surface hover:border-line-bright rounded-2xl border p-7 transition-colors"
          >
            <span className="text-acid font-mono text-[10px] tracking-[0.18em] uppercase">
              Coming
            </span>
            <h3 className="font-display text-ink mt-4 text-xl font-bold tracking-tight">
              {item.title}
            </h3>
            <p className="text-ink-2 mt-2.5 text-sm leading-relaxed">{item.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
