import { connection, NextResponse } from "next/server";
import { highestTicketIssued, nextTicketSerial, withStore } from "@/lib/server/store";

export async function GET() {
  await connection();
  const ticket = await withStore((store) => ({
    issued: highestTicketIssued(store),
    nextSerial: nextTicketSerial(store),
  }));
  return NextResponse.json(ticket);
}
