import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAddress } from "viem";
import type { PlayerRecord } from "@/lib/player";
import { formatTicketSerial, parseTicketSerial } from "@/lib/ticket";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "players.json");

export interface SessionQuoteBook {
  sessionId: string;
  /** USD per token at the 09:30 ET open, keyed by card id. */
  open: Record<string, number>;
  /** USD per token at the 16:00 ET close. */
  close: Record<string, number>;
  capturedAt: number;
}

export interface StoreFile {
  nonces: Record<string, { nonce: string; exp: number }>;
  players: Record<string, PlayerRecord>;
  quotes: Record<string, SessionQuoteBook>;
  /** Highest 1-based HoodPass serial already given out. */
  ticketIssued: number;
}

const emptyStore = (): StoreFile => ({
  nonces: {},
  players: {},
  quotes: {},
  ticketIssued: 0,
});

let queue: Promise<unknown> = Promise.resolve();

async function readFileStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    return {
      nonces: parsed.nonces ?? {},
      players: parsed.players ?? {},
      quotes: parsed.quotes ?? {},
      ticketIssued: parsed.ticketIssued ?? 0,
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(store: StoreFile): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_PATH}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(store), "utf8");
  await rename(tmp, STORE_PATH);
}

async function readStore(): Promise<StoreFile> {
  if (process.env.DATABASE_URL) {
    const { readPostgresStore } = await import("./postgres");
    return readPostgresStore();
  }
  return readFileStore();
}

async function writeStore(store: StoreFile): Promise<void> {
  if (process.env.DATABASE_URL) {
    const { writePostgresStore } = await import("./postgres");
    await writePostgresStore(store);
    return;
  }
  await writeFileStore(store);
}

export function withStore<T>(fn: (store: StoreFile) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await writeStore(store);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function emptyPlayer(address: `0x${string}`): PlayerRecord {
  return {
    address: getAddress(address),
    ticketHeld: false,
    ticketSerial: null,
    freePackAvailable: false,
    inventory: { packs: 0, cards: {} },
    play: null,
    results: [],
  };
}

export function ensurePlayer(store: StoreFile, address: `0x${string}`): PlayerRecord {
  const key = address.toLowerCase();
  const existing = store.players[key];
  if (existing) {
    existing.address = getAddress(existing.address);
    existing.ticketHeld = Boolean(existing.ticketHeld);
    existing.ticketSerial = existing.ticketSerial ?? null;
    existing.freePackAvailable = Boolean(existing.freePackAvailable);
    return existing;
  }
  const created = emptyPlayer(address);
  store.players[key] = created;
  return created;
}

export function highestTicketIssued(store: StoreFile): number {
  let max = store.ticketIssued ?? 0;
  for (const player of Object.values(store.players)) {
    max = Math.max(max, parseTicketSerial(player.ticketSerial));
  }
  return max;
}

export function nextTicketSerial(store: StoreFile): string {
  return formatTicketSerial(highestTicketIssued(store) + 1);
}

/** First HoodPass on a wallet gets the next mint number, one pack grant, and keeps both. */
export function issueTicket(store: StoreFile, record: PlayerRecord): void {
  if (record.ticketHeld && record.ticketSerial) return;
  const firstMint = !record.ticketHeld;
  store.ticketIssued = highestTicketIssued(store) + 1;
  record.ticketHeld = true;
  record.ticketSerial = formatTicketSerial(store.ticketIssued);
  if (firstMint) record.freePackAvailable = true;
}

export function claimIncludedPack(record: PlayerRecord): boolean {
  if (!record.ticketHeld || !record.freePackAvailable) return false;
  record.freePackAvailable = false;
  record.inventory = {
    ...record.inventory,
    packs: record.inventory.packs + 1,
  };
  return true;
}
