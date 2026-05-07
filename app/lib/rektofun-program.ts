/**
 * RektoFun Solana Program Client
 *
 * Provides typed helpers for interacting with the on-chain rektofun_program.
 * Uses @anchor-lang/core (Anchor v1) + @solana/web3.js.
 *
 * Bet amounts are denominated in USDC (6 decimals).
 * e.g. $5 USDC = 5_000_000 micro-USDC units.
 *
 * Security notes:
 *  - All transactions are built client-side and signed via the user's wallet.
 *  - Never stores private keys; expects an external wallet adapter supplied by the app.
 *  - Defaults to devnet; switch RPC_ENDPOINT for mainnet.
 */

import { Program, AnchorProvider, BN, Idl } from "@anchor-lang/core";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import idl from "./rektofun_program.json";

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  "4t5KYdKFmPw49yo6Bm1TV2ZDEi6k3Ns4eJLeNhgbVSzJ"
);

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";

const sharedReadonlyConnection = new Connection(RPC_ENDPOINT, "confirmed");

/** USDC mint on Solana devnet */
export const USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

/** USDC has 6 decimal places */
export const USDC_DECIMALS = 6;
export const USDC_MULTIPLIER = 10 ** USDC_DECIMALS; // 1_000_000

// Seed prefixes — must match the Rust constants
const CHALLENGE_SEED = Buffer.from("challenge");
const VAULT_SEED = Buffer.from("vault");
const COUNTER_SEED = Buffer.from("creator_counter");

// ─── PDA Derivation ───────────────────────────────────────────────────────────

export function deriveCreatorCounter(creator: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [COUNTER_SEED, creator.toBuffer()],
    PROGRAM_ID
  );
}

export function deriveChallengePDA(
  creator: PublicKey,
  challengeId: number
): [PublicKey, number] {
  // writeBigUInt64LE is not available in the browser Buffer polyfill,
  // so we manually write the u64 as two u32 little-endian words.
  const idBuf = Buffer.alloc(8);
  const lo = challengeId >>> 0;               // lower 32 bits
  const hi = Math.floor(challengeId / 0x100000000) >>> 0; // upper 32 bits
  idBuf.writeUInt32LE(lo, 0);
  idBuf.writeUInt32LE(hi, 4);
  return PublicKey.findProgramAddressSync(
    [CHALLENGE_SEED, creator.toBuffer(), idBuf],
    PROGRAM_ID
  );
}

export function deriveVaultPDA(challengePDA: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, challengePDA.toBuffer()],
    PROGRAM_ID
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateChallengeArgs {
  asset: string;              // e.g. "BTC"
  betAmountUsdc: number;      // in whole USDC (e.g. 5 = $5 USDC)
  targetPriceUsdCents: number; // e.g. 6_650_000 for $66,500
  directionAbove: boolean;    // true = ABOVE, false = BELOW
  expiresAt: number;          // unix timestamp
  resolvesAt: number;         // unix timestamp
}

export interface OnChainChallenge {
  publicKey: PublicKey;
  creator: PublicKey;
  challenger: PublicKey;
  challengeId: number;
  asset: string;
  betAmount: bigint; // USDC micro-units (6 decimals)
  targetPriceUsdCents: bigint;
  direction: "Above" | "Below";
  expiresAt: number;
  resolvesAt: number;
  status: "Open" | "Active" | "Settled" | "Cancelled";
  vaultBump: number;
  bump: number;
}

// ─── Program Client Factory ───────────────────────────────────────────────────

/**
 * Build an AnchorProvider + Program from a wallet adapter.
 * `wallet` must expose `publicKey` and `signTransaction` / `signAllTransactions`.
 */
export function getRektoProgram(wallet: {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
}): Program {
  const connection = sharedReadonlyConnection;
  const provider = new AnchorProvider(connection, wallet as any, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

export function getReadonlyConnection(): Connection {
  return sharedReadonlyConnection;
}

// ─── Instruction Builders ─────────────────────────────────────────────────────

/**
 * Build a `create_challenge` transaction using USDC as the bet currency.
 *
 * The creator's USDC ATA must already exist and have sufficient balance.
 * The vault is a PDA-owned token account seeded from the challenge PDA.
 * The caller must sign and send the returned transaction.
 */
export async function buildCreateChallengeTx(
  program: Program,
  creator: PublicKey,
  args: CreateChallengeArgs
): Promise<Transaction> {
  const connection = getReadonlyConnection();

  const [counterPDA] = deriveCreatorCounter(creator);

  // Fetch current count (0 if counter doesn't exist yet)
  let currentCount = 0;
  try {
    const counter = await (program.account as any).creatorCounter.fetch(
      counterPDA
    );
    currentCount = Number(counter.count);
  } catch {
    // Counter not initialised yet — first challenge
  }

  const [challengePDA] = deriveChallengePDA(creator, currentCount);
  const [vaultPDA] = deriveVaultPDA(challengePDA);

  // Convert whole USDC to micro-units (6 decimals)
  const betAmountMicroUsdc = new BN(
    Math.floor(args.betAmountUsdc * USDC_MULTIPLIER)
  );

  // Derive the creator's USDC Associated Token Account
  const creatorUsdcAta = await getAssociatedTokenAddress(
    USDC_MINT,
    creator,
    false
  );

  // Check if the creator's USDC ATA exists; if not, prepend an init instruction
  const preTxInstructions: any[] = [];
  const ataInfo = await connection.getAccountInfo(creatorUsdcAta);
  if (!ataInfo) {
    preTxInstructions.push(
      createAssociatedTokenAccountInstruction(
        creator,       // payer
        creatorUsdcAta, // ata
        creator,       // owner
        USDC_MINT      // mint
      )
    );
  }

  const tx = await (program.methods as any)
    .createChallenge({
      asset: args.asset,
      betAmount: betAmountMicroUsdc,
      targetPriceUsdCents: new BN(args.targetPriceUsdCents),
      directionAbove: args.directionAbove,
      expiresAt: new BN(args.expiresAt),
      resolvesAt: new BN(args.resolvesAt),
    })
    .accounts({
      creator,
      creatorCounter: counterPDA,
      challenge: challengePDA,
      vault: vaultPDA,
      creatorUsdcAccount: creatorUsdcAta,
      usdcMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .preInstructions(preTxInstructions)
    .transaction();

  return tx;
}

/**
 * Build an `accept_challenge` (REKT HIM) transaction using USDC.
 */
export async function buildAcceptChallengeTx(
  program: Program,
  challenger: PublicKey,
  challengePDA: PublicKey,
  creatorPubkey: PublicKey
): Promise<Transaction> {
  const connection = getReadonlyConnection();
  const [vaultPDA] = deriveVaultPDA(challengePDA);

  // Derive the challenger's USDC ATA
  const challengerUsdcAta = await getAssociatedTokenAddress(
    USDC_MINT,
    challenger,
    false
  );

  // Check if the challenger's USDC ATA exists; if not, prepend an init instruction
  const preTxInstructions: any[] = [];
  const ataInfo = await connection.getAccountInfo(challengerUsdcAta);
  if (!ataInfo) {
    preTxInstructions.push(
      createAssociatedTokenAccountInstruction(
        challenger,
        challengerUsdcAta,
        challenger,
        USDC_MINT
      )
    );
  }

  const tx = await (program.methods as any)
    .acceptChallenge()
    .accounts({
      challenger,
      creator: creatorPubkey,
      challenge: challengePDA,
      vault: vaultPDA,
      challengerUsdcAccount: challengerUsdcAta,
      usdcMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .preInstructions(preTxInstructions)
    .transaction();

  return tx;
}

/**
 * Build a `cancel_challenge` transaction (refunds USDC to creator).
 */
export async function buildCancelChallengeTx(
  program: Program,
  creator: PublicKey,
  challengePDA: PublicKey
): Promise<Transaction> {
  const [vaultPDA] = deriveVaultPDA(challengePDA);

  // Derive the creator's USDC ATA
  const creatorUsdcAta = await getAssociatedTokenAddress(
    USDC_MINT,
    creator,
    false
  );

  const tx = await (program.methods as any)
    .cancelChallenge()
    .accounts({
      creator,
      challenge: challengePDA,
      vault: vaultPDA,
      creatorUsdcAccount: creatorUsdcAta,
      usdcMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .transaction();

  return tx;
}

// ─── Read Helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch all open challenges from the chain.
 * Returns them sorted newest-first.
 */
export async function fetchAllChallenges(
  program: Program
): Promise<OnChainChallenge[]> {
  const accounts = await (program.account as any).challengeAccount.all();

  return accounts
    .map((a: any) => {
      const d = a.account;
      return {
        publicKey: a.publicKey as PublicKey,
        creator: d.creator as PublicKey,
        challenger: d.challenger as PublicKey,
        challengeId: Number(d.challengeId),
        asset: d.asset as string,
        betAmount: BigInt(d.betAmount.toString()),
        targetPriceUsdCents: BigInt(d.targetPriceUsdCents.toString()),
        direction: d.direction.above !== undefined ? "Above" : "Below",
        expiresAt: Number(d.expiresAt),
        resolvesAt: Number(d.resolvesAt),
        status: Object.keys(d.status)[0] as OnChainChallenge["status"],
        vaultBump: d.vaultBump,
        bump: d.bump,
      } as OnChainChallenge;
    })
    .sort(
      (a: OnChainChallenge, b: OnChainChallenge) =>
        b.challengeId - a.challengeId
    );
}

/**
 * Fetch a single challenge by its PDA.
 */
export async function fetchChallenge(
  program: Program,
  challengePDA: PublicKey
): Promise<OnChainChallenge | null> {
  try {
    const d = await (program.account as any).challengeAccount.fetch(
      challengePDA
    );
    return {
      publicKey: challengePDA,
      creator: d.creator,
      challenger: d.challenger,
      challengeId: Number(d.challengeId),
      asset: d.asset,
      betAmount: BigInt(d.betAmount.toString()),
      targetPriceUsdCents: BigInt(d.targetPriceUsdCents.toString()),
      direction: d.direction.above !== undefined ? "Above" : "Below",
      expiresAt: Number(d.expiresAt),
      resolvesAt: Number(d.resolvesAt),
      status: Object.keys(d.status)[0] as OnChainChallenge["status"],
      vaultBump: d.vaultBump,
      bump: d.bump,
    };
  } catch {
    return null;
  }
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

/** Convert USDC micro-units to whole USDC (e.g. 5_000_000 → 5.0) */
export function microUsdcToUsdc(microUsdc: bigint): number {
  return Number(microUsdc) / USDC_MULTIPLIER;
}

/** Convert whole USDC to micro-units (e.g. 5.0 → 5_000_000) */
export function usdcToMicroUsdc(usdc: number): bigint {
  return BigInt(Math.floor(usdc * USDC_MULTIPLIER));
}

export function formatTimeRemaining(expiresAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = expiresAt - now;
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
