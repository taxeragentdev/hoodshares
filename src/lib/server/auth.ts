import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAddress, isAddress, verifyMessage } from "viem";

const COOKIE = "hs_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

function secret(): string {
  return process.env.HOODSHARES_SECRET || "hoodshares-dev-secret-change-before-mainnet";
}

function hmac(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function parseAddress(raw: unknown): `0x${string}` | null {
  if (typeof raw !== "string" || !isAddress(raw)) return null;
  return getAddress(raw);
}

export function signInMessage(address: string, nonce: string): string {
  return [
    "HoodShares",
    "",
    "Sign this to save your cards, lineup, and score to this wallet.",
    "",
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

export async function issueNonce(address: `0x${string}`): Promise<string> {
  const exp = Date.now() + 10 * 60 * 1000;
  const rand = randomBytes(16).toString("hex");
  const payload = `${address.toLowerCase()}.${exp}.${rand}`;
  return `${payload}.${hmac(payload)}`;
}

export function encodeSession(address: `0x${string}`): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${address.toLowerCase()}.${exp}`;
  return `${payload}.${hmac(payload)}`;
}

export function decodeSession(token: string | undefined): `0x${string}` | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [address, expRaw, sig] = parts;
  if (!address || !expRaw || !sig) return null;
  const payload = `${address}.${expRaw}`;
  const expected = hmac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expRaw) < Date.now()) return null;
  return parseAddress(address);
}

export async function setSessionCookie(address: `0x${string}`): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, encodeSession(address), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function sessionAddress(): Promise<`0x${string}` | null> {
  const jar = await cookies();
  return decodeSession(jar.get(COOKIE)?.value);
}

function parseIssuedNonce(
  address: `0x${string}`,
  nonce: string,
): boolean {
  const parts = nonce.split(".");
  if (parts.length !== 4) return false;
  const [rawAddress, expRaw, rand, sig] = parts;
  if (!rawAddress || !expRaw || !rand || !sig) return false;
  if (rawAddress !== address.toLowerCase()) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const payload = `${rawAddress}.${expRaw}.${rand}`;
  const expected = hmac(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  return true;
}

export async function verifySignIn(
  address: `0x${string}`,
  nonce: string,
  signature: `0x${string}`,
): Promise<boolean> {
  if (!parseIssuedNonce(address, nonce)) return false;

  return verifyMessage({
    address,
    message: signInMessage(address, nonce),
    signature,
  });
}
