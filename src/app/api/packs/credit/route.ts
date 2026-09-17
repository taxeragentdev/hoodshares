import { NextResponse } from "next/server";
import {
  createPublicClient,
  http,
  isHash,
  parseEventLogs,
  type Hash,
} from "viem";
import { activeChain } from "@/lib/chains";
import { PACK_SHOP_ABI, PACK_SHOP_ADDRESS } from "@/lib/contracts";
import { sessionAddress } from "@/lib/server/auth";
import { expireActivePlay, snapshot } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { creditPaidPacks, ensurePlayer, withStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }

  const shop = PACK_SHOP_ADDRESS[activeChain.id];
  if (!shop) {
    return NextResponse.json({ error: "pack shop not live" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as { txHash?: string };
  if (!body.txHash || !isHash(body.txHash)) {
    return NextResponse.json({ error: "bad tx" }, { status: 400 });
  }
  const txHash = body.txHash as Hash;

  const client = createPublicClient({
    chain: activeChain,
    transport: http(
      process.env.ROBINHOOD_RPC_URL ?? activeChain.rpcUrls.default.http[0],
    ),
  });
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") {
    return NextResponse.json({ error: "tx failed" }, { status: 400 });
  }
  if (receipt.to?.toLowerCase() !== shop.toLowerCase()) {
    return NextResponse.json({ error: "not a pack buy" }, { status: 400 });
  }

  const bought = parseEventLogs({
    abi: PACK_SHOP_ABI,
    logs: receipt.logs,
    eventName: "PacksBought",
  });
  const mine = bought.find(
    (log) => log.args.buyer?.toLowerCase() === address.toLowerCase(),
  );
  const quantity = mine?.args.packs;
  if (!quantity || quantity < BigInt(1)) {
    return NextResponse.json({ error: "no packs in tx" }, { status: 400 });
  }

  const book = await sessionQuotes();
  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    expireActivePlay(record, book);
    if (!record.ticketHeld) return null;
    creditPaidPacks(store, record, txHash, Number(quantity));
    return snapshot(record);
  });
  if (!player) {
    return NextResponse.json({ error: "need pass" }, { status: 403 });
  }
  return NextResponse.json(player);
}
