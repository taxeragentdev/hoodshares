"use client";

import { OPENSEA_COLLECTION_URL, OPENSEA_MINT_URL } from "@/lib/opensea";

export function OpenSeaMintLink({
  className = "",
  children = "Mint on OpenSea",
}: {
  className?: string;
  children?: string;
}) {
  if (!OPENSEA_MINT_URL) return null;
  return (
    <a
      href={OPENSEA_MINT_URL}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}

export function OpenSeaCollectionLink({
  className = "",
  children = "View on OpenSea",
}: {
  className?: string;
  children?: string;
}) {
  const href = OPENSEA_COLLECTION_URL || OPENSEA_MINT_URL;
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}
