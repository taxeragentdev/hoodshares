import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { activeChain } from "@/lib/chains";
import { ENTRY_TICKET_ABI, ENTRY_TICKET_ADDRESS } from "@/lib/contracts";
import { sessionAddress } from "@/lib/server/auth";
import { expireActivePlay, snapshot } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { ensurePlayer, issueTicket, withStore } from "@/lib/server/store";

export async function POST() {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }

  const ticketAddress = ENTRY_TICKET_ADDRESS[activeChain.id];
  if (!ticketAddress) {
    return NextResponse.json({ error: "drop not live" }, { status: 404 });
  }

  const client = createPublicClient({
    chain: activeChain,
    transport: http(activeChain.rpcUrls.default.http[0]),
  });
  const holds = await client.readContract({
    address: ticketAddress,
    abi: ENTRY_TICKET_ABI,
    functionName: "holdsTicket",
    args: [address],
  });
  if (!holds) {
    return NextResponse.json({ error: "no pass on this wallet" }, { status: 403 });
  }

  const book = await sessionQuotes();
  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    expireActivePlay(record, book);
    issueTicket(store, record);
    return snapshot(record);
  });
  return NextResponse.json(player);
}
