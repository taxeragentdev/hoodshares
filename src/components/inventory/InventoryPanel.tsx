"use client";

import Link from "next/link";
import { AssetCard } from "@/components/AssetCard";
import { TicketGate } from "@/components/TicketGate";
import { IncludedPackCta } from "@/components/ticket/IncludedPackCta";
import { HoodPack } from "@/components/packs/HoodPack";
import { useAuth } from "@/components/AuthProvider";
import { CARDS } from "@/lib/cards";
import { copiesOf, totalCards } from "@/lib/inventory";

export function InventoryPanel() {
  return (
    <TicketGate title="Connect to see your inventory">
      <InventoryBody />
    </TicketGate>
  );
}

function InventoryBody() {
  const { inventory, player } = useAuth();
  const sealed = inventory.packs;
  const cardsHeld = totalCards(inventory);
  const owned = CARDS.filter((card) => copiesOf(inventory, card.id) > 0);
  const grantOpen = Boolean(player?.freePackAvailable);

  return (
    <div className="space-y-6">
      <dl className="border-line bg-surface-2 grid grid-cols-3 gap-3 rounded-2xl border p-4 sm:p-5">
        <Stat label="Sealed packs" value={sealed} />
        <Stat label="Cards" value={cardsHeld} />
        <Stat label="Names" value={owned.length} />
      </dl>

      <section className="border-line bg-surface-2 rounded-2xl border p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-ink text-xl font-bold">Sealed packs</h2>
            <p className="text-ink-2 mt-1 text-sm leading-relaxed">
              Unopened packs stay on this wallet until you tear one.
            </p>
          </div>
          {sealed > 0 && (
            <Link
              href="/packs"
              className="text-acid hover:text-acid-dim text-sm font-semibold whitespace-nowrap"
            >
              Open a pack
            </Link>
          )}
        </div>

        {sealed > 0 ? (
          <div className="mt-8 flex flex-col items-center">
            <div className="relative w-[168px] sm:w-[190px]">
              <HoodPack tiltX={7} tiltY={-10} shineX={40} shineY={26} />
              <span className="bg-acid absolute -top-2 -right-2 rounded-full px-2.5 py-1 font-mono text-xs font-bold text-black">
                ×{sealed}
              </span>
            </div>
            <Link
              href="/packs"
              className="bg-acid hover:bg-acid-dim mt-6 w-full rounded-full py-3.5 text-center text-sm font-bold tracking-wide text-black uppercase transition-colors"
            >
              Open a pack
            </Link>
          </div>
        ) : (
          <p className="text-ink-3 mt-5 text-sm">
            {grantOpen
              ? "Your HoodPass still has one pack waiting. Claim it below."
              : "No sealed packs on this wallet."}
          </p>
        )}

        <IncludedPackCta />
      </section>

      <section className="border-line bg-surface-2 rounded-2xl border p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-ink text-xl font-bold">Cards</h2>
            <p className="text-ink-2 mt-1 text-sm leading-relaxed">
              Pulled from packs. Copies of the same ticker stack.
            </p>
          </div>
          {owned.length > 0 && (
            <Link
              href="/play"
              className="text-acid hover:text-acid-dim text-sm font-semibold whitespace-nowrap"
            >
              Play Daily Lineup
            </Link>
          )}
        </div>

        {owned.length > 0 ? (
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {owned.map((card) => (
              <AssetCard
                key={card.id}
                card={card}
                size="md"
                interactive
                badge={`×${copiesOf(inventory, card.id)}`}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-ink-3 text-sm">
              No cards yet. Open a pack to pull five stock cards.
            </p>
            <Link
              href="/packs"
              className="bg-acid hover:bg-acid-dim mt-5 inline-block rounded-full px-6 py-3 text-sm font-bold tracking-wide text-black uppercase transition-colors"
            >
              Open a pack
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <dt className="text-ink-3 font-mono text-[10px] tracking-[0.16em] uppercase">{label}</dt>
      <dd className="font-display text-ink mt-1 text-2xl font-bold tabular">{value}</dd>
    </div>
  );
}
