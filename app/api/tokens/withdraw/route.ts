import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { buildAdminSignedTokenTransferTx } from "@/app/lib/admin-signer";
import { getTokenMintAddress, type SupportedToken } from "@/app/lib/solana-config";
import { checkWithdrawalIpRateLimit } from "@/app/lib/withdraw-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WithdrawPayload = {
  sender?: unknown;
  recipient?: unknown;
  asset?: unknown;
  amount?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkWithdrawalIpRateLimit(request);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many withdrawal requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const body = (await request.json()) as WithdrawPayload;
    if (typeof body.sender !== "string" || typeof body.recipient !== "string") {
      return NextResponse.json({ error: "Missing sender or recipient wallet." }, { status: 400 });
    }
    if (body.asset !== "usdc" && body.asset !== "rekto") {
      return NextResponse.json({ error: "Unsupported token asset." }, { status: 400 });
    }
    if (typeof body.amount !== "string" || !/^[1-9]\d*$/.test(body.amount)) {
      return NextResponse.json({ error: "Invalid token amount." }, { status: 400 });
    }

    const result = await buildAdminSignedTokenTransferTx({
      sender: new PublicKey(body.sender),
      recipient: new PublicKey(body.recipient),
      mint: new PublicKey(getTokenMintAddress(body.asset as SupportedToken)),
      amount: BigInt(body.amount),
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[api/tokens/withdraw] error:", error);
    const message = error instanceof Error ? error.message : "Failed to prepare withdrawal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
