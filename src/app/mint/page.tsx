import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TicketPanel } from "@/components/ticket/TicketPanel";

export default function MintPage() {
  return (
    <>
      <Navbar />
      <main className="bg-void mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 lg:py-10">
        <TicketPanel />
      </main>
      <Footer />
    </>
  );
}
