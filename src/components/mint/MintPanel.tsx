"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEther } from "viem";
import {
  useAccount,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { allowlistProofFor } from "@/lib/allowlist";
import { activeChain } from "@/lib/chains";
import {
  COLLECTION_ADDRESS,
  HOOD_SHARES_COLLECTION_ABI,
  SALE_PHASE,
} from "@/lib/contracts";

const contractBase = {
  abi: HOOD_SHARES_COLLECTION_ABI,
} as const;

export function MintPanel() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const collectionAddress = COLLECTION_ADDRESS[activeChain.id];
  const onWrongNetwork = isConnected && chainId !== activeChain.id;

  const [quantity, setQuantity] = useState(1);

  const { data, isLoading, refetch } = useReadContracts({
    contracts: collectionAddress
      ? [
          { ...contractBase, address: collectionAddress, functionName: "salePhase" },
          { ...contractBase, address: collectionAddress, functionName: "mintPrice" },
          { ...contractBase, address: collectionAddress, functionName: "totalMinted" },
          { ...contractBase, address: collectionAddress, functionName: "MAX_SUPPLY" },
          { ...contractBase, address: collectionAddress, functionName: "MAX_PER_WALLET" },
          {
            ...contractBase,
            address: collectionAddress,
            functionName: "mintedBy",
            args: [address ?? "0x0000000000000000000000000000000000000000"],
          },
        ]
      : undefined,
    query: { enabled: Boolean(collectionAddress), refetchInterval: 15_000 },
  });

  const [phaseIndex, priceWei, totalMinted, maxSupply, maxPerWallet, mintedByMe] = (data ?? []).map(
    (r) => r?.result,
  ) as [number?, bigint?, bigint?, bigint?, bigint?, bigint?];

  const phase = phaseIndex !== undefined ? SALE_PHASE[phaseIndex] : undefined;
  const proof = address ? allowlistProofFor(address) : null;

  // In the Allowlist phase, only a wallet with a proof can mint. Once the
  // sale is Public, everyone mints through mintPublic — including allowlist
  // wallets, since the contract does not require the proof there.
  const canMintNow =
    phase === "public" || (phase === "allowlist" && Boolean(proof));

  const remainingWalletAllowance =
    maxPerWallet !== undefined && mintedByMe !== undefined
      ? Number(maxPerWallet - mintedByMe)
      : undefined;

  const remainingSupply =
    maxSupply !== undefined && totalMinted !== undefined
      ? Number(maxSupply - totalMinted)
      : undefined;

  const maxQuantity = Math.max(
    0,
    Math.min(remainingWalletAllowance ?? 20, remainingSupply ?? 20, 20),
  );

  // Clamped at render time rather than synced back into state via an
  // effect — `maxQuantity` shifts as reads resolve, and the stepper's own
  // +/- handlers already keep `quantity` in bounds for user-driven changes.
  const effectiveQuantity = Math.min(Math.max(quantity, 1), Math.max(maxQuantity, 1));

  const totalPrice =
    priceWei !== undefined ? priceWei * BigInt(effectiveQuantity) : undefined;

  const { writeContract, data: txHash, isPending: isMinting, error: writeError, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isConfirmed) refetch();
  }, [isConfirmed, refetch]);

  function handleMint() {
    if (!collectionAddress || priceWei === undefined) return;
    reset();

    if (phase === "allowlist" && proof) {
      writeContract({
        address: collectionAddress,
        abi: HOOD_SHARES_COLLECTION_ABI,
        functionName: "mintAllowlist",
        args: [BigInt(effectiveQuantity), proof],
        value: priceWei * BigInt(effectiveQuantity),
      });
      return;
    }

    writeContract({
      address: collectionAddress,
      abi: HOOD_SHARES_COLLECTION_ABI,
      functionName: "mintPublic",
      args: [BigInt(effectiveQuantity)],
      value: priceWei * BigInt(effectiveQuantity),
    });
  }

  if (!collectionAddress) {
    return (
      <div className="border-line bg-surface-2 rounded-2xl border p-8 text-center">
        <span className="border-line bg-surface text-ink-2 inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
          Not live yet
        </span>
        <h2 className="font-display text-ink mt-4 text-xl font-bold">
          Minting hasn&apos;t opened on {activeChain.name}
        </h2>
        <p className="text-ink-2 mx-auto mt-3 max-w-sm text-sm leading-relaxed">
          The collection contract is tested and ready but not deployed to this network. A
          real Chainlink VRF adapter has to replace the mock reveal provider before this
          goes live on mainnet. See the roadmap below.
        </p>
      </div>
    );
  }

  if (onWrongNetwork) {
    return (
      <div className="border-line bg-surface-2 rounded-2xl border p-8 text-center">
        <p className="text-ink-2 text-sm">Wrong network for minting.</p>
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

  return (
    <div className="border-line bg-surface-2 rounded-2xl border p-6 sm:p-8">
      <PhaseBanner phase={phase} isLoading={isLoading} hasProof={Boolean(proof)} />

      <SupplyBar totalMinted={totalMinted} maxSupply={maxSupply} />

      <div className="mt-8 flex items-center justify-between gap-6">
        <div>
          <p className="text-ink-3 font-mono text-[10px] tracking-[0.2em] uppercase">
            Price per card
          </p>
          <p className="font-display text-ink mt-1 text-2xl font-bold tabular">
            {priceWei !== undefined ? `${formatEther(priceWei)} ETH` : "TBD"}
          </p>
        </div>

        <QuantityStepper
          quantity={effectiveQuantity}
          onChange={setQuantity}
          max={Math.max(maxQuantity, 1)}
          disabled={maxQuantity === 0}
        />
      </div>

      {remainingWalletAllowance !== undefined && (
        <p className="text-ink-3 mt-3 font-mono text-xs">
          {mintedByMe?.toString() ?? "0"} minted by this wallet, {remainingWalletAllowance}{" "}
          remaining of the {maxPerWallet?.toString()} per-wallet cap
        </p>
      )}

      <MintButton
        isConnected={isConnected}
        canMintNow={canMintNow}
        phase={phase}
        maxQuantity={maxQuantity}
        totalPrice={totalPrice}
        isMinting={isMinting}
        isConfirming={isConfirming}
        onMint={handleMint}
      />

      {writeError && (
        <p className="border-down/30 bg-down/10 text-down mt-4 rounded-lg border px-4 py-3 text-xs leading-relaxed">
          {writeError.message.split("\n")[0]}
        </p>
      )}

      {isConfirmed && (
        <p className="border-up/30 bg-up/10 text-up mt-4 rounded-lg border px-4 py-3 text-xs leading-relaxed">
          Minted. Cards stay unrevealed, with no rarity or art, until the VRF reveal
          runs for the whole collection at once.
        </p>
      )}
    </div>
  );
}

function PhaseBanner({
  phase,
  isLoading,
  hasProof,
}: {
  phase: string | undefined;
  isLoading: boolean;
  hasProof: boolean;
}) {
  if (isLoading || !phase) {
    return <div className="bg-surface-3 h-6 w-32 animate-pulse rounded-full" />;
  }

  const label =
    phase === "closed" ? "Sale closed" : phase === "allowlist" ? "Allowlist mint" : "Public mint";

  return (
    <div className="flex items-center gap-3">
      <span className="bg-acid/15 text-acid rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
        {label}
      </span>
      {phase === "allowlist" && (
        <span className={`font-mono text-[11px] ${hasProof ? "text-up" : "text-ink-3"}`}>
          {hasProof ? "This wallet is on the allowlist" : "This wallet is not on the allowlist"}
        </span>
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
        <div
          className="bg-acid h-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuantityStepper({
  quantity,
  onChange,
  max,
  disabled,
}: {
  quantity: number;
  onChange: (n: number) => void;
  max: number;
  disabled: boolean;
}) {
  return (
    <div className="border-line bg-surface flex items-center gap-4 rounded-full border px-2 py-1.5">
      <button
        type="button"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className="text-ink flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="font-display w-6 text-center text-lg font-bold tabular">
        {quantity}
      </span>
      <button
        type="button"
        disabled={disabled || quantity >= max}
        onClick={() => onChange(Math.min(max, quantity + 1))}
        className="text-ink flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors disabled:opacity-30"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

function MintButton({
  isConnected,
  canMintNow,
  phase,
  maxQuantity,
  totalPrice,
  isMinting,
  isConfirming,
  onMint,
}: {
  isConnected: boolean;
  canMintNow: boolean;
  phase: string | undefined;
  maxQuantity: number;
  totalPrice: bigint | undefined;
  isMinting: boolean;
  isConfirming: boolean;
  onMint: () => void;
}) {
  const label = useMemo(() => {
    if (isMinting) return "Confirm in wallet…";
    if (isConfirming) return "Minting…";
    if (!isConnected) return "Connect a wallet to mint";
    if (phase === "closed") return "Sale closed";
    if (phase === "allowlist" && !canMintNow) return "Not on the allowlist";
    if (maxQuantity === 0) return "Wallet cap reached";
    return `Mint for ${totalPrice !== undefined ? formatEther(totalPrice) : "TBD"} ETH`;
  }, [isMinting, isConfirming, isConnected, phase, canMintNow, maxQuantity, totalPrice]);

  const disabled =
    !isConnected || !canMintNow || maxQuantity === 0 || isMinting || isConfirming;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onMint}
      className="bg-acid hover:bg-acid-dim mt-6 w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-30"
    >
      {label}
    </button>
  );
}
