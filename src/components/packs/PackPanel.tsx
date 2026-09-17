"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { formatEther, formatUnits } from "viem";
import {
  useAccount,
  useBalance,
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
  PACK_PRICE_HOOD_LABEL,
  PACK_TOKEN_SYMBOL,
  type OpenedCard,
} from "@/lib/packs";

export function PackPanel() {
  const { address, isConnected, chainId } = useAccount();
  const { creditPaidPack } = useAuth();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const shopAddress = PACK_SHOP_ADDRESS[activeChain.id];
  const onWrongNetwork = isConnected && chainId !== activeChain.id;

  const { data: shopData } = useReadContracts({
    contracts: shopAddress
      ? [
          { address: shopAddress, abi: PACK_SHOP_ABI, functionName: "saleOpen" },
          { address: shopAddress, abi: PACK_SHOP_ABI, functionName: "packPrice" },
          { address: shopAddress, abi: PACK_SHOP_ABI, functionName: "paymentToken" },
          { address: shopAddress, abi: PACK_SHOP_ABI, functionName: "ethPackPrice" },
        ]
      : undefined,
    query: { enabled: Boolean(shopAddress), refetchInterval: 15_000 },
  });

  const saleOpen = shopData?.[0]?.result as boolean | undefined;
  const packPrice = shopData?.[1]?.result as bigint | undefined;
  const paymentToken = shopData?.[2]?.result as `0x${string}` | undefined;
  const ethPackPrice = shopData?.[3]?.result as bigint | undefined;
  const tokenReady = Boolean(paymentToken && paymentToken !== ZERO_ADDRESS);
  const hoodSale = tokenReady && packPrice !== undefined && packPrice > BigInt(0);
  const ethSale = !hoodSale && Boolean(ethPackPrice && ethPackPrice > BigInt(0));
  const [quantity, setQuantity] = useState(1);

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

  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: ethSale && Boolean(address) },
  });

  const { writeContract, data: txHash, isPending: isWriting, error: writeError, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const needsApprove =
    tokenReady && packPrice !== undefined && allowance !== undefined
      ? allowance < packPrice * BigInt(quantity)
      : false;
  const creditedTx = useRef<string | null>(null);

  useEffect(() => {
    if (!isConfirmed || !txHash || needsApprove) return;
    if (creditedTx.current === txHash) return;
    creditedTx.current = txHash;
    void creditPaidPack(txHash);
  }, [isConfirmed, txHash, needsApprove, creditPaidPack]);

  function handleLiveAction() {
    if (!shopAddress) return;
    reset();
    if (ethSale && ethPackPrice !== undefined) {
      writeContract({
        address: shopAddress,
        abi: PACK_SHOP_ABI,
        functionName: "buyPacksWithEth",
        args: [BigInt(quantity)],
        value: ethPackPrice * BigInt(quantity),
      });
      return;
    }
    if (!paymentToken || packPrice === undefined) return;
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
    return <DemoPack />;
  }

  const ethTotal =
    ethSale && ethPackPrice !== undefined ? ethPackPrice * BigInt(quantity) : undefined;
  const priceLabel = ethSale && ethPackPrice !== undefined
    ? `${formatEther(ethPackPrice)} ETH`
    : packPrice !== undefined
      ? `${formatUnits(packPrice, tokenDecimals)} ${tokenSymbol}`
      : "TBD";
  const totalLabel = ethSale && ethTotal !== undefined
    ? `${formatEther(ethTotal)} ETH`
    : packPrice !== undefined
      ? `${formatUnits(packPrice * BigInt(quantity), tokenDecimals)} ${tokenSymbol}`
      : "TBD";
  const canAfford = ethSale
    ? Boolean(ethBalance && ethTotal !== undefined && ethBalance.value >= ethTotal)
    : balance !== undefined && packPrice !== undefined
      ? balance >= packPrice * BigInt(quantity)
      : false;

  const liveLabel = (() => {
    if (isWriting) return "Confirm in wallet…";
    if (isConfirming) return "Buying…";
    if (!isConnected) return "Connect a wallet to buy packs";
    if (!ethSale && !tokenReady) return "Project token not set yet";
    if (saleOpen === false) return "Pack sale closed";
    if (!canAfford) return `Need ${totalLabel}`;
    if (!ethSale && needsApprove) return `Approve ${totalLabel}`;
    return `Buy ${quantity} pack${quantity === 1 ? "" : "s"} for ${totalLabel}`;
  })();

  return (
    <PackLayout
      visual={
        <PackVisual>
          <HoodPack tiltX={7} tiltY={-10} shineX={40} shineY={26} />
        </PackVisual>
      }
    >
      <p className="text-acid font-mono text-[10px] tracking-[0.2em] uppercase">
        Sealed packs
      </p>
      <h1 className="font-display text-ink mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Open a pack
      </h1>
      <p className="text-ink-2 mt-3 max-w-md text-sm leading-relaxed">
        {CARDS_PER_PACK} cards. One Daily Lineup. Extra packs mint here
        {ethSale ? " in ETH" : ` in ${tokenSymbol}`}.
      </p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-ink-3 font-mono text-[10px] tracking-[0.2em] uppercase">
            Price per pack
          </p>
          <p className="font-display text-ink mt-1 text-2xl font-bold tabular">{priceLabel}</p>
        </div>
        <QuantityStepper quantity={quantity} onChange={setQuantity} />
      </div>

      {ethSale && ethBalance && (
        <p className="text-ink-3 mt-3 font-mono text-xs">
          Wallet: {formatEther(ethBalance.value)} ETH
        </p>
      )}
      {!ethSale && balance !== undefined && (
        <p className="text-ink-3 mt-3 font-mono text-xs">
          Wallet: {formatUnits(balance, tokenDecimals)} {tokenSymbol}
        </p>
      )}

      <IncludedPackCta laterHref="/packs" />

      <button
        type="button"
        disabled={
          !isConnected ||
          (!ethSale && !tokenReady) ||
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

      <p className="text-ink-3 mt-6 text-xs leading-relaxed">
        Five draws from all {CARDS.length} names. Same stock five times can
        happen. Foil is just the finish. It does not change your score.
      </p>
    </PackLayout>
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
      {showOpener ? (
        <div className="border-line bg-surface overflow-visible rounded-3xl border p-5 sm:p-8 lg:p-10">
          <PackOpener
            opened={opened}
            onOpen={handleOpen}
            onClear={() => setOpened(null)}
            resetLabel={inventory.packs > 0 ? "Open another" : "Done"}
            idleIntro={
              <>
                <p className="text-acid font-mono text-[10px] tracking-[0.2em] uppercase">
                  {PACK_PRICE_HOOD_LABEL} {PACK_TOKEN_SYMBOL} per pack
                </p>
                <h1 className="font-display text-ink mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Open a pack
                </h1>
                <p className="text-ink-3 mt-2 font-mono text-xs">
                  Sealed packs {inventory.packs} · Cards {totalCards(inventory)}
                </p>
              </>
            }
          />
        </div>
      ) : (
        <PackLayout
          visual={
            <PackVisual>
              <HoodPack tiltX={7} tiltY={-10} shineX={40} shineY={26} />
            </PackVisual>
          }
        >
          <TicketGate title="Connect to open packs" bare>
            <p className="text-acid font-mono text-[10px] tracking-[0.2em] uppercase">
              {PACK_PRICE_HOOD_LABEL} {PACK_TOKEN_SYMBOL} per pack
            </p>
            <h1 className="font-display text-ink mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Open a pack
            </h1>
            <p className="text-ink-2 mt-3 max-w-md text-sm leading-relaxed">
              Tear one open for {CARDS_PER_PACK} stock cards. Enough for one Daily
              Lineup. HoodPass includes one pack on this wallet, even if OpenSea
              let you mint more than one pass. Extra packs mint here for{" "}
              {PACK_PRICE_HOOD_LABEL} {PACK_TOKEN_SYMBOL}.
            </p>
            <p className="text-ink-3 mt-4 font-mono text-xs">
              Sealed packs {inventory.packs} · Cards {totalCards(inventory)}
            </p>

            <button
              type="button"
              disabled={busy || !grantOpen}
              onClick={() => void handleMint()}
              className="bg-acid hover:bg-acid-dim mt-6 w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors disabled:opacity-60"
            >
              {busy
                ? "Getting a pack…"
                : grantOpen
                  ? "Claim included pack"
                  : "Extra packs mint here"}
            </button>
            {grantOpen ? (
              <p className="text-ink-3 mt-3 text-xs leading-relaxed">
                Included with your HoodPass. One pack per wallet.
              </p>
            ) : (
              <p className="text-ink-3 mt-3 text-xs leading-relaxed">
                Extra packs are {PACK_PRICE_HOOD_LABEL} {PACK_TOKEN_SYMBOL} on
                this site once {PACK_TOKEN_SYMBOL} and the pack shop are live.
              </p>
            )}
            <p className="text-ink-3 mt-6 text-xs leading-relaxed">
              Five draws from all {CARDS.length} names. Same stock five times can
              happen. Foil is just the finish. It does not change your score.
            </p>
          </TicketGate>
        </PackLayout>
      )}

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

function PackVisual({ children }: { children: ReactNode }) {
  return (
    <div className="aspect-[1024/1536] w-[min(100%,18rem)] sm:w-[20rem] lg:w-[22rem]">
      {children}
    </div>
  );
}

function PackLayout({
  visual,
  children,
}: {
  visual: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border-line bg-surface overflow-visible rounded-3xl border">
      <div className="grid items-center gap-6 p-5 sm:gap-8 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-12 lg:p-10">
        <div className="flex justify-center lg:justify-end">{visual}</div>
        <div className="flex min-w-0 flex-col justify-center lg:py-2">{children}</div>
      </div>
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
