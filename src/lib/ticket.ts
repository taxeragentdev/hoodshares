export const DEMO_TICKET_PRICE_ETH = "0.001";
export const TICKET_NAME = "HoodPass";
export const TICKET_SEASON = "Season 01";

/** 1-based mint order printed on the pass: first mint is HOOD-0001. */
export function formatTicketSerial(index: number): string {
  return `HOOD-${String(Math.max(1, index)).padStart(4, "0")}`;
}

export function parseTicketSerial(serial: string | null | undefined): number {
  if (!serial) return 0;
  const match = serial.match(/(\d+)\s*$/);
  if (!match) return 0;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : 0;
}
