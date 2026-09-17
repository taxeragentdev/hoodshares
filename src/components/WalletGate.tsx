"use client";

import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { useAuth } from "@/components/AuthProvider";
import type { ReactNode } from "react";

export function WalletGate({
  title,
  children,
  bare = false,
}: {
  title: string;
  children: ReactNode;
  bare?: boolean;
}) {
  const { status, signedIn, signing, signIn, error } = useAuth();

  if (status === "boot") {
    return (
      <p className="text-ink-3 py-16 text-center font-mono text-xs tracking-wide">
        Loading your cards…
      </p>
    );
  }

  if (status === "guest") {
    if (bare) {
      return (
        <>
          <p className="text-acid font-mono text-[10px] tracking-[0.2em] uppercase">
            Sealed packs
          </p>
          <h2 className="font-display text-ink mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="text-ink-2 mt-3 max-w-md text-sm leading-relaxed">
            Connect your wallet so your packs, cards, lineup, and score stay with
            you, even if you close the tab.
          </p>
          <div className="mt-6 [&_button]:w-full">
            <ConnectWalletButton />
          </div>
        </>
      );
    }
    return (
      <div className="border-line bg-surface-2 rounded-2xl border p-8 text-center">
        <h2 className="font-display text-ink text-xl font-bold">{title}</h2>
        <p className="text-ink-2 mx-auto mt-2 max-w-md text-sm leading-relaxed">
          Connect your wallet so your packs, cards, lineup, and score stay with
          you, even if you close the tab.
        </p>
        <div className="mt-6 flex justify-center">
          <ConnectWalletButton />
        </div>
      </div>
    );
  }

  if (!signedIn) {
    if (bare) {
      return (
        <>
          <p className="text-acid font-mono text-[10px] tracking-[0.2em] uppercase">
            Sealed packs
          </p>
          <h2 className="font-display text-ink mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Save this wallet
          </h2>
          <p className="text-ink-2 mt-3 max-w-md text-sm leading-relaxed">
            One signature opens this wallet. Saving a lineup or locking a card
            will ask you to sign again.
          </p>
          <button
            type="button"
            disabled={signing}
            onClick={() => void signIn()}
            className="bg-acid hover:bg-acid-dim mt-6 w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:opacity-60"
          >
            {signing ? "Check your wallet…" : "Sign in"}
          </button>
          {error && (
            <p className="text-down mt-4 max-w-md text-xs leading-relaxed">{error}</p>
          )}
        </>
      );
    }
    return (
      <div className="border-line bg-surface-2 rounded-2xl border p-8 text-center">
        <h2 className="font-display text-ink text-xl font-bold">Save this wallet</h2>
        <p className="text-ink-2 mx-auto mt-2 max-w-md text-sm leading-relaxed">
          One signature opens this wallet. Saving a lineup or locking a card
          will ask you to sign again.
        </p>
        <button
          type="button"
          disabled={signing}
          onClick={() => void signIn()}
          className="bg-acid hover:bg-acid-dim mt-6 rounded-full px-6 py-3 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:opacity-60"
        >
          {signing ? "Check your wallet…" : "Sign in"}
        </button>
        {error && (
          <p className="text-down mx-auto mt-4 max-w-md text-xs leading-relaxed">{error}</p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
