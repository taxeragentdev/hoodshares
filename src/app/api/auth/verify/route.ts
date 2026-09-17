import { NextResponse } from "next/server";
import { EMPTY_INVENTORY, type Inventory } from "@/lib/inventory";
import { parseAddress, setSessionCookie, verifySignIn } from "@/lib/server/auth";
import { snapshot, syncPlayState } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { ensurePlayer, withStore } from "@/lib/server/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      address?: string;
      nonce?: string;
      signature?: string;
      inventory?: Inventory;
    };
    const address = parseAddress(body.address);
    if (!address) {
      return NextResponse.json({ error: "bad address" }, { status: 400 });
    }
    if (!body.nonce || !body.signature) {
      return NextResponse.json({ error: "missing signature" }, { status: 400 });
    }

    const ok = await verifySignIn(address, body.nonce, body.signature as `0x${string}`);
    if (!ok) {
      return NextResponse.json({ error: "bad signature" }, { status: 401 });
    }

    const book = await sessionQuotes();
    const player = await withStore((store) => {
      const record = ensurePlayer(store, address);
      const empty =
        record.inventory.packs === 0 && Object.keys(record.inventory.cards).length === 0;
      if (
        empty &&
        body.inventory &&
        (body.inventory.packs > 0 || Object.keys(body.inventory.cards).length > 0)
      ) {
        record.inventory = body.inventory;
      } else if (!record.inventory.cards) {
        record.inventory = EMPTY_INVENTORY;
      }
      syncPlayState(record, book);
      return snapshot(record);
    });

    await setSessionCookie(address);
    return NextResponse.json(player);
  } catch (err) {
    console.error("auth/verify", err);
    return NextResponse.json({ error: "Could not save this wallet" }, { status: 500 });
  }
}
