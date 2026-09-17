/** OpenSea indexes Robinhood Chain (4663). Primary mint lives on a drop URL once the collection is published. */
export const OPENSEA_CHAIN_SLUG = "robinhood";

const DEFAULT_COLLECTION_URL =
  "https://opensea.io/collection/hoodpass-491043604";
const DEFAULT_MINT_URL = `${DEFAULT_COLLECTION_URL}/overview`;

export const OPENSEA_MINT_URL =
  process.env.NEXT_PUBLIC_OPENSEA_MINT_URL?.trim() || DEFAULT_MINT_URL;

export const OPENSEA_COLLECTION_URL =
  process.env.NEXT_PUBLIC_OPENSEA_COLLECTION_URL?.trim() ||
  DEFAULT_COLLECTION_URL;

export function openseaItemUrl(
  contract: `0x${string}`,
  tokenId: string | number,
): string {
  return `https://opensea.io/item/${OPENSEA_CHAIN_SLUG}/${contract}/${tokenId}`;
}
