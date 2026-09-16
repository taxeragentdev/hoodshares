import { NextResponse } from "next/server";
import { issueNonce, parseAddress, signInMessage } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
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
  } catch (err) {
    console.error("auth/nonce", err);
    return NextResponse.json({ error: "Could not start sign in" }, { status: 500 });
  }
}
