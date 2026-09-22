import {
  createPublicClient,
  http,
  parseEventLogs,
  type Hash,
} from "viem";
import { activeChain } from "@/lib/chains";
import { ERC20_ABI } from "@/lib/contracts";
import { TOKEN_ADDRESS, TOKEN_TREASURY } from "@/lib/token";

function rpc() {
  return createPublicClient({
    chain: activeChain,
    transport: http(
      process.env.ROBINHOOD_RPC_URL ?? activeChain.rpcUrls.default.http[0],
    ),
  });
}

/** Confirmed SOOD transferred from `from` to the protocol treasury. */
export async function readSoodTransfer(
  txHash: Hash,
  from: `0x${string}`,
): Promise<{ amount: bigint } | { error: string }> {
  const client = rpc();
  const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!receipt) return { error: "tx not found" };
  if (receipt.status !== "success") return { error: "tx failed" };
  if (receipt.from.toLowerCase() !== from.toLowerCase()) {
    return { error: "wallet did not send this tx" };
  }

  const transfers = parseEventLogs({
    abi: ERC20_ABI,
    logs: receipt.logs,
    eventName: "Transfer",
  });
  const mine = transfers.filter(
    (log) =>
      log.address.toLowerCase() === TOKEN_ADDRESS.toLowerCase() &&
      log.args.from?.toLowerCase() === from.toLowerCase() &&
      log.args.to?.toLowerCase() === TOKEN_TREASURY.toLowerCase(),
  );
  const amount = mine.reduce((sum, log) => sum + (log.args.value ?? BigInt(0)), BigInt(0));
  if (amount <= BigInt(0)) return { error: "no SOOD sent to treasury" };
  return { amount };
}
