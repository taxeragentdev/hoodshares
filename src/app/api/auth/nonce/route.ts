import { NextResponse } from "next/server";
import { issueNonce, parseAddress, signInMessage } from "@/lib/server/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { address?: string };
  const address = parseAddress(body.address);
  if (!address) {
    return NextResponse.json({ error: "bad address" }, { status: 400 });
  }
  const nonce = await issueNonce(address);
  return NextResponse.json({
    nonce,
    message: signInMessage(address, nonce),
  });
}
