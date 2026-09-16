import { CollectionSection } from "@/components/CollectionSection";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { GameModes } from "@/components/GameModes";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { ScoringSection } from "@/components/ScoringSection";
import { Roadmap } from "@/components/Roadmap";
import { TickerTape } from "@/components/TickerTape";
import { TreasurySection } from "@/components/TreasurySection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TickerTape />
        <CollectionSection />
        <ScoringSection />
        <GameModes />
        <TreasurySection />
        <Roadmap />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
