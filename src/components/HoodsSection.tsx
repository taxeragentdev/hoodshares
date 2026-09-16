import { HOODS } from "@/lib/hoods";
import { HoodCard } from "./HoodCard";
import { Section, SectionHeading } from "./ui/Section";

export function HoodsSection() {
  return (
    <Section id="hoods">
      <SectionHeading
        eyebrow="Archetypes"
        title="Four ways to be remembered at the end of a season."
        description="Archetype cards are never sold. Each one is awarded at the season close to the players who best embodied a style of play, which is why they are worth having. There are four separate paths, so the same handful of leaderboard regulars cannot take everything."
      />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {HOODS.map((hood, index) => (
          <div key={hood.id} className="flex flex-col">
            <HoodCard hood={hood} serial={index + 1} />
            <div className="mt-5">
              <p className="text-ink-2 text-sm leading-relaxed">
                {hood.earnedBy}
              </p>
              <p className="text-acid mt-3 font-mono text-[11px] leading-snug tracking-wide">
                {hood.perk}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-line bg-surface mt-14 rounded-2xl border p-6 sm:p-8">
        <h3 className="font-display text-ink text-lg font-bold">
          These grant access, not extra points
        </h3>
        <p className="text-ink-2 mt-3 max-w-3xl text-sm leading-relaxed">
          An archetype can open an invitational bracket, a guild, or an early
          look at a new series. It does not raise your score. If past winners
          also scored higher, the same names would stay on top and new players
          would never catch up. Season two has to be winnable on day one.
        </p>
      </div>
    </Section>
  );
}
