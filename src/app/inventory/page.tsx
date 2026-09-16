import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InventoryPanel } from "@/components/inventory/InventoryPanel";

export default function InventoryPage() {
  return (
    <>
      <Navbar />
      <main className="bg-void mx-auto w-full max-w-4xl flex-1 px-5 py-14 sm:px-8">
        <div className="mb-10 text-center">
          <span className="border-acid/30 bg-acid/10 text-acid inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
            This wallet
          </span>
          <h1 className="font-display text-ink mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Inventory
          </h1>
          <p className="text-ink-2 mx-auto mt-3 max-w-md text-sm leading-relaxed">
            Sealed packs wait here until you open them. Cards you already
            pulled stay with this wallet.
          </p>
        </div>
        <InventoryPanel />
      </main>
      <Footer />
    </>
  );
}
