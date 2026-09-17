import { createPublicClient, http, isAddress } from "viem";
import { activeChain } from "@/lib/chains";
import {
  ENTRY_TICKET_ABI,
  ENTRY_TICKET_ADDRESS,
  HOODPASS_CONTRACT,
} from "@/lib/contracts";

const ERC721_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** True if this wallet holds at least one HoodPass. Count is ignored: one pack grant. */
export async function walletHoldsHoodPass(
  address: `0x${string}`,
): Promise<boolean> {
  const client = createPublicClient({
    chain: activeChain,
    transport: http(
      process.env.ROBINHOOD_RPC_URL ?? activeChain.rpcUrls.default.http[0],
    ),
  });

  const ticket = ENTRY_TICKET_ADDRESS[activeChain.id];
  if (ticket) {
    try {
      const holds = await client.readContract({
        address: ticket,
        abi: ENTRY_TICKET_ABI,
        functionName: "holdsTicket",
        args: [address],
      });
      if (holds) return true;
    } catch {
      /* OpenSea drop may not be this contract */
    }
  }

  const collection = HOODPASS_CONTRACT[activeChain.id];
  if (!collection || !isAddress(collection)) return false;

  try {
    const balance = await client.readContract({
      address: collection,
      abi: ERC721_BALANCE_ABI,
      functionName: "balanceOf",
      args: [address],
    });
    return balance > BigInt(0);
  } catch {
    return false;
  }
}

export function hoodPassContractConfigured(): boolean {
  return Boolean(
    ENTRY_TICKET_ADDRESS[activeChain.id] || HOODPASS_CONTRACT[activeChain.id],
  );
}
