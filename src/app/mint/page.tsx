import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TicketPanel } from "@/components/ticket/TicketPanel";
import { TICKET_NAME, TICKET_SEASON } from "@/lib/ticket";
import { PACK_PRICE_HOOD_LABEL, PACK_TOKEN_SYMBOL } from "@/lib/packs";

export default function MintPage() {
  return (
    <>
      <Navbar />
      <main className="bg-void mx-auto w-full max-w-4xl flex-1 px-5 py-14 sm:px-8">
        <div className="mb-10 text-center">
          <span className="border-acid/30 bg-acid/10 text-acid inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            {TICKET_SEASON}
          </span>
          <h1 className="font-display text-ink mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            {TICKET_NAME}
          </h1>
          <p className="text-ink-2 mx-auto mt-3 max-w-md text-sm leading-relaxed">
            One HoodPass per wallet, minted on OpenSea. That pass includes one
            pack on this wallet. Extra packs mint here for{" "}
            {PACK_PRICE_HOOD_LABEL} {PACK_TOKEN_SYMBOL}.
          </p>
        </div>
        <TicketPanel />
      </main>
      <Footer />
    </>
  );
}
