import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PackPanel } from "@/components/packs/PackPanel";
import { CARDS } from "@/lib/cards";
import { CARDS_PER_PACK, PACK_PRICE_HOOD_LABEL, PACK_TOKEN_SYMBOL } from "@/lib/packs";

export default function PacksPage() {
  return (
    <>
      <Navbar />
      <main className="bg-void mx-auto w-full max-w-4xl flex-1 px-5 py-14 sm:px-8">
        <div className="mb-10 text-center">
          <span className="border-acid/30 bg-acid/10 text-acid inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            {CARDS.length} Robinhood Chain stocks
          </span>
          <h1 className="font-display text-ink mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Open a pack
          </h1>
          <p className="text-ink-2 mx-auto mt-3 max-w-md text-sm leading-relaxed">
            {CARDS_PER_PACK} cards. One lineup. Your HoodPass includes the first
            pack on this wallet. Extra packs mint here for{" "}
            {PACK_PRICE_HOOD_LABEL} {PACK_TOKEN_SYMBOL}.
          </p>
        </div>

        <PackPanel />

        <div className="border-line bg-surface-2 mt-8 rounded-2xl border p-6">
          <h2 className="text-ink-3 font-mono text-[10px] tracking-[0.2em] uppercase">
            Inside a pack
          </h2>
          <p className="text-ink mt-3 text-sm leading-relaxed">
            Five draws from all {CARDS.length} names. Same stock five times can
            happen. Foil is just the finish. It does not change your score.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
