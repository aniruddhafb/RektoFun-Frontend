export type SolanaCluster = "devnet" | "mainnet";
export type SupportedToken = "usdc" | "rekto";

export const SOLANA_CLUSTER: SolanaCluster =
  process.env.NEXT_PUBLIC_SOLANA_CLUSTER?.toLowerCase().includes("mainnet")
    ? "mainnet"
    : "devnet";

export const SOLANA_RPC_ENDPOINTS: Record<SolanaCluster, string> = {
  devnet: "https://api.devnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
};

export const TOKEN_MINT_ADDRESSES: Record<
  SupportedToken,
  Record<SolanaCluster, string>
> = {
  usdc: {
    devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  rekto: {
    // Replace the devnet value here when the dedicated devnet mint is deployed.
    devnet: "HHSfQJEhWkXQZbxuNzmtCwZGNYwAX2VNezdXuVYJbrgE",
    mainnet: "13QUwwFK5bMTrxZ9xhYpD8oEVizRSFk79nTQqtvFEASY",
  },
};

export function getTokenMintAddress(token: SupportedToken) {
  return TOKEN_MINT_ADDRESSES[token][SOLANA_CLUSTER];
}

export function getSolanaRpcEndpoint() {
  return SOLANA_RPC_ENDPOINTS[SOLANA_CLUSTER];
}

export function getSolscanClusterQuery() {
  return SOLANA_CLUSTER === "devnet" ? "?cluster=devnet" : "";
}
