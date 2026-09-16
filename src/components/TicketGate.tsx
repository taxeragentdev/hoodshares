"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { WalletGate } from "@/components/WalletGate";
import { TICKET_NAME } from "@/lib/ticket";

export function TicketGate({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <WalletGate title={title}>
      <PassCheck>{children}</PassCheck>
    </WalletGate>
  );
}

function PassCheck({ children }: { children: ReactNode }) {
  const { player } = useAuth();
  if (player?.ticketHeld) return <>{children}</>;

  return (
    <div className="border-line bg-surface-2 rounded-2xl border p-8 text-center">
      <h2 className="font-display text-ink text-xl font-bold">You need a {TICKET_NAME}</h2>
      <p className="text-ink-2 mx-auto mt-2 max-w-md text-sm leading-relaxed">
        Mint the Season 01 pass first. That is the door. Packs and Daily
        Lineup open after it is on this wallet.
      </p>
      <Link
        href="/mint"
        className="bg-acid hover:bg-acid-dim mt-6 inline-block rounded-full px-6 py-3 text-sm font-bold tracking-wide text-black uppercase transition-colors"
      >
        Mint {TICKET_NAME}
      </Link>
    </div>
  );
}
