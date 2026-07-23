import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import {
  buildAdminSignedChallengeActionTx,
  type SponsoredChallengeAction,
} from "@/app/lib/admin-signer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = new Set<SponsoredChallengeAction>(["accept", "cancel", "refund", "winnings"]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      action?: SponsoredChallengeAction;
      participant?: string;
      creator?: string;
      challengePDA?: string;
      joinCreatorSide?: boolean;
      amountMicroUsdc?: string;
      challengeId?: number;
    };

    if (!body.action || !ACTIONS.has(body.action)) {
      return NextResponse.json({ error: "Invalid challenge action" }, { status: 400 });
    }
    if (!body.participant || !body.creator || !body.challengePDA) {
      return NextResponse.json({ error: "Missing challenge transaction accounts" }, { status: 400 });
    }
    const amountMicroUsdc = body.action === "accept" ? BigInt(body.amountMicroUsdc ?? "0") : undefined;
    if (body.action === "accept" && (!amountMicroUsdc || amountMicroUsdc <= BigInt(0))) {
      return NextResponse.json({ error: "Invalid acceptance amount" }, { status: 400 });
    }
    if (body.action === "accept") {
      if (!body.challengeId) {
        return NextResponse.json({ error: "Missing challenge ID" }, { status: 400 });
      }
      const apiBase = process.env.NEXT_PUBLIC_BE_API_URL || "http://localhost:8000/api";
      const permission = await fetch(
        `${apiBase.replace(/\/$/, "")}/challenges/${body.challengeId}/can-accept?wallet_address=${encodeURIComponent(body.participant)}`,
        { headers: { accept: "application/json" }, cache: "no-store" },
      );
      if (!permission.ok) {
        const detail = await permission.json().catch(() => null);
        return NextResponse.json(
          { error: detail?.detail || "You are not allowed to accept this challenge" },
          { status: permission.status },
        );
      }
    }

    const result = await buildAdminSignedChallengeActionTx({
      action: body.action,
      participant: new PublicKey(body.participant),
      creator: new PublicKey(body.creator),
      challengePDA: new PublicKey(body.challengePDA),
      joinCreatorSide: body.joinCreatorSide,
      amountMicroUsdc,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/challenges/action] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to prepare challenge action" },
      { status: 500 },
    );
  }
}
