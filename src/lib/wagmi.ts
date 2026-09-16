import { coinbaseWallet, injected } from "wagmi/connectors";
import { createConfig, http } from "wagmi";
import { robinhoodChain, robinhoodChainTestnet } from "./chains";

/**
 * Deliberately avoids WalletConnect here — it requires a paid project id
 * from day one. `injected()` covers MetaMask, the Robinhood Wallet browser
 * extension, and any other EIP-1193 wallet already installed; add
 * WalletConnect back once mobile wallet support is actually needed.
 */
export const wagmiConfig = createConfig({
  chains: [robinhoodChainTestnet, robinhoodChain],
  connectors: [injected(), coinbaseWallet({ appName: "HoodShares" })],
  transports: {
    [robinhoodChainTestnet.id]: http(),
    [robinhoodChain.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
