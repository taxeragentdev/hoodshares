"use client";

import { useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import {
  useAccount,
  useReadContracts,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { TicketGate } from "@/components/TicketGate";
import { IncludedPackCta } from "@/components/ticket/IncludedPackCta";
import { activeChain } from "@/lib/chains";
import { CARDS } from "@/lib/cards";
import { copiesOf, totalCards } from "@/lib/inventory";
import { useAuth } from "@/components/AuthProvider";
import { HoodPack } from "./HoodPack";
import { PackOpener } from "./PackOpener";
import { AssetCard } from "@/components/AssetCard";
import {
  ERC20_ABI,
  PACK_SHOP_ABI,
  PACK_SHOP_ADDRESS,
  ZERO_ADDRESS,
} from "@/lib/contracts";
import {
  CARDS_PER_PACK,
  DEMO_PACK_PRICE,
  PACK_TOKEN_SYMBOL,
  type OpenedCard,
} from "@/lib/packs";

export function PackPanel() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const shopAddress = PACK_SHOP_ADDRESS[activeChain.id];
  const onWrongNetwork = isConnected && chainId !== activeChain.id;

  const { data: shopData } = useReadContracts({
    contracts: shopAddress
      ? [
          { address: shopAddress, abi: PACK_SHOP_ABI, functionName: "saleOpen" },
          { address: shopAddress, abi: PACK_SHOP_ABI, functionName: "packPrice" },
          { address: shopAddress, abi: PACK_SHOP_ABI, functionName: "paymentToken" },
        ]
      : undefined,
    query: { enabled: Boolean(shopAddress), refetchInterval: 15_000 },
  });

  const saleOpen = shopData?.[0]?.result as boolean | undefined;
  const packPrice = shopData?.[1]?.result as bigint | undefined;
  const paymentToken = shopData?.[2]?.result as `0x${string}` | undefined;
  const tokenReady = Boolean(paymentToken && paymentToken !== ZERO_ADDRESS);

  const { data: tokenData } = useReadContracts({
    contracts:
      tokenReady && address
        ? [
            { address: paymentToken!, abi: ERC20_ABI, functionName: "symbol" },
            { address: paymentToken!, abi: ERC20_ABI, functionName: "decimals" },
            { address: paymentToken!, abi: ERC20_ABI, functionName: "balanceOf", args: [address] },
            {
              address: paymentToken!,
              abi: ERC20_ABI,
              functionName: "allowance",
              args: [address, shopAddress!],
            },
          ]
        : undefined,
    query: { enabled: tokenReady && Boolean(address) && Boolean(shopAddress) },
  });

  const tokenSymbol = (tokenData?.[0]?.result as string | undefined) ?? PACK_TOKEN_SYMBOL;
  const tokenDecimals = (tokenData?.[1]?.result as number | undefined) ?? 18;
  const balance = tokenData?.[2]?.result as bigint | undefined;
  const allowance = tokenData?.[3]?.result as bigint | undefined;

  const [quantity, setQuantity] = useState(1);

  const { writeContract, data: txHash, isPending: isWriting, error: writeError, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const needsApprove =
    tokenReady && packPrice !== undefined && allowance !== undefined
      ? allowance < packPrice * BigInt(quantity)
      : false;

  function handleLiveAction() {
    if (!shopAddress || !paymentToken || packPrice === undefined) return;
    reset();
    const cost = packPrice * BigInt(quantity);
    if (needsApprove) {
      writeContract({
        address: paymentToken,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [shopAddress, cost],
      });
      return;
    }
    writeContract({
      address: shopAddress,
      abi: PACK_SHOP_ABI,
      functionName: "buyPacks",
      args: [BigInt(quantity)],
    });
  }

  if (onWrongNetwork) {
    return (
      <div className="border-line bg-surface-2 rounded-2xl border p-8 text-center">
        <p className="text-ink-2 text-sm">Wrong network for buying packs.</p>
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

  if (!shopAddress) {
    return (
      <TicketGate title="Connect to open packs">
        <DemoPack />
      </TicketGate>
    );
  }

  const priceLabel =
    packPrice !== undefined ? `${formatUnits(packPrice, tokenDecimals)} ${tokenSymbol}` : "TBD";
  const totalLabel =
    packPrice !== undefined
      ? `${formatUnits(packPrice * BigInt(quantity), tokenDecimals)} ${tokenSymbol}`
      : "TBD";
  const canAfford =
    balance !== undefined && packPrice !== undefined
      ? balance >= packPrice * BigInt(quantity)
      : false;

  const liveLabel = (() => {
    if (isWriting) return "Confirm in wallet…";
    if (isConfirming) return "Buying…";
    if (!isConnected) return "Connect a wallet to buy packs";
    if (!tokenReady) return "Project token not set yet";
    if (saleOpen === false) return "Pack sale closed";
    if (!canAfford) return `Need ${totalLabel}`;
    if (needsApprove) return `Approve ${totalLabel}`;
    return `Buy ${quantity} pack${quantity === 1 ? "" : "s"} for ${totalLabel}`;
  })();

  return (
    <div className="border-line bg-surface-2 rounded-2xl border p-6 sm:p-8">
      <div className="mx-auto mb-8 w-[168px] sm:w-[190px]">
        <HoodPack tiltX={7} tiltY={-10} shineX={40} shineY={26} />
      </div>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-ink-3 font-mono text-[10px] tracking-[0.2em] uppercase">
            Price per pack
          </p>
          <p className="font-display text-ink mt-1 text-2xl font-bold tabular">{priceLabel}</p>
          <p className="text-ink-3 mt-1 font-mono text-xs">
            {CARDS_PER_PACK} cards. Paid in {tokenSymbol}.
          </p>
        </div>
        <QuantityStepper quantity={quantity} onChange={setQuantity} />
      </div>

      {balance !== undefined && (
        <p className="text-ink-3 mt-3 font-mono text-xs">
          Wallet: {formatUnits(balance, tokenDecimals)} {tokenSymbol}
        </p>
      )}

      <IncludedPackCta laterHref="/packs" />

      <button
        type="button"
        disabled={
          !isConnected ||
          !tokenReady ||
          saleOpen === false ||
          !canAfford ||
          isWriting ||
          isConfirming
        }
        onClick={handleLiveAction}
        className="bg-acid hover:bg-acid-dim mt-6 w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-30"
      >
        {liveLabel}
      </button>

      {writeError && (
        <p className="border-down/30 bg-down/10 text-down mt-4 rounded-lg border px-4 py-3 text-xs leading-relaxed">
          {writeError.message.split("\n")[0]}
        </p>
      )}
      {isConfirmed && !needsApprove && (
        <p className="border-up/30 bg-up/10 text-up mt-4 rounded-lg border px-4 py-3 text-xs leading-relaxed">
          Packs are in your collection. Tear one open to pull five stock cards.
        </p>
      )}
    </div>
  );
}

function DemoPack() {
  const { inventory, mintPack, openPack, player } = useAuth();
  const [opened, setOpened] = useState<OpenedCard[] | null>(null);
  const [busy, setBusy] = useState(false);
  const grantOpen = Boolean(player?.freePackAvailable);

  async function handleOpen() {
    const pulled = await openPack();
    if (!pulled) return false;
    setOpened(pulled);
    return true;
  }

  async function handleMint() {
    setBusy(true);
    try {
      await mintPack({ grant: grantOpen });
    } finally {
      setBusy(false);
    }
  }

  const owned = CARDS.filter((card) => copiesOf(inventory, card.id) > 0);
  const showOpener = Boolean(opened) || inventory.packs > 0;

  return (
    <div className="space-y-6">
      <div className="border-line bg-surface-2 rounded-2xl border p-6 sm:p-8">
        <span className="border-acid/30 bg-acid/10 text-acid inline-block rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.2em] uppercase">
          {DEMO_PACK_PRICE} {PACK_TOKEN_SYMBOL} when the sale opens
        </span>
        <h2 className="font-display text-ink mt-4 text-xl font-bold">Sealed packs</h2>
        <p className="text-ink-2 mt-2 text-sm leading-relaxed">
          Tear one open for {CARDS_PER_PACK} stock cards. Enough for one Daily
          Lineup. HoodPass includes one pack. Claim it now or later, then buy
          more when you want another hand.
        </p>

        <p className="text-ink-3 mt-4 font-mono text-xs">
          Sealed packs {inventory.packs} · Cards {totalCards(inventory)}
        </p>

        {!showOpener && (
          <>
            <div className="mx-auto mt-8 w-[168px] sm:w-[190px]">
              <HoodPack tiltX={7} tiltY={-10} shineX={40} shineY={26} />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleMint()}
              className="bg-acid hover:bg-acid-dim mt-6 w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:opacity-60"
            >
              {busy
                ? "Getting a pack…"
                : grantOpen
                  ? "Claim included pack"
                  : "Buy a pack"}
            </button>
            {grantOpen && (
              <p className="text-ink-3 mt-3 text-center text-xs">
                Included with your HoodPass. It stays on this wallet until you claim it.
              </p>
            )}
          </>
        )}

        {showOpener && (
          <PackOpener
            opened={opened}
            onOpen={handleOpen}
            onClear={() => setOpened(null)}
            resetLabel={inventory.packs > 0 ? "Open another" : "Done"}
          />
        )}
      </div>

      {owned.length > 0 && (
        <div className="border-line bg-surface-2 rounded-2xl border p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-ink-3 font-mono text-[10px] tracking-[0.2em] uppercase">
                Your cards
              </h2>
              <p className="text-ink-2 mt-1 text-sm">
                Same ticker, more copies. Take them into Daily Lineup.
              </p>
            </div>
            <Link
              href="/inventory"
              className="text-acid hover:text-acid-dim text-sm font-semibold whitespace-nowrap"
            >
              Full inventory
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
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
        </div>
      )}
    </div>
  );
}

function QuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="border-line bg-surface flex items-center gap-4 rounded-full border px-2 py-1.5">
      <button
        type="button"
        disabled={quantity <= 1}
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className="text-ink flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="font-display w-6 text-center text-lg font-bold tabular">{quantity}</span>
      <button
        type="button"
        disabled={quantity >= 10}
        onClick={() => onChange(Math.min(10, quantity + 1))}
        className="text-ink flex h-8 w-8 items-center justify-center rounded-full text-lg transition-colors disabled:opacity-30"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
