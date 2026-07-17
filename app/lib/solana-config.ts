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
  // NEXT_PUBLIC_SOLANA_RPC_URL lets ops point at a dedicated RPC provider
  // (Helius/QuickNode/Triton/etc). The public cluster endpoints below are a
  // fallback only — Solana Labs' public mainnet-beta RPC actively rejects
  // production/browser dApp traffic with 403 "Access forbidden" once it
  // recognizes the origin, so relying on it in production will break writes
  // (sendRawTransaction/confirmTransaction) intermittently.
  const override = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (override) {
    return override.replace(/\/$/, "");
  }
  return SOLANA_RPC_ENDPOINTS[SOLANA_CLUSTER];
}

export function getSolscanClusterQuery() {
  return SOLANA_CLUSTER === "devnet" ? "?cluster=devnet" : "";
}
