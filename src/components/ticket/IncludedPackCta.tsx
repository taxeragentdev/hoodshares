"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export function IncludedPackCta({ laterHref = "/packs" }: { laterHref?: string }) {
  const { player, mintPack } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!player?.ticketHeld || !player.freePackAvailable) return null;

  async function handleClaim() {
    setBusy(true);
    try {
      await mintPack({ grant: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-acid/30 bg-acid/8 mt-5 space-y-3 rounded-2xl border p-4">
      <p className="text-ink text-sm leading-relaxed">
        This HoodPass includes one pack for this wallet. Extra HoodPass tokens
        do not add another. Claim it now or later.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleClaim()}
        className="bg-acid hover:bg-acid-dim w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:opacity-60"
      >
        {busy ? "Claiming…" : "Claim included pack"}
      </button>
      <Link
        href={laterHref}
        className="border-line-bright text-ink hover:bg-surface-2 block rounded-full border py-3 text-center text-sm font-semibold transition-colors"
      >
        Claim later
      </Link>
    </div>
  );
}
