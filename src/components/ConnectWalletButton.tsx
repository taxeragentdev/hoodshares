"use client";

import { useEffect, useRef, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { useAuth } from "@/components/AuthProvider";
import { activeChain } from "@/lib/chains";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { status, signing, signIn } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="bg-acid rounded-full px-5 py-2.5 text-sm font-semibold text-black opacity-60"
      >
        Connect Wallet
      </button>
    );
  }

  if (isConnected && address) {
    const wrongNetwork = chainId !== activeChain.id;

    if (wrongNetwork) {
      return (
        <button
          type="button"
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: activeChain.id })}
          className="rounded-full bg-down px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSwitching ? "Switching…" : `Switch to ${activeChain.name}`}
        </button>
      );
    }

    if (status === "need-sign" || signing) {
      return (
        <button
          type="button"
          disabled={signing}
          onClick={() => void signIn()}
          className="bg-acid hover:bg-acid-dim rounded-full px-5 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-60"
        >
          {signing ? "Check wallet…" : "Sign to save"}
        </button>
      );
    }

    return (
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="border-line bg-surface-2 hover:border-line-bright flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors"
        >
          <span className="bg-up h-1.5 w-1.5 rounded-full" />
          <span className="tabular font-mono">{truncateAddress(address)}</span>
        </button>
        {menuOpen && (
          <div className="border-line bg-surface-2 absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border shadow-xl">
            <button
              type="button"
              onClick={() => {
                disconnect();
                setMenuOpen(false);
              }}
              className="text-ink hover:bg-surface-3 w-full px-4 py-2.5 text-left text-sm"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        disabled={isConnecting}
        onClick={() => setMenuOpen((open) => !open)}
        className="bg-acid hover:bg-acid-dim rounded-full px-5 py-2.5 text-sm font-semibold text-black transition-colors disabled:opacity-60"
      >
        {isConnecting ? "Connecting…" : "Connect Wallet"}
      </button>
      {menuOpen && (
        <div className="border-line bg-surface-2 absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border shadow-xl">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              onClick={() => {
                connect({ connector, chainId: activeChain.id });
                setMenuOpen(false);
              }}
              className="text-ink hover:bg-surface-3 flex w-full items-center justify-between px-4 py-2.5 text-left text-sm"
            >
              {connector.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
