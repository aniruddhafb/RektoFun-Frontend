/**
 * One-time CLI script to activate a TxLINE World Cup Free Tier subscription.
 *
 * Usage:
 *   npx tsx scripts/activate-txline.ts
 *
 * Optional env vars:
 *   SOLANA_KEYPAIR_PATH  – path to your keypair JSON (default: ~/.config/solana/id.json)
 *   TXLINE_NETWORK       – "mainnet" | "devnet" (default: "mainnet")
 *
 * Writes TXLINE_JWT and TXLINE_API_TOKEN to .env.local on success.
 */

import fs from "fs";
import os from "os";
import path from "path";
import { config as loadDotenv } from "dotenv";

// Load .env (and .env.local if present) from the project root
loadDotenv({ path: path.join(process.cwd(), ".env") });
loadDotenv({ path: path.join(process.cwd(), ".env.local"), override: false });
import { Keypair, Connection, Transaction, TransactionInstruction, PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { ed25519 } from "@noble/curves/ed25519";

// ── Network config ────────────────────────────────────────────────────────────

const NETWORK = (process.env.TXLINE_NETWORK ?? "mainnet") as "mainnet" | "devnet";

const CONFIG = {
  mainnet: {
    programId: new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA"),
    tokenMint: new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL"),
    rpc: "https://api.mainnet-beta.solana.com",
    api: "https://txline.txodds.com",
  },
  devnet: {
    programId: new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J"),
    tokenMint: new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG"),
    rpc: "https://api.devnet.solana.com",
    api: "https://txline-dev.txodds.com",
  },
} as const;

const { programId, tokenMint, rpc, api } = CONFIG[NETWORK];

// Service level 1 = 60-second delay (World Cup free tier)
const SERVICE_LEVEL_ID = 1;
// Minimum duration — must be a multiple of 4
const WEEKS = 4;

// ── Instruction encoding ──────────────────────────────────────────────────────

function buildSubscribeData(serviceLevelId: number, weeks: number): Buffer {
  // discriminator + u16 (LE) + u8
  const disc = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);
  const args = Buffer.alloc(3);
  args.writeUInt16LE(serviceLevelId, 0);
  args.writeUInt8(weeks, 2);
  return Buffer.concat([disc, args]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadKeypair(): Keypair {
  const keyPath =
    process.env.SOLANA_KEYPAIR_PATH ??
    path.join(os.homedir(), ".config", "solana", "id.json");
  const raw = fs.readFileSync(keyPath, "utf-8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

async function getGuestJwt(): Promise<string> {
  const res = await fetch(`${api}/auth/guest/start`, { method: "POST" });
  if (!res.ok) throw new Error(`/auth/guest/start failed: ${res.status}`);
  const { token } = await res.json();
  return token as string;
}

function appendEnvLocal(entries: Record<string, string>) {
  const envPath = path.join(process.cwd(), ".env.local");
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
  const lines = Object.entries(entries).map(([k, v]) => `${k}=${v}`);
  const updated = existing.trimEnd() + "\n" + lines.join("\n") + "\n";
  fs.writeFileSync(envPath, updated);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Network: ${NETWORK} | API: ${api}`);

  const keypair = loadKeypair();
  console.log(`Wallet: ${keypair.publicKey.toBase58()}`);

  const connection = new Connection(rpc, "confirmed");

  // Derive PDAs and token accounts
  const [pricingMatrix] = PublicKey.findProgramAddressSync(
    [Buffer.from("pricing_matrix")],
    programId
  );
  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_treasury_v2")],
    programId
  );
  const tokenTreasuryVault = await getAssociatedTokenAddress(tokenMint, tokenTreasuryPda, true, TOKEN_2022_PROGRAM_ID);
  const userTokenAccount = await getAssociatedTokenAddress(tokenMint, keypair.publicKey, false, TOKEN_2022_PROGRAM_ID);

  // 1. Get guest JWT
  console.log("Fetching guest JWT...");
  const jwt = await getGuestJwt();
  console.log("JWT obtained.");

  // 2. Build + send subscribe transaction
  // Create the user's TxL token ATA if it doesn't exist yet (idempotent — safe to include always)
  const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    keypair.publicKey,  // payer
    userTokenAccount,   // ATA to create
    keypair.publicKey,  // owner
    tokenMint,
    TOKEN_2022_PROGRAM_ID
  );

  const ix = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: pricingMatrix, isSigner: false, isWritable: false },
      { pubkey: tokenMint, isSigner: false, isWritable: false },
      { pubkey: userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: tokenTreasuryVault, isSigner: false, isWritable: true },
      { pubkey: tokenTreasuryPda, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: buildSubscribeData(SERVICE_LEVEL_ID, WEEKS),
  });

  const tx = new Transaction().add(createAtaIx, ix);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = keypair.publicKey;
  tx.sign(keypair);

  console.log("Sending subscribe transaction...");
  const txSig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(txSig, "confirmed");
  console.log(`Transaction confirmed: ${txSig}`);

  // 3. Sign the activation message
  // Message format: "${txSig}::${jwt}" (double colon = empty leagues)
  const message = `${txSig}::${jwt}`;
  const msgBytes = new TextEncoder().encode(message);
  // secretKey is 64 bytes: first 32 are the seed (private scalar)
  const sigBytes = ed25519.sign(msgBytes, keypair.secretKey.slice(0, 32));
  const walletSignature = Buffer.from(sigBytes).toString("base64");

  // 4. Activate subscription
  console.log("Activating subscription...");
  const activateRes = await fetch(`${api}/api/token/activate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ txSig, walletSignature, leagues: [] }),
  });
  if (!activateRes.ok) {
    const body = await activateRes.text();
    throw new Error(`Activation failed (${activateRes.status}): ${body}`);
  }
  const apiToken = await activateRes.text();
  console.log(`API token: ${apiToken}`);

  // 5. Persist to .env.local
  appendEnvLocal({
    TXLINE_JWT: jwt,
    TXLINE_API_TOKEN: apiToken,
  });
  console.log("Saved TXLINE_JWT and TXLINE_API_TOKEN to .env.local");
  console.log("Done! Restart your dev server to pick up the new env vars.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
