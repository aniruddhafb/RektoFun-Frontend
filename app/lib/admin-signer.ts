/**
 * Server-side admin signer for RektoFun.
 *
 * This file MUST only run in Next.js API routes / server functions.
 * It loads the admin private key from `ADMIN_PRIVATE_KEY` (base58) and acts
 * as the fee payer for challenge creation transactions.
 *
 * Flow:
 *  1. API receives the user's wallet address + challenge args.
 *  2. Build the transaction with:
 *       - creator  = user's wallet  (USDC is debited from their ATA)
 *       - feePayer = admin wallet   (admin pays all SOL rent / tx fees)
 *  3. Admin partially signs the transaction.
 *  4. Return the base64-serialised, partially-signed transaction to the frontend.
 *  5. Frontend has the user's wallet sign it (second signature for USDC authority).
 *  6. Frontend broadcasts the fully-signed transaction.
 */

import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  buildCreateChallengeTx,
  CreateChallengeArgs,
  deriveChallengePDA,
  deriveCreatorCounter,
  getReadonlyConnection,
  getRektoProgram,
} from "./rektofun-program";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bs58 = require("bs58") as { decode: (str: string) => Uint8Array; encode: (buf: Uint8Array) => string };

let cachedKeypair: Keypair | null = null;

function getAdminKeypair(): Keypair {
  if (cachedKeypair) return cachedKeypair;

  const privateKeyBase58 = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKeyBase58) {
    throw new Error(
      "ADMIN_PRIVATE_KEY environment variable is not set. Cannot sign admin transactions."
    );
  }

  cachedKeypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
  return cachedKeypair;
}

export function getAdminPublicKey(): PublicKey {
  return getAdminKeypair().publicKey;
}

/**
 * Build a `create_challenge` transaction where:
 *   - `creator`  = user's wallet (their USDC ATA is debited)
 *   - `feePayer` = admin wallet  (admin pays all SOL rent / tx fees)
 *
 * The admin partially signs the transaction and returns it as a base64 string
 * so the frontend can collect the user's signature and broadcast it.
 *
 * @param userWallet  - The user's Solana wallet address (base58)
 * @param args        - Challenge creation parameters
 * @returns           - base64-encoded partially-signed transaction + metadata
 */
export async function buildAdminSignedCreateChallengeTx(
  userWallet: string,
  args: CreateChallengeArgs
) {
  const adminKeypair = getAdminKeypair();
  const adminPubkey = adminKeypair.publicKey;
  const userPubkey = new PublicKey(userWallet);
  const connection = getReadonlyConnection();

  // Build a minimal wallet adapter for the program client.
  // The admin is only used to derive the provider; the actual creator is the user.
  const adminWalletAdapter = {
    publicKey: adminPubkey,
    signTransaction: async (tx: Transaction) => {
      tx.partialSign(adminKeypair);
      return tx;
    },
    signAllTransactions: async (txs: Transaction[]) => {
      txs.forEach((tx) => tx.partialSign(adminKeypair));
      return txs;
    },
  };

  const program = getRektoProgram(adminWalletAdapter);

  // Determine the next challenge ID for the user (creator) so we can return the PDA.
  const [counterPDA] = deriveCreatorCounter(userPubkey);
  let nextChallengeId = 0;
  try {
    const counter = await (program.account as any).creatorCounter.fetch(counterPDA);
    nextChallengeId = Number(counter.count);
  } catch {
    // Counter doesn't exist yet — this will be the user's first challenge.
    nextChallengeId = 0;
  }

  // Build the transaction:
  //   creator  = userPubkey  → USDC is transferred from user's ATA
  //   feePayer = adminPubkey → admin pays all SOL (rent, tx fee)
  const tx = await buildCreateChallengeTx(
    program,
    userPubkey,
    {
      ...args,
      expiresAt: Math.floor(args.expiresAt),
      resolvesAt: Math.floor(args.resolvesAt),
    },
    adminPubkey  // feePayer
  );

  // Set fee payer and fetch a fresh blockhash.
  tx.feePayer = adminPubkey;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  // Admin partially signs (covers fee payer signature requirement).
  tx.partialSign(adminKeypair);

  // Serialize allowing incomplete signatures (user hasn't signed yet).
  const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");

  const [challengePDA] = deriveChallengePDA(userPubkey, nextChallengeId);

  return {
    serializedTx,
    blockhash,
    lastValidBlockHeight,
    admin: adminPubkey.toBase58(),
    creator: userPubkey.toBase58(),
    challengePDA: challengePDA.toBase58(),
    challengeId: nextChallengeId,
  };
}
