import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  SupportedBalanceToken,
} from "@/app/lib/token-balances";
import {
  SOLANA_CLUSTER,
  getSolanaRpcEndpoint,
  getTokenMintAddress,
} from "@/app/lib/solana-config";

export const runtime = "nodejs";

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

function getConnection() {
  const endpoint = getSolanaRpcEndpoint();
  const cachedConnection = connections.get(endpoint);

  if (cachedConnection) {
    return cachedConnection;
  }

  const connection = new Connection(endpoint, "confirmed");
  connections.set(endpoint, connection);
  return connection;
}

function getTokenConfig(token: SupportedBalanceToken): {
  cluster: typeof SOLANA_CLUSTER;
  mint: PublicKey;
} {
  return {
    cluster: SOLANA_CLUSTER,
    mint: new PublicKey(getTokenMintAddress(token)),
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
  const connection = getConnection();
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
