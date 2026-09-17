"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import {
  useAccount,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { EntryPass } from "@/components/ticket/EntryPass";
import { IncludedPackCta } from "@/components/ticket/IncludedPackCta";
import { OpenSeaCollectionLink, OpenSeaMintLink } from "@/components/ticket/OpenSeaLinks";
import { useAuth } from "@/components/AuthProvider";
import { allowlistProofFor } from "@/lib/allowlist";
import { activeChain } from "@/lib/chains";
import {
  ENTRY_TICKET_ABI,
  ENTRY_TICKET_ADDRESS,
  SALE_PHASE,
} from "@/lib/contracts";
import { OPENSEA_MINT_URL } from "@/lib/opensea";
import { DEMO_TICKET_PRICE_ETH, TICKET_NAME } from "@/lib/ticket";

export function TicketPanel() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const ticketAddress = ENTRY_TICKET_ADDRESS[activeChain.id];
  const onWrongNetwork = isConnected && chainId !== activeChain.id;

  if (onWrongNetwork) {
    return (
      <div className="border-line bg-surface-2 rounded-2xl border p-8 text-center">
        <p className="text-ink-2 text-sm">Wrong network for minting a pass.</p>
        <button
          type="button"
          disabled={isSwitching}
          onClick={() => switchChain({ chainId: activeChain.id })}
          className="bg-down mt-4 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSwitching ? "Switching…" : `Switch to ${activeChain.name}`}
        </button>
      </div>
    );
  }

  if (!ticketAddress) {
    return <DemoTicket />;
  }

  return <LiveTicket ticketAddress={ticketAddress} address={address} isConnected={isConnected} />;
}

function DemoTicket() {
  const { status, signedIn, signing, signIn, error, player, claimTicket, syncTicket } =
    useAuth();
  const [busy, setBusy] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const held = Boolean(player?.ticketHeld);
  const openSeaMint = Boolean(OPENSEA_MINT_URL);

  async function handleClaim() {
    setBusy(true);
    setSyncError(null);
    try {
      await claimTicket();
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    setBusy(true);
    setSyncError(null);
    try {
      await syncTicket();
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "No HoodPass on this wallet yet.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-line bg-surface-2 rounded-2xl border p-6 sm:p-8">
      <div className="mx-auto w-full max-w-[340px]">
        <EntryPass />
      </div>
      <p className="text-ink-3 mt-6 text-center font-mono text-[10px] tracking-[0.2em] uppercase">
        {DEMO_TICKET_PRICE_ETH} ETH · one per wallet
      </p>
      <h2 className="font-display text-ink mt-3 text-center text-xl font-bold">{TICKET_NAME}</h2>
      <p className="text-ink-2 mx-auto mt-2 max-w-md text-center text-sm leading-relaxed">
        One HoodPass per wallet. Extra passes on OpenSea do not add extra
        packs. Mint it on OpenSea. That pass includes one pack you can claim
        here now or later.
      </p>

      {status === "boot" && (
        <p className="text-ink-3 mt-6 text-center font-mono text-xs">Loading…</p>
      )}

      {status === "guest" && (
        <div className="mt-6 space-y-3">
          {openSeaMint ? (
            <>
              <OpenSeaMintLink className="bg-acid hover:bg-acid-dim block rounded-full py-3.5 text-center text-sm font-bold tracking-wide text-black uppercase transition-colors" />
              <div className="flex justify-center">
                <ConnectWalletButton />
              </div>
              <p className="text-ink-3 text-center text-xs leading-relaxed">
                Mint on OpenSea, then connect this wallet to unlock the included
                pack.
              </p>
            </>
          ) : (
            <div className="flex justify-center">
              <ConnectWalletButton />
            </div>
          )}
        </div>
      )}

      {status === "need-sign" && (
        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={signing}
            onClick={() => void signIn()}
            className="bg-acid hover:bg-acid-dim rounded-full px-6 py-3 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:opacity-60"
          >
            {signing ? "Check your wallet…" : "Sign in"}
          </button>
          {error && <p className="text-down mt-3 text-xs">{error}</p>}
        </div>
      )}

      {signedIn && held && (
        <div className="mt-6 space-y-3">
          <p className="border-up/30 bg-up/10 text-up rounded-lg border px-4 py-3 text-center text-xs leading-relaxed">
            This wallet already holds a HoodPass. One is the cap.
          </p>
          <IncludedPackCta />
          {!player?.freePackAvailable && (
            <Link
              href="/packs"
              className="bg-acid hover:bg-acid-dim block rounded-full py-3.5 text-center text-sm font-bold tracking-wide text-black uppercase transition-colors"
            >
              {player?.inventory.packs ? "Open a pack" : "Buy a pack"}
            </Link>
          )}
          <Link
            href="/inventory"
            className="text-acid block text-center text-sm font-semibold"
          >
            See inventory
          </Link>
          <OpenSeaCollectionLink className="text-acid block text-center text-sm font-semibold" />
        </div>
      )}

      {signedIn && !held && (
        <div className="mt-6 space-y-3">
          {openSeaMint ? (
            <>
              <OpenSeaMintLink className="bg-acid hover:bg-acid-dim block rounded-full py-3.5 text-center text-sm font-bold tracking-wide text-black uppercase transition-colors" />
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSync()}
                className="border-line-bright text-ink hover:bg-surface-2 w-full rounded-full border py-3 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {busy ? "Checking…" : "I've minted. Unlock my pack"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={busy || held}
              onClick={() => void handleClaim()}
              className="bg-acid hover:bg-acid-dim w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:opacity-60"
            >
              {busy ? "Minting…" : `Mint ${TICKET_NAME}`}
            </button>
          )}
          {!openSeaMint && (
            <p className="text-ink-3 text-center text-xs leading-relaxed">
              The public drop will mint on OpenSea. Until that collection is
              live, you can mint one pass here to play.
            </p>
          )}
          {openSeaMint && (
            <p className="text-ink-3 text-center text-xs leading-relaxed">
              Mint on OpenSea, then come back on this wallet. The included pack
              stays until you claim it.
            </p>
          )}
          {syncError && <p className="text-down text-center text-xs">{syncError}</p>}
        </div>
      )}

      {!held && !openSeaMint && status === "guest" && (
        <p className="text-ink-3 mt-4 text-center text-xs leading-relaxed">
          The public drop will mint on OpenSea. Until that collection is live,
          you can mint one pass here to play.
        </p>
      )}
    </div>
  );
}

function LiveTicket({
  ticketAddress,
  address,
  isConnected,
}: {
  ticketAddress: `0x${string}`;
  address: `0x${string}` | undefined;
  isConnected: boolean;
}) {
  const { claimTicket, player, syncTicket } = useAuth();
  const proof = address ? allowlistProofFor(address) : null;
  const syncedOnChain = useRef(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      { address: ticketAddress, abi: ENTRY_TICKET_ABI, functionName: "salePhase" },
      { address: ticketAddress, abi: ENTRY_TICKET_ABI, functionName: "price" },
      { address: ticketAddress, abi: ENTRY_TICKET_ABI, functionName: "totalMinted" },
      { address: ticketAddress, abi: ENTRY_TICKET_ABI, functionName: "maxSupply" },
      { address: ticketAddress, abi: ENTRY_TICKET_ABI, functionName: "MAX_PER_WALLET" },
      {
        address: ticketAddress,
        abi: ENTRY_TICKET_ABI,
        functionName: "mintedBy",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
      },
      {
        address: ticketAddress,
        abi: ENTRY_TICKET_ABI,
        functionName: "holdsTicket",
        args: [address ?? "0x0000000000000000000000000000000000000000"],
      },
    ],
    query: { refetchInterval: 15_000 },
  });

  const [phaseIndex, priceWei, totalMinted, maxSupply, , mintedByMe, holds] = (
    data ?? []
  ).map((row) => row?.result) as [
    number?,
    bigint?,
    bigint?,
    bigint?,
    bigint?,
    bigint?,
    boolean?,
  ];

  const phase = phaseIndex !== undefined ? SALE_PHASE[phaseIndex] : undefined;
  const canMintNow = phase === "public" || (phase === "allowlist" && Boolean(proof));
  const alreadyMinted = Boolean(holds || player?.ticketHeld || (mintedByMe !== undefined && mintedByMe > BigInt(0)));
  const totalPrice = priceWei;

  const { writeContract, data: txHash, isPending: isMinting, error: writeError, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (!isConfirmed) return;
    refetch();
    void claimTicket();
  }, [isConfirmed, refetch, claimTicket]);

  useEffect(() => {
    if (!holds || player?.ticketHeld || syncedOnChain.current) return;
    syncedOnChain.current = true;
    void syncTicket().catch(() => {
      syncedOnChain.current = false;
    });
  }, [holds, player?.ticketHeld, syncTicket]);

  async function handleSync() {
    setSyncError(null);
    try {
      await syncTicket();
    } catch (err) {
      setSyncError(
        err instanceof Error ? err.message : "No HoodPass on this wallet yet.",
      );
    }
  }

  function handleMint() {
    if (priceWei === undefined || alreadyMinted) return;
    reset();
    if (phase === "allowlist" && proof) {
      writeContract({
        address: ticketAddress,
        abi: ENTRY_TICKET_ABI,
        functionName: "mintAllowlist",
        args: [BigInt(1), proof],
        value: priceWei,
      });
      return;
    }
    writeContract({
      address: ticketAddress,
      abi: ENTRY_TICKET_ABI,
      functionName: "mintPublic",
      args: [BigInt(1)],
      value: priceWei,
    });
  }

  const label = useMemo(() => {
    if (isMinting) return "Confirm in wallet…";
    if (isConfirming) return "Minting…";
    if (!isConnected) return "Connect a wallet to mint";
    if (phase === "closed") return "Sale closed";
    if (phase === "allowlist" && !canMintNow) return "Not on the allowlist";
    if (alreadyMinted) return "Already minted";
    return `Mint for ${totalPrice !== undefined ? formatEther(totalPrice) : "TBD"} ETH`;
  }, [isMinting, isConfirming, isConnected, phase, canMintNow, alreadyMinted, totalPrice]);

  return (
    <div className="border-line bg-surface-2 rounded-2xl border p-6 sm:p-8">
      <div className="mx-auto mb-8 w-full max-w-[340px]">
        <EntryPass />
      </div>

      {isLoading || !phase ? (
        <div className="bg-surface-3 h-6 w-32 animate-pulse rounded-full" />
      ) : (
        <span className="bg-acid/15 text-acid inline-block rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
          {phase === "closed" ? "Sale closed" : phase === "allowlist" ? "Allowlist mint" : "Public mint"}
        </span>
      )}

      <SupplyBar totalMinted={totalMinted} maxSupply={maxSupply} />

      <p className="text-ink-3 mt-6 font-mono text-[10px] tracking-[0.2em] uppercase">
        One HoodPass per wallet
      </p>
      <p className="font-display text-ink mt-1 text-2xl font-bold tabular">
        {priceWei !== undefined ? `${formatEther(priceWei)} ETH` : "TBD"}
      </p>

      {alreadyMinted && (
        <p className="border-up/30 bg-up/10 text-up mt-4 rounded-lg border px-4 py-3 text-xs leading-relaxed">
          This wallet already holds a HoodPass. One is the cap.
        </p>
      )}

      {OPENSEA_MINT_URL && !alreadyMinted && (
        <>
          <OpenSeaMintLink className="bg-acid hover:bg-acid-dim mt-6 block rounded-full py-3.5 text-center text-sm font-bold tracking-wide text-black uppercase transition-colors" />
          <button
            type="button"
            disabled={!isConnected}
            onClick={() => void handleSync()}
            className="border-line-bright text-ink hover:bg-surface-2 mt-3 w-full rounded-full border py-3 text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {isConnected ? "I've minted. Unlock my pack" : "Connect to unlock your pack"}
          </button>
          <p className="text-ink-3 mt-3 text-center text-xs leading-relaxed">
            Mint on OpenSea, then come back on this wallet. The included pack
            stays until you claim it.
          </p>
        </>
      )}

      {!OPENSEA_MINT_URL && (
        <button
          type="button"
          disabled={
            !isConnected || !canMintNow || alreadyMinted || isMinting || isConfirming
          }
          onClick={handleMint}
          className="bg-acid hover:bg-acid-dim mt-4 w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-30"
        >
          {label}
        </button>
      )}

      <IncludedPackCta />
      <OpenSeaCollectionLink className="text-acid mt-4 block text-center text-sm font-semibold" />

      {syncError && (
        <p className="text-down mt-3 text-center text-xs">{syncError}</p>
      )}
      {writeError && (
        <p className="border-down/30 bg-down/10 text-down mt-4 rounded-lg border px-4 py-3 text-xs leading-relaxed">
          {writeError.message.split("\n")[0]}
        </p>
      )}
    </div>
  );
}

function SupplyBar({
  totalMinted,
  maxSupply,
}: {
  totalMinted: bigint | undefined;
  maxSupply: bigint | undefined;
}) {
  const pct =
    totalMinted !== undefined && maxSupply !== undefined && maxSupply > BigInt(0)
      ? Number((totalMinted * BigInt(1000)) / maxSupply) / 10
      : 0;

  return (
    <div className="mt-5">
      <div className="text-ink-2 flex items-center justify-between font-mono text-xs">
        <span>
          {totalMinted?.toString() ?? "TBD"} / {maxSupply?.toString() ?? "TBD"} minted
        </span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="bg-surface-3 mt-2 h-1.5 overflow-hidden rounded-full">
        <div className="bg-acid h-full transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
