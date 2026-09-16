/** OpenSea indexes Robinhood Chain (4663). Primary mint lives on a drop URL once the collection is published. */
export const OPENSEA_CHAIN_SLUG = "robinhood";

export const OPENSEA_MINT_URL =
  process.env.NEXT_PUBLIC_OPENSEA_MINT_URL?.trim() ?? "";

export const OPENSEA_COLLECTION_URL =
  process.env.NEXT_PUBLIC_OPENSEA_COLLECTION_URL?.trim() ?? "";

export function openseaItemUrl(
  contract: `0x${string}`,
  tokenId: string | number,
): string {
  return `https://opensea.io/item/${OPENSEA_CHAIN_SLUG}/${contract}/${tokenId}`;
}
