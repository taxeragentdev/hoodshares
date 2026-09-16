import { connection, NextResponse } from "next/server";
import { snapshotSession } from "@/lib/server/prices";

function authorized(request: Request): boolean {
  const secret = process.env.HOODSHARES_CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function phaseFromClock(): "open" | "close" {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  return hour < 12 ? "open" : "close";
}

async function run(request: Request, phase: "open" | "close") {
  await connection();
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const book = await snapshotSession(phase);
  const filled =
    Object.keys(phase === "close" ? book.close : book.open).length;
  if (filled === 0) {
    return NextResponse.json({ ok: false, reason: "no quotes" });
  }
  return NextResponse.json({ ok: true, phase, book });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("phase");
  const phase =
    query === "close" || query === "open" ? query : phaseFromClock();
  return run(request, phase);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { phase?: string };
  const phase = body.phase === "close" ? "close" : "open";
  return run(request, phase);
}
