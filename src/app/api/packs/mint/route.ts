import { NextResponse } from "next/server";
import { sessionAddress } from "@/lib/server/auth";
import { snapshot, syncPlayState } from "@/lib/server/play";
import { sessionQuotes } from "@/lib/server/prices";
import { PACK_PRICE_HOOD_LABEL } from "@/lib/packs";
import { TOKEN_SYMBOL } from "@/lib/token";
import { claimIncludedPack, ensurePlayer, withStore } from "@/lib/server/store";

export async function POST(request: Request) {
  const address = await sessionAddress();
  if (!address) {
    return NextResponse.json({ error: "signed out" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { grant?: boolean };
  if (body.grant !== true) {
    return NextResponse.json(
      { error: `Extra packs mint on HoodShares for ${PACK_PRICE_HOOD_LABEL} ${TOKEN_SYMBOL}. This wallet already used its included pack, or needs a HoodPass.` },
      { status: 403 },
    );
  }
  const book = await sessionQuotes();
  const player = await withStore((store) => {
    const record = ensurePlayer(store, address);
    syncPlayState(record, book);
    if (!record.ticketHeld) return null;
    if (!claimIncludedPack(record)) return "no-grant" as const;
    return snapshot(record);
  });
  if (player === null) {
    return NextResponse.json({ error: "need pass" }, { status: 403 });
  }
  if (player === "no-grant") {
    return NextResponse.json({ error: "no included pack" }, { status: 409 });
  }
  return NextResponse.json(player);
}
