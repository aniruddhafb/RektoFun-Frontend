import { NextRequest, NextResponse } from "next/server";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/app/lib/admin-auth";
import { ADMIN_WALLET } from "@/app/lib/admin";
import {
  SOLANA_CLUSTER,
  getSolanaRpcEndpoint,
  getTokenMintAddress,
} from "@/app/lib/solana-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REVENUE_WALLET = "AEdGJ1VaYfeLgX7MyCy9ShhaCk7Rd41ztprUCXnY4vaU";

type ParsedTokenData = {
  parsed?: { info?: { tokenAmount?: { uiAmount?: number | null; uiAmountString?: string } } };
};

function tokenBalance(accounts: Awaited<ReturnType<Connection["getParsedTokenAccountsByOwner"]>>) {
  return accounts.value.reduce((sum, { account }) => {
    const amount = (account.data as ParsedTokenData).parsed?.info?.tokenAmount;
    const value = amount?.uiAmount ?? Number(amount?.uiAmountString ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

async function getWalletFunds(connection: Connection, label: string, address: string) {
  const owner = new PublicKey(address);
  const [lamports, usdcAccounts, rektoAccounts] = await Promise.all([
    connection.getBalance(owner, "confirmed"),
    connection.getParsedTokenAccountsByOwner(owner, {
      mint: new PublicKey(getTokenMintAddress("usdc")),
    }),
    connection.getParsedTokenAccountsByOwner(owner, {
      mint: new PublicKey(getTokenMintAddress("rekto")),
    }),
  ]);

  return {
    label,
    address,
    balances: {
      sol: lamports / LAMPORTS_PER_SOL,
      usdc: tokenBalance(usdcAccounts),
      rekto: tokenBalance(rektoAccounts),
    },
  };
}

export async function GET(request: NextRequest) {
  const session = readAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || session.address !== ADMIN_WALLET) {
    return NextResponse.json({ error: "Verified admin session required" }, { status: 401 });
  }

  try {
    const connection = new Connection(getSolanaRpcEndpoint(), "confirmed");
    const wallets = await Promise.all([
      getWalletFunds(connection, "Admin account", ADMIN_WALLET),
      getWalletFunds(connection, "Revenue account", REVENUE_WALLET),
    ]);

    return NextResponse.json(
      { wallets, cluster: SOLANA_CLUSTER, checkedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[api/admin/funds] balance lookup failed:", error);
    return NextResponse.json({ error: "Could not load wallet funds" }, { status: 502 });
  }
}
