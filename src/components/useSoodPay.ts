"use client";

import { formatUnits } from "viem";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { activeChain } from "@/lib/chains";
import { ERC20_ABI } from "@/lib/contracts";
import {
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
  TOKEN_SYMBOL,
  TOKEN_TREASURY,
} from "@/lib/token";

export function useSoodPay() {
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync, isPending: isWriting } = useWriteContract();
  const publicClient = usePublicClient({ chainId: activeChain.id });
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  async function pay(amount: bigint): Promise<`0x${string}`> {
    if (!address) throw new Error("Connect a wallet first");
    if (chainId !== activeChain.id) {
      await switchChainAsync({ chainId: activeChain.id });
    }
    if (balance !== undefined && balance < amount) {
      throw new Error(
        `Need ${formatUnits(amount, TOKEN_DECIMALS)} ${TOKEN_SYMBOL}. Buy some first.`,
      );
    }
    const hash = await writeContractAsync({
      address: TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [TOKEN_TREASURY, amount],
    });
    if (!publicClient) throw new Error("No chain client");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      throw new Error(`${TOKEN_SYMBOL} transfer failed`);
    }
    void refetchBalance();
    return hash;
  }

  return {
    pay,
    balance,
    isConnected,
    address,
    busy: isWriting || isSwitching,
  };
}
