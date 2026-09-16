import { CARDS } from "@/lib/cards";
import { AssetCard } from "./AssetCard";
import { Section, SectionHeading } from "./ui/Section";

export function CollectionSection() {
  return (
    <Section id="collection">
      <SectionHeading
        eyebrow="The Collection"
        title="Robinhood Chain stocks"
        description={`${CARDS.length} official Stock Tokens from the Uniswap Robinhood list. Each card follows that stock's daily move. Every name scores the same.`}
      />

      <div className="mt-14 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {CARDS.map((card) => (
          <AssetCard key={card.id} card={card} size="md" interactive />
        ))}
      </div>
    </Section>
  );
}
