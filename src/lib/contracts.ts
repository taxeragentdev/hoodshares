import { robinhoodChain, robinhoodChainTestnet } from "./chains";
import { TOKEN_ADDRESS } from "./token";

/**
 * Minimal ABI — only the reads and writes the mint page actually uses, hand
 * trimmed from `contracts/src/HoodSharesCollection.sol`. Keep this in sync
 * with the contract by hand; there is no build step wiring the two together
 * yet, so a signature changed on one side and not the other fails at the
 * wagmi call site, not silently.
 */
export const HOOD_SHARES_COLLECTION_ABI = [
  {
    type: "function",
    name: "mintPublic",
    stateMutability: "payable",
    inputs: [{ name: "quantity", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "mintAllowlist",
    stateMutability: "payable",
    inputs: [
      { name: "quantity", type: "uint256" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "salePhase",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "mintPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalMinted",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_SUPPLY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_PER_WALLET",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintedBy",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "packShop",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export const PACK_SHOP_ABI = [
  {
    type: "function",
    name: "buyPacks",
    stateMutability: "nonpayable",
    inputs: [{ name: "quantity", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "buyPacksWithEth",
    stateMutability: "payable",
    inputs: [{ name: "quantity", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "packPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ethPackPrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "saleOpen",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "paymentToken",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "PacksBought",
    inputs: [
      { name: "buyer", type: "address", indexed: true },
      { name: "packs", type: "uint256", indexed: false },
      { name: "paid", type: "uint256", indexed: false },
    ],
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

/**
 * Minimal ABI for `EntryTicket` — the paid ETH mint required to open packs
 * and play. Same hand-trimmed-from-the-contract approach as the collection
 * ABI above.
 */
export const ENTRY_TICKET_ABI = [
  {
    type: "function",
    name: "mintPublic",
    stateMutability: "payable",
    inputs: [{ name: "quantity", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "mintAllowlist",
    stateMutability: "payable",
    inputs: [
      { name: "quantity", type: "uint256" },
      { name: "proof", type: "bytes32[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "salePhase",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "price",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalMinted",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "maxSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_PER_WALLET",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "mintedBy",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "holdsTicket",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/**
 * Mirrors `HoodSharesCollection.SalePhase`. Solidity enums encode as the
 * declaration index, so this order has to match the contract exactly.
 */
export const SALE_PHASE = ["closed", "allowlist", "public"] as const;
export type SalePhase = (typeof SALE_PHASE)[number];

/**
 * Deployment addresses, keyed by chain id. Both start unset: the mainnet
 * contract cannot deploy until a real VRF adapter replaces the mock (see
 * `contracts/script/Deploy.s.sol`), and the testnet address is filled in the
 * first time someone actually runs that deploy.
 *
 * Reading this file is how the mint page decides whether to render the real
 * flow or a "not deployed on this network yet" state — never crash on a
 * missing address.
 */
export const COLLECTION_ADDRESS: Partial<Record<number, `0x${string}`>> = {
  [robinhoodChain.id]:
    (process.env.NEXT_PUBLIC_COLLECTION_ADDRESS_MAINNET as `0x${string}` | undefined) ??
    undefined,
  [robinhoodChainTestnet.id]:
    (process.env.NEXT_PUBLIC_COLLECTION_ADDRESS_TESTNET as `0x${string}` | undefined) ??
    undefined,
};

/** Same "unset until deployed" pattern as `COLLECTION_ADDRESS`, for the
 * entry ticket contract. */
export const ENTRY_TICKET_ADDRESS: Partial<Record<number, `0x${string}`>> = {
  [robinhoodChain.id]:
    (process.env.NEXT_PUBLIC_ENTRY_TICKET_ADDRESS_MAINNET as `0x${string}` | undefined) ?? undefined,
  [robinhoodChainTestnet.id]:
    (process.env.NEXT_PUBLIC_ENTRY_TICKET_ADDRESS_TESTNET as `0x${string}` | undefined) ?? undefined,
};

/** OpenSea HoodPass drop contract. One included pack per wallet even if balance is 20. */
export const HOODPASS_CONTRACT: Partial<Record<number, `0x${string}`>> = {
  [robinhoodChain.id]:
    (process.env.NEXT_PUBLIC_HOODPASS_CONTRACT as `0x${string}` | undefined) ??
    "0xE2C05B91f0936D09d84D36eDbe8B513235A1D2d6",
  [robinhoodChainTestnet.id]:
    (process.env.NEXT_PUBLIC_HOODPASS_CONTRACT_TESTNET as `0x${string}` | undefined) ??
    ENTRY_TICKET_ADDRESS[robinhoodChainTestnet.id],
};

/**
 * The project's own ERC-20, launched externally via Pons (a Robinhood Chain
 * launchpad) rather than deployed by this repo. Extra packs and Daily Lineup
 * entry transfer this token to TOKEN_TREASURY. PackShop is an optional later
 * mint path once those contracts are deployed.
 */
export const PACK_TOKEN_ADDRESS: Partial<Record<number, `0x${string}`>> = {
  [robinhoodChain.id]:
    (process.env.NEXT_PUBLIC_PACK_TOKEN_ADDRESS_MAINNET as `0x${string}` | undefined) ??
    TOKEN_ADDRESS,
  [robinhoodChainTestnet.id]:
    (process.env.NEXT_PUBLIC_PACK_TOKEN_ADDRESS_TESTNET as `0x${string}` | undefined) ?? undefined,
};

export const PACK_SHOP_ADDRESS: Partial<Record<number, `0x${string}`>> = {
  [robinhoodChain.id]:
    (process.env.NEXT_PUBLIC_PACK_SHOP_ADDRESS_MAINNET as `0x${string}` | undefined) ?? undefined,
  [robinhoodChainTestnet.id]:
    (process.env.NEXT_PUBLIC_PACK_SHOP_ADDRESS_TESTNET as `0x${string}` | undefined) ?? undefined,
};

export const SEALED_PACK_ADDRESS: Partial<Record<number, `0x${string}`>> = {
  [robinhoodChain.id]:
    (process.env.NEXT_PUBLIC_SEALED_PACK_ADDRESS_MAINNET as `0x${string}` | undefined) ?? undefined,
  [robinhoodChainTestnet.id]:
    (process.env.NEXT_PUBLIC_SEALED_PACK_ADDRESS_TESTNET as `0x${string}` | undefined) ?? undefined,
};
