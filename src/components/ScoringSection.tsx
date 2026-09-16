import { Section, SectionHeading } from "./ui/Section";

const RULES = [
  {
    title: "Same score for every ticker",
    body: "Points equal that stock's percent move from the 09:30 ET open, times 100. Foil on the card face is cosmetic. It does not multiply.",
  },
  {
    title: "Duplicates cost you",
    body: "You can play the same name more than once if you pulled extra copies. Copy 1 is full value. Each extra copy keeps less of a win and loses more on a miss.",
  },
  {
    title: "Cap both ways",
    body: "A lineup is clamped at ±2500 so one volatile name cannot turn the session into a lottery ticket.",
  },
];

export function ScoringSection() {
  return (
    <Section id="scoring">
      <SectionHeading
        eyebrow="Scoring"
        title="Read the tape, not the foil"
        description="Every card in the 30-name roster scores the same way. Packs pull uniformly. The only risk lever is repeating a ticker in the same lineup."
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {RULES.map((rule, index) => (
          <div
            key={rule.title}
            className="border-line bg-surface hover:border-line-bright rounded-2xl border p-6 transition-colors"
          >
            <span className="text-acid font-mono text-xs tracking-[0.2em]">
              0{index + 1}
            </span>
            <h3 className="font-display text-ink mt-3 text-lg font-bold">
              {rule.title}
            </h3>
            <p className="text-ink-2 mt-2 text-sm leading-relaxed">{rule.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
