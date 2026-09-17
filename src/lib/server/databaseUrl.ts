/** Vercel’s Neon integration sets POSTGRES_URL. We also accept DATABASE_URL. */
export function postgresConnectionString(): string | null {
  const raw = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  ).trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    // postgres.js does not speak Neon’s channel_binding flag.
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return raw;
  }
}

export function hasPostgres(): boolean {
  return Boolean(postgresConnectionString());
}
