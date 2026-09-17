import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAddress } from "viem";
import type { PlayerRecord } from "@/lib/player";
import { formatTicketSerial, parseTicketSerial } from "@/lib/ticket";
import { creditPacks } from "@/lib/inventory";

function dataDir(): string {
  if (process.env.HOODSHARES_DATA_DIR) return process.env.HOODSHARES_DATA_DIR;
  // Vercel’s app filesystem is read-only. Local `data/` works in `next dev`.
  if (process.env.VERCEL) return path.join("/tmp", "hoodshares");
  return path.join(process.cwd(), "data");
}

function storePath(): string {
  return path.join(dataDir(), "players.json");
}

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
  /** Pack shop buy txs already credited to off-chain inventory. */
  creditedPackTxs: Record<string, true>;
}

const emptyStore = (): StoreFile => ({
  nonces: {},
  players: {},
  quotes: {},
  ticketIssued: 0,
  creditedPackTxs: {},
});

let queue: Promise<unknown> = Promise.resolve();

async function readFileStore(): Promise<StoreFile> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    return {
      nonces: parsed.nonces ?? {},
      players: parsed.players ?? {},
    quotes: parsed.quotes ?? {},
    ticketIssued: parsed.ticketIssued ?? 0,
    creditedPackTxs: parsed.creditedPackTxs ?? {},
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(store: StoreFile): Promise<void> {
  const dir = dataDir();
  const dest = storePath();
  await mkdir(dir, { recursive: true });
  const tmp = `${dest}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(store), "utf8");
  await rename(tmp, dest);
}

async function readStore(): Promise<StoreFile> {
  if (hasPostgres()) {
    const { readPostgresStore } = await import("./postgres");
    return readPostgresStore();
  }
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is required on Vercel");
  }
  return readFileStore();
}

async function writeStore(store: StoreFile): Promise<void> {
  if (hasPostgres()) {
    const { writePostgresStore } = await import("./postgres");
    await writePostgresStore(store);
    return;
  }
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is required on Vercel");
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
    includedPackClaimed: false,
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
    existing.includedPackClaimed = Boolean(existing.includedPackClaimed);
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

/** First HoodPass on a wallet gets one included pack. Extra tokens do not. */
export function issueTicket(store: StoreFile, record: PlayerRecord): void {
  if (record.ticketHeld && record.ticketSerial) {
    if (record.includedPackClaimed) record.freePackAvailable = false;
    return;
  }
  const firstWallet = !record.ticketHeld && !record.includedPackClaimed;
  if (!record.ticketSerial) {
    store.ticketIssued = highestTicketIssued(store) + 1;
    record.ticketSerial = formatTicketSerial(store.ticketIssued);
  }
  record.ticketHeld = true;
  if (firstWallet) record.freePackAvailable = true;
  if (record.includedPackClaimed) record.freePackAvailable = false;
}

export function claimIncludedPack(record: PlayerRecord): boolean {
  if (!record.ticketHeld || !record.freePackAvailable || record.includedPackClaimed) {
    return false;
  }
  record.freePackAvailable = false;
  record.includedPackClaimed = true;
  record.inventory = {
    ...record.inventory,
    packs: record.inventory.packs + 1,
  };
  return true;
}

export function creditPaidPacks(
  store: StoreFile,
  record: PlayerRecord,
  txHash: string,
  quantity: number,
): boolean {
  const key = txHash.toLowerCase();
  if (store.creditedPackTxs[key]) return false;
  if (quantity < 1) return false;
  store.creditedPackTxs[key] = true;
  record.inventory = creditPacks(record.inventory, quantity);
  return true;
}
