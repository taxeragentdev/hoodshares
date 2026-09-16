"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAccount, useSignMessage } from "wagmi";
import { api, ApiError, type OpenPackResponse } from "@/lib/api";
import {
  EMPTY_INVENTORY,
  INVENTORY_STORAGE_KEY,
  loadInventory,
  type Inventory,
} from "@/lib/inventory";
import { openedFromIds, type OpenedCard } from "@/lib/packs";
import type { PlayerSnapshot } from "@/lib/player";
import type { SavedPlay } from "@/lib/game/types";

export type AuthStatus = "boot" | "guest" | "need-sign" | "ready";

interface AuthValue {
  status: AuthStatus;
  player: PlayerSnapshot | null;
  inventory: Inventory;
  ready: boolean;
  signedIn: boolean;
  signing: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  mintPack: (opts?: { grant?: boolean }) => Promise<void>;
  claimTicket: () => Promise<void>;
  syncTicket: () => Promise<void>;
  openPack: () => Promise<OpenedCard[] | null>;
  savePlay: (play: SavedPlay) => Promise<void>;
  settlePlay: () => Promise<PlayerSnapshot | null>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, status: walletStatus } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<AuthStatus>("boot");
  const [player, setPlayer] = useState<PlayerSnapshot | null>(null);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTried = useRef<string | null>(null);
  const sawWallet = useRef(false);
  const addressRef = useRef(address);
  addressRef.current = address;

  const bootstrap = useCallback(async (wallet: `0x${string}`) => {
    setStatus("boot");
    setError(null);
    try {
      const me = await api<PlayerSnapshot>("/api/me");
      if (me.address.toLowerCase() === wallet.toLowerCase()) {
        setPlayer(me);
        setStatus("ready");
        return;
      }
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        setError(err instanceof Error ? err.message : "Could not load your cards");
      }
    }
    setPlayer(null);
    setStatus("need-sign");
  }, []);

  const signIn = useCallback(async () => {
    const wallet = addressRef.current;
    if (!wallet) return;
    setSigning(true);
    setError(null);
    try {
      const { nonce, message } = await api<{ nonce: string; message: string }>(
        "/api/auth/nonce",
        { method: "POST", body: JSON.stringify({ address: wallet }) },
      );
      const signature = await signMessageAsync({ message });
      const next = await api<PlayerSnapshot>("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          address: wallet,
          nonce,
          signature,
          inventory: loadInventory(),
        }),
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(INVENTORY_STORAGE_KEY);
      }
      setPlayer(next);
      setStatus("ready");
    } catch (err) {
      setStatus("need-sign");
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSigning(false);
    }
  }, [signMessageAsync]);

  useEffect(() => {
    if (walletStatus === "connecting" || walletStatus === "reconnecting") return;
    if (!address) {
      autoTried.current = null;
      setPlayer(null);
      setStatus("guest");
      if (sawWallet.current && walletStatus === "disconnected") {
        sawWallet.current = false;
        void fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      }
      return;
    }
    sawWallet.current = true;
    void bootstrap(address);
  }, [address, walletStatus, bootstrap]);

  useEffect(() => {
    if (status !== "need-sign" || !address) return;
    const key = address.toLowerCase();
    if (autoTried.current === key) return;
    autoTried.current = key;
    void signIn();
  }, [status, address, signIn]);

  const mintPack = useCallback(async (opts?: { grant?: boolean }) => {
    const next = await api<PlayerSnapshot>("/api/packs/mint", {
      method: "POST",
      body: JSON.stringify({ grant: Boolean(opts?.grant) }),
    });
    setPlayer(next);
  }, []);

  const claimTicket = useCallback(async () => {
    const next = await api<PlayerSnapshot>("/api/ticket/mint", { method: "POST" });
    setPlayer(next);
  }, []);

  const syncTicket = useCallback(async () => {
    const next = await api<PlayerSnapshot>("/api/ticket/sync", { method: "POST" });
    setPlayer(next);
  }, []);

  const openPack = useCallback(async (): Promise<OpenedCard[] | null> => {
    try {
      const next = await api<OpenPackResponse>("/api/packs/open", { method: "POST" });
      setPlayer(next);
      return openedFromIds(next.opened);
    } catch {
      return null;
    }
  }, []);

  const savePlay = useCallback(async (play: SavedPlay) => {
    const next = await api<PlayerSnapshot>("/api/play", {
      method: "PUT",
      body: JSON.stringify(play),
    });
    setPlayer(next);
  }, []);

  const settlePlay = useCallback(async () => {
    const next = await api<PlayerSnapshot>("/api/play/settle", { method: "POST" });
    setPlayer(next);
    return next;
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      player,
      inventory: player?.inventory ?? EMPTY_INVENTORY,
      ready: status === "guest" || status === "need-sign" || status === "ready",
      signedIn: status === "ready",
      signing,
      error,
      signIn,
      mintPack,
      claimTicket,
      syncTicket,
      openPack,
      savePlay,
      settlePlay,
    }),
    [status, player, signing, error, signIn, mintPack, claimTicket, syncTicket, openPack, savePlay, settlePlay],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
