import { SupportedToken } from "@/app/lib/solana-config";

export type SupportedBalanceToken = SupportedToken;

type TokenBalanceResponse = {
  balance?: number;
  cluster?: "devnet" | "mainnet";
};

export async function fetchTokenBalance(
  walletAddress: string,
  token: SupportedBalanceToken
): Promise<number> {
  const params = new URLSearchParams({ wallet: walletAddress, token });
  const response = await fetch(`/api/token-balance?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${token.toUpperCase()} balance`);
  }

  const data = (await response.json()) as TokenBalanceResponse;
  return typeof data.balance === "number" && Number.isFinite(data.balance)
    ? data.balance
    : 0;
}

export function fetchRektoBalance(walletAddress: string): Promise<number> {
  return fetchTokenBalance(walletAddress, "rekto");
}

export function fetchUsdcBalance(walletAddress: string): Promise<number> {
  return fetchTokenBalance(walletAddress, "usdc");
}
