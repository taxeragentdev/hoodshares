import postgres from "postgres";
import type { StoreFile } from "./store";

const emptyStore = (): StoreFile => ({
  nonces: {},
  players: {},
  quotes: {},
  ticketIssued: 0,
});

let client: ReturnType<typeof postgres> | null = null;
let ready = false;

function db() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!client) {
    client = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 20 });
  }
  return client;
}

async function ensureSchema(): Promise<void> {
  if (ready) return;
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS hoodshares_store (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  ready = true;
}

export async function readPostgresStore(): Promise<StoreFile> {
  await ensureSchema();
  const sql = db();
  const rows = await sql`
    SELECT payload FROM hoodshares_store WHERE id = 'main' LIMIT 1
  `;
  const payload = rows[0]?.payload as StoreFile | undefined;
  if (!payload) return emptyStore();
  return {
    nonces: payload.nonces ?? {},
    players: payload.players ?? {},
    quotes: payload.quotes ?? {},
    ticketIssued: payload.ticketIssued ?? 0,
  };
}

export async function writePostgresStore(store: StoreFile): Promise<void> {
  await ensureSchema();
  const sql = db();
  await sql`
    INSERT INTO hoodshares_store (id, payload, updated_at)
    VALUES ('main', ${sql.json(JSON.parse(JSON.stringify(store)))}, now())
    ON CONFLICT (id) DO UPDATE SET payload = excluded.payload, updated_at = now()
  `;
}
