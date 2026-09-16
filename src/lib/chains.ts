import { defineChain } from "viem";

/**
 * Robinhood Chain — an Ethereum L2 built on Arbitrum Orbit. Gas is paid in
 * ETH; there is no native chain token. See `contracts/README.md` for the
 * deploy-time RPC/verifier configuration.
 */
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});

export const robinhoodChainTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
  testnet: true,
});

/**
 * The chain the app targets. Set to mainnet per project decision — contest
 * funds are real money, so double check contracts are actually deployed to
 * `robinhoodChain` (4663) before opening mint on the live site.
 */
export const activeChain = robinhoodChain;
