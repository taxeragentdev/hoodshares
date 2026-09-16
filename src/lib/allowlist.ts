import proofs from "@/data/allowlist-proofs.generated.json";

/**
 * Looks up a connected wallet's allowlist proof, generated ahead of time by
 * `npm run allowlist:build`. Bundled with the app rather than fetched, so
 * there is no request to fail or cache — an address either has a proof at
 * build time or it doesn't.
 */
export function allowlistProofFor(address: string): `0x${string}`[] | null {
  const entry = (proofs as Record<string, string[]>)[address.toLowerCase()];
  return entry ? (entry as `0x${string}`[]) : null;
}
