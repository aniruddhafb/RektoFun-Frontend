import { NextRequest, NextResponse } from "next/server";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/app/lib/admin-auth";
import { ADMIN_WALLET } from "@/app/lib/admin";
import { getSolanaRpcEndpoint, getTokenMintAddress } from "@/app/lib/solana-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ParsedTokenData = { parsed?: { info?: { tokenAmount?: { uiAmount?: number | null; uiAmountString?: string } } } };
type WalletBalances = { sol: number; usdc: number; rekto: number };
const BALANCE_CACHE_TTL_MS = 60_000;
const balanceCache = new Map<string, { balances: WalletBalances; expiresAt: number }>();

const tokenBalance = (accounts: Awaited<ReturnType<Connection["getParsedTokenAccountsByOwner"]>>) =>
  accounts.value.reduce((sum, { account }) => {
    const amount = (account.data as ParsedTokenData).parsed?.info?.tokenAmount;
    const value = amount?.uiAmount ?? Number(amount?.uiAmountString ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

export async function POST(request: NextRequest) {
  const session = readAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || session.address !== ADMIN_WALLET) {
    return NextResponse.json({ error: "Verified admin session required" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({})) as { wallets?: unknown };
  const requestedWallets: string[] = Array.isArray(body.wallets)
    ? body.wallets.filter((value: unknown): value is string => typeof value === "string")
    : [];
  const wallets = [...new Set<string>(requestedWallets)].slice(0, 500);
  const connection = new Connection(getSolanaRpcEndpoint(), "confirmed");
  const usdcMint = new PublicKey(getTokenMintAddress("usdc"));
  const rektoMint = new PublicKey(getTokenMintAddress("rekto"));
  const now = Date.now();
  const balances: Record<string, WalletBalances> = {};
  const uncached = wallets.filter((wallet) => {
    const cached = balanceCache.get(wallet);
    if (cached && cached.expiresAt > now) {
      balances[wallet] = cached.balances;
      return false;
    }
    balanceCache.delete(wallet);
    return true;
  });
  const validWallets: Array<{ wallet: string; owner: PublicKey }> = [];
  for (const wallet of uncached) {
    try {
      validWallets.push({ wallet, owner: new PublicKey(wallet) });
    } catch {
      balances[wallet] = { sol: 0, usdc: 0, rekto: 0 };
    }
  }

  const accountInfos = validWallets.length
    ? await connection.getMultipleAccountsInfo(validWallets.map(({ owner }) => owner), "confirmed")
    : [];
  const fetchedEntries = await Promise.all(validWallets.map(async ({ wallet, owner }, index) => {
    try {
      const [usdc, rekto] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(owner, { mint: usdcMint }),
        connection.getParsedTokenAccountsByOwner(owner, { mint: rektoMint }),
      ]);
      return [wallet, {
        sol: (accountInfos[index]?.lamports || 0) / LAMPORTS_PER_SOL,
        usdc: tokenBalance(usdc),
        rekto: tokenBalance(rekto),
      }] as const;
    } catch {
      return [wallet, {
        sol: (accountInfos[index]?.lamports || 0) / LAMPORTS_PER_SOL,
        usdc: 0,
        rekto: 0,
      }] as const;
    }
  }));
  for (const [wallet, walletBalances] of fetchedEntries) {
    balances[wallet] = walletBalances;
    balanceCache.set(wallet, { balances: walletBalances, expiresAt: now + BALANCE_CACHE_TTL_MS });
  }

  return NextResponse.json({ balances, checkedAt: new Date().toISOString() }, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
