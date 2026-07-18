import { NextRequest, NextResponse } from "next/server";
import { AccountLayout } from "@solana/spl-token";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/app/lib/admin-auth";
import { ADMIN_WALLET } from "@/app/lib/admin";
import {
  PROGRAM_ID,
  deriveClaimPDA,
  deriveVaultPDA,
  fetchAllChallenges,
  getReadonlyConnection,
  getRektoProgram,
  microUsdcToUsdc,
} from "@/app/lib/rektofun-program";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AuditInput = {
  id: number;
  status: string;
  mode: string;
  result?: string;
  challengePda?: string;
};

const chunks = <T,>(rows: T[], size = 100) =>
  Array.from({ length: Math.ceil(rows.length / size) }, (_, index) =>
    rows.slice(index * size, (index + 1) * size),
  );

export async function POST(request: NextRequest) {
  const session = readAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || session.address !== ADMIN_WALLET) {
    return NextResponse.json({ error: "Verified admin session required" }, { status: 401 });
  }

  try {
    const body = await request.json() as { challenges?: AuditInput[] };
    const challenges = Array.isArray(body.challenges) ? body.challenges.slice(0, 2_000) : [];
    const connection = getReadonlyConnection();
    const readonlyWallet = {
      publicKey: new PublicKey(ADMIN_WALLET),
      signTransaction: async () => { throw new Error("Read-only"); },
      signAllTransactions: async () => { throw new Error("Read-only"); },
    };
    const chainChallenges = await fetchAllChallenges(getRektoProgram(readonlyWallet));
    const chainByPda = new Map(chainChallenges.map((item) => [item.publicKey.toBase58(), item]));
    const vaults = chainChallenges.map((item) => deriveVaultPDA(item.publicKey)[0]);
    const vaultInfos = (await Promise.all(
      chunks(vaults).map((group) => connection.getMultipleAccountsInfo(group, "confirmed")),
    )).flat();
    const challengeAccountInfos = (await Promise.all(
      chunks(chainChallenges.map((item) => item.publicKey)).map((group) =>
        connection.getMultipleAccountsInfo(group, "confirmed"),
      ),
    )).flat();
    const vaultUsdcByChallenge = new Map<string, number>();
    const challengeSolByPda = new Map<string, number>();
    let escrowMicroUsdc = BigInt(0);
    chainChallenges.forEach((challenge, index) => {
      const info = vaultInfos[index];
      let amount = BigInt(0);
      if (info) {
        try {
          amount = BigInt(AccountLayout.decode(info.data).amount.toString());
        } catch {
          amount = BigInt(0);
        }
      }
      escrowMicroUsdc += amount;
      vaultUsdcByChallenge.set(challenge.publicKey.toBase58(), microUsdcToUsdc(amount));
      challengeSolByPda.set(
        challenge.publicKey.toBase58(),
        (challengeAccountInfos[index]?.lamports || 0) / LAMPORTS_PER_SOL,
      );
    });

    const claimChecks: Array<{ challengeId: number; wallet: string; pda: PublicKey }> = [];
    for (const item of challenges) {
      const chain = item.challengePda ? chainByPda.get(item.challengePda) : undefined;
      if (!chain) continue;
      const wallets = chain.status === "Cancelled"
        ? [...chain.creatorTeam, ...chain.opponentTeam, ...(chain.challenger.equals(PublicKey.default) ? [] : [chain.challenger])]
        : chain.winningSide === "CreatorTeam"
          ? [chain.creator, ...chain.creatorTeam]
          : chain.winningSide === "OpponentTeam" ? [...chain.opponentTeam] : [];
      for (const wallet of wallets) {
        if (chain.status === "Cancelled" && wallet.equals(chain.creator)) continue;
        claimChecks.push({
          challengeId: item.id,
          wallet: wallet.toBase58(),
          pda: deriveClaimPDA(chain.publicKey, wallet)[0],
        });
      }
    }

    const claimAccountInfos = (await Promise.all(
      chunks(claimChecks.map((item) => item.pda)).map((group) =>
        connection.getMultipleAccountsInfo(group, "confirmed"),
      ),
    )).flat();
    const claimed = new Map<string, boolean>();
    claimChecks.forEach((item, index) => {
      claimed.set(`${item.challengeId}:${item.wallet}`, Boolean(claimAccountInfos[index]));
    });

    const rows = challenges.map((item) => {
      const chain = item.challengePda ? chainByPda.get(item.challengePda) : undefined;
      const databaseStatus = item.status.toUpperCase();
      if (!chain) {
        const completed = databaseStatus === "CANCELLED" || databaseStatus === "RESOLVED";
        return {
          id: item.id,
          chainStatus: "Closed",
          payoutKind: item.mode.toUpperCase() === "PVP" ? "automatic" : "individual",
          creatorPaid: databaseStatus === "CANCELLED" ? true : null,
          recipients: [],
          paidCount: completed ? null : 0,
          totalRecipients: null,
          complete: completed,
          lockedUsdc: 0,
          lockedSol: 0,
          contractAddress: item.challengePda || null,
          note: completed ? "On-chain account closed after funds were distributed." : "No live on-chain account found.",
        };
      }
      const lockedUsdc = vaultUsdcByChallenge.get(chain.publicKey.toBase58()) || 0;
      const lockedSol = challengeSolByPda.get(chain.publicKey.toBase58()) || 0;
      const contractAddress = chain.publicKey.toBase58();

      if (chain.status === "Cancelled") {
        const recipients = [...chain.creatorTeam, ...chain.opponentTeam, ...(chain.challenger.equals(PublicKey.default) ? [] : [chain.challenger])]
          .filter((wallet, index, all) => !wallet.equals(chain.creator) && all.findIndex((other) => other.equals(wallet)) === index)
          .map((wallet) => ({ wallet: wallet.toBase58(), claimed: claimed.get(`${item.id}:${wallet.toBase58()}`) || false }));
        return {
          id: item.id,
          chainStatus: chain.status,
          payoutKind: "refund",
          creatorPaid: true,
          recipients,
          paidCount: recipients.filter((recipient) => recipient.claimed).length,
          totalRecipients: recipients.length,
          complete: recipients.every((recipient) => recipient.claimed),
          lockedUsdc,
          lockedSol,
          contractAddress,
          note: recipients.length ? "Creator refunded automatically; other deposits are claimed individually." : "Creator refunded automatically.",
        };
      }

      if (chain.status === "Settled" && chain.challengeType === "Pvp") {
        return {
          id: item.id,
          chainStatus: chain.status,
          payoutKind: "automatic",
          creatorPaid: chain.winningSide === "CreatorTeam",
          recipients: [],
          paidCount: 1,
          totalRecipients: 1,
          complete: true,
          lockedUsdc,
          lockedSol,
          contractAddress,
          note: "PVP winner was paid automatically at settlement.",
        };
      }

      const winnerWallets = chain.winningSide === "CreatorTeam"
        ? [chain.creator, ...chain.creatorTeam]
        : chain.winningSide === "OpponentTeam" ? [...chain.opponentTeam] : [];
      const recipients = winnerWallets
        .filter((wallet, index, all) => all.findIndex((other) => other.equals(wallet)) === index)
        .map((wallet) => ({ wallet: wallet.toBase58(), claimed: claimed.get(`${item.id}:${wallet.toBase58()}`) || false }));
      return {
        id: item.id,
        chainStatus: chain.status,
        payoutKind: "individual",
        creatorPaid: chain.winningSide === "CreatorTeam"
          ? recipients.find((recipient) => recipient.wallet === chain.creator.toBase58())?.claimed || false
          : null,
        recipients,
        paidCount: recipients.filter((recipient) => recipient.claimed).length,
        totalRecipients: recipients.length,
        complete: recipients.length > 0 && recipients.every((recipient) => recipient.claimed),
        lockedUsdc,
        lockedSol,
        contractAddress,
        note: chain.status === "Settled" ? "Winning team members claim individually." : "Funds have not been distributed yet.",
      };
    });

    const programLamports = await connection.getBalance(PROGRAM_ID, "confirmed");

    return NextResponse.json({
      rows,
      balances: {
        escrowUsdc: microUsdcToUsdc(escrowMicroUsdc),
        programSol: programLamports / LAMPORTS_PER_SOL,
      },
      checkedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[api/admin/challenges/audit] failed:", error);
    return NextResponse.json({ error: "Could not audit on-chain challenges" }, { status: 502 });
  }
}
