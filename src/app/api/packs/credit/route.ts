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
import { PACK_PRICE_WEI } from "@/lib/packs";
import { sessionAddress } from "@/lib/server/auth";
import { snapshot, syncPlayState } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { readSoodTransfer } from "@/lib/server/soodPay";
import { creditPaidPacks, ensurePlayer, withStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { txHash?: string };
  if (!body.txHash || !isHash(body.txHash)) {
    return NextResponse.json({ error: "bad tx" }, { status: 400 });
  }
  const txHash = body.txHash as Hash;
  const shop = PACK_SHOP_ADDRESS[activeChain.id];

  let quantity = 0;
  if (shop) {
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
    if (!mine?.args.packs || mine.args.packs < BigInt(1)) {
      return NextResponse.json({ error: "no packs in tx" }, { status: 400 });
    }
    quantity = Number(mine.args.packs);
  } else {
    const paid = await readSoodTransfer(txHash, address);
    if ("error" in paid) {
      return NextResponse.json({ error: paid.error }, { status: 400 });
    }
    if (paid.amount % PACK_PRICE_WEI !== BigInt(0)) {
      return NextResponse.json({ error: "wrong pack amount" }, { status: 400 });
    }
    quantity = Number(paid.amount / PACK_PRICE_WEI);
    if (quantity < 1) {
      return NextResponse.json({ error: "no packs in tx" }, { status: 400 });
    }
  }

  const book = await sessionQuotes();
  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    syncPlayState(record, book);
    if (!record.ticketHeld) return null;
    creditPaidPacks(store, record, txHash, quantity);
    return snapshot(record);
  });
  if (!player) {
    return NextResponse.json({ error: "need pass" }, { status: 403 });
  }
  return NextResponse.json(player);
}
