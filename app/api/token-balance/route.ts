import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  REKTO_MINT_ADDRESS,
  SupportedBalanceToken,
} from "@/app/lib/token-balances";

export const runtime = "nodejs";

type SolanaCluster = "devnet" | "mainnet";

const USDC_MINTS: Record<SolanaCluster, string> = {
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
  mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

const DEFAULT_RPC_ENDPOINTS: Record<SolanaCluster, string> = {
  devnet: "https://api.devnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
};

const connections = new Map<string, Connection>();

type ParsedTokenAccountData = {
  parsed?: {
    info?: {
      tokenAmount?: {
        uiAmount?: number | null;
        uiAmountString?: string;
      };
    };
  };
};

function getUsdcCluster(): SolanaCluster {
  const configuredCluster = (
    process.env.SOLANA_USDC_CLUSTER ||
    process.env.NEXT_PUBLIC_SOLANA_USDC_CLUSTER ||
    process.env.SOLANA_CLUSTER ||
    process.env.NEXT_PUBLIC_SOLANA_CLUSTER ||
    "devnet"
  ).toLowerCase();

  return configuredCluster.includes("mainnet") ? "mainnet" : "devnet";
}

function getRpcEndpoint(cluster: SolanaCluster) {
  if (cluster === "mainnet") {
    return (
      process.env.SOLANA_MAINNET_RPC ||
      process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC ||
      DEFAULT_RPC_ENDPOINTS.mainnet
    );
  }

  return (
    process.env.SOLANA_DEVNET_RPC ||
    process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC ||
    process.env.NEXT_PUBLIC_SOLANA_RPC ||
    DEFAULT_RPC_ENDPOINTS.devnet
  );
}

function getConnection(cluster: SolanaCluster) {
  const endpoint = getRpcEndpoint(cluster);
  const cachedConnection = connections.get(endpoint);

  if (cachedConnection) {
    return cachedConnection;
  }

  const connection = new Connection(endpoint, "confirmed");
  connections.set(endpoint, connection);
  return connection;
}

function getTokenConfig(token: SupportedBalanceToken): {
  cluster: SolanaCluster;
  mint: PublicKey;
} {
  if (token === "rekto") {
    return {
      cluster: "mainnet",
      mint: new PublicKey(REKTO_MINT_ADDRESS),
    };
  }

  const cluster = getUsdcCluster();
  return {
    cluster,
    mint: new PublicKey(USDC_MINTS[cluster]),
  };
}

function readUiAmount(data: ParsedTokenAccountData) {
  const tokenAmount = data.parsed?.info?.tokenAmount;
  return tokenAmount?.uiAmount ?? Number(tokenAmount?.uiAmountString ?? 0);
}

async function fetchSplTokenBalance(
  owner: PublicKey,
  token: SupportedBalanceToken
) {
  const { cluster, mint } = getTokenConfig(token);
  const connection = getConnection(cluster);
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
    mint,
  });

  const balance = tokenAccounts.value.reduce((total, { account }) => {
    const amount = readUiAmount(account.data as ParsedTokenAccountData);
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  return { balance, cluster };
}

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("wallet");
  const token = request.nextUrl.searchParams.get("token");

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Missing wallet address" },
      { status: 400 }
    );
  }

  if (token !== "rekto" && token !== "usdc") {
    return NextResponse.json(
      { error: "Unsupported token" },
      { status: 400 }
    );
  }

  let owner: PublicKey;
  try {
    owner = new PublicKey(walletAddress);
  } catch {
    return NextResponse.json(
      { error: "Invalid wallet address" },
      { status: 400 }
    );
  }

  try {
    const result = await fetchSplTokenBalance(owner, token);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Failed to fetch ${token.toUpperCase()} balance:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${token.toUpperCase()} balance` },
      { status: 502 }
    );
  }
}
