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
import { getSolanaRpcEndpoint, getTokenMintAddress } from "./solana-config";

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey(
  "4i89kL32hf4AzZwgqboFEVgJxAgVXxpDkyrGeJRnZtHT"
);

export const RPC_ENDPOINT =
  getSolanaRpcEndpoint();

const sharedReadonlyConnection = new Connection(RPC_ENDPOINT, "confirmed");

/** USDC mint on Solana devnet */
export const USDC_MINT = new PublicKey(
  getTokenMintAddress("usdc")
);

/** USDC has 6 decimal places */
export const USDC_DECIMALS = 6;
export const USDC_MULTIPLIER = 10 ** USDC_DECIMALS; // 1_000_000

// Seed prefixes — must match the Rust constants
const CHALLENGE_SEED = Buffer.from("challenge");
const VAULT_SEED = Buffer.from("vault");
const COUNTER_SEED = Buffer.from("creator_counter");
const CONFIG_SEED = Buffer.from("config");
const CLAIM_SEED = Buffer.from("claim");

// ─── PDA Derivation ───────────────────────────────────────────────────────────

export function deriveConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
}

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

export function deriveClaimPDA(challengePDA: PublicKey, participant: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [CLAIM_SEED, challengePDA.toBuffer(), participant.toBuffer()],
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
  challengeType: "pvp" | "team"; // "pvp" = 1-vs-1, "team" = multi-participant
  maxTeamSize: number;        // TEAM only: max per side (0 = up to 50); ignored for PVP
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
  challengeType: "Pvp" | "Team";
  creatorTeam: PublicKey[];
  creatorTeamAmounts: bigint[];
  opponentTeam: PublicKey[];
  opponentTeamAmounts: bigint[];
  winningSide: "None" | "CreatorTeam" | "OpponentTeam";
  winningSideTotalAmount: bigint;
  settledNetPot: bigint;
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

// ─── Rent Estimation ──────────────────────────────────────────────────────────
//
// Mirrors `ChallengeAccount::space_for` / `effective_team_size` in
// rektofun-program/src/state.rs + create_challenge.rs — keep in sync if
// either changes. Used to decide, before building the transaction, whether
// the creator has enough SOL to self-pay `create_challenge`'s rent or the
// admin needs to sponsor it (see `fee_payer` in create_challenge.rs).

const CHALLENGE_FIXED_SPACE =
  8 +          // Anchor account discriminator
  32 +         // creator
  32 +         // rent_payer
  32 +         // challenger
  8 +          // challenger_bet_amount
  1 +          // max_team_size
  1 +          // winning_side
  8 +          // winning_side_total_amount
  8 +          // settled_net_pot
  2 +          // winners_remaining
  1 +          // challenge_type
  8 +          // challenge_id
  (4 + 10) +   // asset: 4-byte Borsh length prefix + 10-byte cap
  8 +          // bet_amount
  8 +          // target_price_usd_cents
  1 +          // direction
  8 +          // expires_at
  8 +          // resolves_at
  1 +          // status
  1 +          // vault_bump
  1;           // bump

function teamRosterSpace(rosterCapacity: number): number {
  const pubkeyVecs = 2 * (4 + rosterCapacity * 32); // creator_team + opponent_team
  const amountVecs = 2 * (4 + rosterCapacity * 8);  // creator_team_amounts + opponent_team_amounts
  return pubkeyVecs + amountVecs;
}

function challengeAccountSpace(rosterCapacity: number): number {
  return CHALLENGE_FIXED_SPACE + teamRosterSpace(rosterCapacity);
}

const CREATOR_COUNTER_SPACE = 8 + 32 + 8 + 1; // discriminator + creator + count + bump
const TOKEN_ACCOUNT_SPACE = 165;              // SPL Token account size

/**
 * Estimates the lamports needed to self-pay a `create_challenge` call: the
 * challenge PDA's rent + the vault ATA's rent + (creator_counter's rent, only
 * if this is the creator's first challenge) + (the creator's own USDC ATA
 * rent, only if it doesn't exist yet) + a small transaction-fee buffer.
 */
export async function estimateCreateChallengeRentLamports(
  program: Program,
  connection: Connection,
  creator: PublicKey,
  args: Pick<CreateChallengeArgs, "challengeType" | "maxTeamSize">
): Promise<number> {
  const [configPDA] = deriveConfigPDA();
  const config = await (program.account as any).config.fetch(configPDA);
  const platformMaxTeamSize = Number(config.maxTeamSize);

  const rosterCapacity =
    args.challengeType !== "team"
      ? 0
      : args.maxTeamSize === 0 || args.maxTeamSize > platformMaxTeamSize
        ? platformMaxTeamSize
        : args.maxTeamSize;

  const [counterPDA] = deriveCreatorCounter(creator);
  const creatorUsdcAta = await getAssociatedTokenAddress(USDC_MINT, creator, false);

  const [counterInfo, usdcAtaInfo] = await Promise.all([
    connection.getAccountInfo(counterPDA),
    connection.getAccountInfo(creatorUsdcAta),
  ]);

  const [challengeRent, vaultRent, counterRent, usdcAtaRent] = await Promise.all([
    connection.getMinimumBalanceForRentExemption(challengeAccountSpace(rosterCapacity)),
    connection.getMinimumBalanceForRentExemption(TOKEN_ACCOUNT_SPACE),
    counterInfo ? 0 : connection.getMinimumBalanceForRentExemption(CREATOR_COUNTER_SPACE),
    usdcAtaInfo ? 0 : connection.getMinimumBalanceForRentExemption(TOKEN_ACCOUNT_SPACE),
  ]);

  const TX_FEE_BUFFER_LAMPORTS = 10_000; // one signature (~5000 lamports) plus safety margin
  return challengeRent + vaultRent + counterRent + usdcAtaRent + TX_FEE_BUFFER_LAMPORTS;
}

// ─── Instruction Builders ─────────────────────────────────────────────────────

/**
 * Build a `create_challenge` transaction.
 *
 * - `creator`  : the user's wallet — owns the USDC ATA that will be debited.
 * - `feePayer` : the admin wallet — must equal the on-chain Config.admin;
 *                pays all SOL rent / transaction fees.
 *
 * The returned transaction has `feePayer` set to `feePayer` and is NOT yet
 * signed.  The caller must:
 *   1. Have the admin sign it (partialSign).
 *   2. Send it to the user's wallet for a second partialSign.
 *   3. Broadcast the fully-signed transaction.
 */
export async function buildCreateChallengeTx(
  program: Program,
  creator: PublicKey,
  args: CreateChallengeArgs,
  feePayer: PublicKey   // must match the on-chain Config.admin — the program pays all SOL rent from this account
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
  const [configPDA] = deriveConfigPDA();

  // The Anchor program pays for `creator_counter`/`challenge`/`vault` rent
  // directly out of `feePayer`'s balance (`payer = fee_payer` in
  // create_challenge.rs) — the creator's own SOL balance is never touched.
  const preTxInstructions: any[] = [];

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

  // Check if the creator's USDC ATA exists; if not, prepend an init instruction.
  // The ATA init payer is the feePayer (admin) so the user doesn't need SOL.
  const ataInfo = await connection.getAccountInfo(creatorUsdcAta);
  if (!ataInfo) {
    preTxInstructions.push(
      createAssociatedTokenAccountInstruction(
        feePayer,       // payer (admin pays rent for ATA creation)
        creatorUsdcAta, // ata
        creator,        // owner
        USDC_MINT       // mint
      )
    );
  }

  // Map the string challenge type to the Anchor enum variant object
  const challengeTypeParam =
    args.challengeType === "team" ? { team: {} } : { pvp: {} };

  const tx = await (program.methods as any)
    .createChallenge({
      asset: args.asset,
      betAmount: betAmountMicroUsdc,
      targetPriceUsdCents: new BN(args.targetPriceUsdCents),
      directionAbove: args.directionAbove,
      expiresAt: new BN(args.expiresAt),
      resolvesAt: new BN(args.resolvesAt),
      challengeType: challengeTypeParam,
      maxTeamSize: args.maxTeamSize,
    })
    .accounts({
      creator,
      config: configPDA,
      feePayer,
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

  // Override the fee payer so the admin wallet covers SOL costs
  tx.feePayer = feePayer;

  return tx;
}

/**
 * Build an `accept_challenge` (REKT HIM) transaction using USDC.
 *
 * `amountMicroUsdc` is the depositing participant's own chosen bet amount
 * (USDC micro-units) — it does not need to match the creator's bet_amount.
 */
export async function buildAcceptChallengeTx(
  program: Program,
  challenger: PublicKey,
  challengePDA: PublicKey,
  creatorPubkey: PublicKey,
  joinCreatorSide: boolean = false,
  amountMicroUsdc: BN | bigint | number,
  feePayer: PublicKey = challenger
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
        feePayer,
        challengerUsdcAta,
        challenger,
        USDC_MINT
      )
    );
  }

  const [configPDA] = deriveConfigPDA();

  const tx = await (program.methods as any)
    .acceptChallenge({ joinCreatorSide, amount: new BN(amountMicroUsdc.toString()) })
    .accounts({
      challenger,
      creator: creatorPubkey,
      challenge: challengePDA,
      vault: vaultPDA,
      challengerUsdcAccount: challengerUsdcAta,
      usdcMint: USDC_MINT,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      config: configPDA,
    })
    .preInstructions(preTxInstructions)
    .transaction();

  return tx;
}

/**
 * Build a `cancel_challenge` transaction (refunds USDC to creator).
 * The vault + challenge PDA's reclaimed SOL rent is returned to
 * `challenge.rentPayer` — whichever wallet actually paid it at creation
 * (the creator self-paying, or admin sponsoring). Anchor auto-resolves the
 * `rentPayer` account via the on-chain `has_one` relation (it fetches the
 * `challenge` account we already pass by pubkey and reads its `rentPayer`
 * field), so it isn't passed explicitly here.
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

function enumVariant(value: Record<string, unknown>): string {
  const key = Object.keys(value)[0] ?? "";
  return key ? `${key[0].toUpperCase()}${key.slice(1)}` : "";
}

async function getPayoutAccountSetup(participant: PublicKey, feePayer: PublicKey = participant) {
  const connection = getReadonlyConnection();
  const participantUsdcAccount = await getAssociatedTokenAddress(USDC_MINT, participant, false);
  const preInstructions = [];
  if (!(await connection.getAccountInfo(participantUsdcAccount))) {
    preInstructions.push(createAssociatedTokenAccountInstruction(
      feePayer,
      participantUsdcAccount,
      participant,
      USDC_MINT
    ));
  }
  return { participantUsdcAccount, preInstructions };
}

export async function buildClaimWinningsTx(
  program: Program,
  participant: PublicKey,
  creator: PublicKey,
  challengePDA: PublicKey,
  feePayer: PublicKey = participant
): Promise<Transaction> {
  const [vault] = deriveVaultPDA(challengePDA);
  const [claimRecord] = deriveClaimPDA(challengePDA, participant);
  const { participantUsdcAccount, preInstructions } = await getPayoutAccountSetup(participant, feePayer);
  return (program.methods as any).claimWinnings().accounts({
    participant, creator, challenge: challengePDA, vault, participantUsdcAccount,
    claimRecord, usdcMint: USDC_MINT, tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  }).preInstructions(preInstructions).transaction();
}


/**
 * `rentPayer` (whichever wallet actually paid this challenge's rent at
 * creation) is auto-resolved by Anchor from the on-chain `has_one` relation
 * on `challenge`, same as in `buildCancelChallengeTx` — not passed explicitly.
 */
export async function buildClaimRefundTx(
  program: Program,
  participant: PublicKey,
  creator: PublicKey,
  challengePDA: PublicKey,
  feePayer: PublicKey = participant
): Promise<Transaction> {
  const [vault] = deriveVaultPDA(challengePDA);
  const [claimRecord] = deriveClaimPDA(challengePDA, participant);
  const { participantUsdcAccount, preInstructions } = await getPayoutAccountSetup(participant, feePayer);
  return (program.methods as any).claimRefund().accounts({
    participant, creator, challenge: challengePDA, vault, participantUsdcAccount,
    claimRecord, usdcMint: USDC_MINT, tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
  }).preInstructions(preInstructions).transaction();
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
        status: enumVariant(d.status) as OnChainChallenge["status"],
        challengeType: enumVariant(d.challengeType) as OnChainChallenge["challengeType"],
        creatorTeam: d.creatorTeam as PublicKey[],
        creatorTeamAmounts: d.creatorTeamAmounts.map((amount: BN) => BigInt(amount.toString())),
        opponentTeam: d.opponentTeam as PublicKey[],
        opponentTeamAmounts: d.opponentTeamAmounts.map((amount: BN) => BigInt(amount.toString())),
        winningSide: enumVariant(d.winningSide) as OnChainChallenge["winningSide"],
        winningSideTotalAmount: BigInt(d.winningSideTotalAmount.toString()),
        settledNetPot: BigInt(d.settledNetPot.toString()),
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
      status: enumVariant(d.status) as OnChainChallenge["status"],
      challengeType: enumVariant(d.challengeType) as OnChainChallenge["challengeType"],
      creatorTeam: d.creatorTeam as PublicKey[],
      creatorTeamAmounts: d.creatorTeamAmounts.map((amount: BN) => BigInt(amount.toString())),
      opponentTeam: d.opponentTeam as PublicKey[],
      opponentTeamAmounts: d.opponentTeamAmounts.map((amount: BN) => BigInt(amount.toString())),
      winningSide: enumVariant(d.winningSide) as OnChainChallenge["winningSide"],
      winningSideTotalAmount: BigInt(d.winningSideTotalAmount.toString()),
      settledNetPot: BigInt(d.settledNetPot.toString()),
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
