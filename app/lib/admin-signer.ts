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

import { Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import bs58 from "bs58";
import {
  buildCreateChallengeTx,
  buildAcceptChallengeTx,
  buildCancelChallengeTx,
  buildClaimRefundTx,
  buildClaimWinningsTx,
  estimateCreateChallengeRentLamports,
  estimateClaimFeeLamports,
  estimateCancelChallengeFeeLamports,
  CreateChallengeArgs,
  deriveChallengePDA,
  deriveCreatorCounter,
  getReadonlyConnection,
  getRektoProgram,
  USDC_MINT,
  USDC_MULTIPLIER,
} from "./rektofun-program";

export type SponsoredChallengeAction = "accept" | "cancel" | "refund" | "winnings";

export async function buildAdminSignedChallengeActionTx(args: {
  action: SponsoredChallengeAction;
  participant: PublicKey;
  creator: PublicKey;
  challengePDA: PublicKey;
  joinCreatorSide?: boolean;
  amountMicroUsdc?: bigint;
}) {
  const adminKeypair = getAdminKeypair();
  const adminPubkey = adminKeypair.publicKey;
  const connection = getReadonlyConnection();
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

  // For cancel/refund/winnings, self-pay when the caller's own SOL balance
  // covers it — same balance-check-then-fallback pattern as create_challenge.
  // "accept" always stays admin-sponsored (unchanged) since it's out of scope
  // here. `feePayer` decides both which key funds this call's on-chain rent
  // (claim_record for refund/winnings) and which key covers the network fee.
  let feePayerPubkey = adminPubkey;
  if (args.action === "cancel") {
    const [required, balance] = await Promise.all([
      estimateCancelChallengeFeeLamports(),
      connection.getBalance(args.participant),
    ]);
    if (balance >= required) feePayerPubkey = args.participant;
  } else if (args.action === "refund" || args.action === "winnings") {
    const [required, balance] = await Promise.all([
      estimateClaimFeeLamports(connection, args.participant),
      connection.getBalance(args.participant),
    ]);
    if (balance >= required) feePayerPubkey = args.participant;
  }
  const selfPay = args.action !== "accept" && feePayerPubkey.equals(args.participant);

  const tx = args.action === "accept"
    ? await buildAcceptChallengeTx(
      program,
      args.participant,
      args.challengePDA,
      args.creator,
      Boolean(args.joinCreatorSide),
      args.amountMicroUsdc ?? BigInt(0),
      adminPubkey,
    )
    : args.action === "cancel"
      ? await buildCancelChallengeTx(program, args.participant, args.challengePDA)
      : args.action === "refund"
        ? await buildClaimRefundTx(program, args.participant, args.creator, args.challengePDA, feePayerPubkey)
        : await buildClaimWinningsTx(program, args.participant, args.creator, args.challengePDA, feePayerPubkey);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.feePayer = feePayerPubkey;
  tx.recentBlockhash = blockhash;

  // Only the sponsored path needs a server-side signature — in the self-pay
  // path feePayer === participant, so their own wallet signature (collected
  // client-side, as always) is the only one required.
  if (!selfPay) {
    tx.partialSign(adminKeypair);
  }

  return {
    serializedTx: tx.serialize({ requireAllSignatures: false }).toString("base64"),
    blockhash,
    lastValidBlockHeight,
    rentSponsored: !selfPay,
  };
}

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

const NEW_ACCOUNT_ATA_SPACE = 165; // SPL token account size
const NEW_ACCOUNT_TX_FEE_LAMPORTS = 10_000; // base network fee admin also fronts on this route
const NEW_ACCOUNT_FEE_MARGIN_BPS = BigInt(50); // 0.5% of the withdrawal amount, margin on top of the actual SOL cost
const REKTO_WITHDRAW_FEE_MICRO_USDC = BigInt(500_000); // Fixed 0.5 USDC; USDC has 6 decimals

/** Live SOL/USDC spot price, used to convert the sponsored SOL cost into a USDC-equivalent fee. */
async function fetchSolUsdcPrice(): Promise<number> {
  const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDC", {
    next: { revalidate: 30 },
  });
  if (!response.ok) throw new Error("Unable to fetch SOL price.");
  const data = await response.json() as { price?: string };
  const price = Number(data.price);
  if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid SOL price received.");
  return price;
}

/**
 * Build a gas-sponsored SPL token transfer. The admin pays the transaction
 * fee (and recipient ATA rent when needed), while the token owner must still
 * add their wallet signature before the transaction can be broadcast. When
 * the recipient's ATA doesn't exist yet and the transfer is USDC, the exact
 * SOL cost admin just fronted (ATA rent + tx fee) is converted to its USDC
 * value via the live SOL/USDC price, plus a margin of 0.5% of the withdrawal
 * amount, and deducted from the transferred amount into the admin's own
 * token account. REKTO withdrawals transfer the full requested REKTO amount
 * and charge a fixed 0.5 USDC from the sender's USDC ATA instead.
 */
export async function buildAdminSignedTokenTransferTx(args: {
  sender: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  amount: bigint;
}) {
  if (args.amount <= BigInt(0)) throw new Error("Transfer amount must be positive.");

  const adminKeypair = getAdminKeypair();
  const connection = getReadonlyConnection();
  const senderTokenAccount = await getAssociatedTokenAddress(args.mint, args.sender, false);
  const recipientTokenAccount = await getAssociatedTokenAddress(args.mint, args.recipient, false);

  const senderAccount = await connection.getAccountInfo(senderTokenAccount);
  if (!senderAccount) throw new Error("The sender token account does not exist.");

  const tx = new Transaction();
  const recipientAccount = await connection.getAccountInfo(recipientTokenAccount);
  let recipientAmount = args.amount;
  let newAccountFee = BigInt(0);
  const isUsdcWithdrawal = args.mint.equals(USDC_MINT);

  // Charge the 0.5% USDC withdrawal fee on every USDC withdrawal, whether
  // or not the recipient already has a USDC ATA.
  if (isUsdcWithdrawal) {
    newAccountFee =
      (args.amount * NEW_ACCOUNT_FEE_MARGIN_BPS) / BigInt(10_000);
  }

  if (!recipientAccount) {
    if (isUsdcWithdrawal) {
      const [ataRentLamports, solUsdcPrice] = await Promise.all([
        connection.getMinimumBalanceForRentExemption(NEW_ACCOUNT_ATA_SPACE),
        fetchSolUsdcPrice(),
      ]);
      const sponsoredLamports = ataRentLamports + NEW_ACCOUNT_TX_FEE_LAMPORTS;
      const baseCostMicroUsdc = (sponsoredLamports / LAMPORTS_PER_SOL) * solUsdcPrice * USDC_MULTIPLIER;
      newAccountFee += BigInt(Math.ceil(baseCostMicroUsdc));
    }

    tx.add(
      createAssociatedTokenAccountInstruction(
        adminKeypair.publicKey,
        recipientTokenAccount,
        args.recipient,
        args.mint,
      ),
    );
  }

  if (isUsdcWithdrawal) {
    recipientAmount = args.amount - newAccountFee;
    if (recipientAmount <= BigInt(0)) {
      throw new Error("Transfer amount is too small to cover the withdrawal fee.");
    }
  }

  tx.add(
    createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      args.sender,
      recipientAmount,
      [],
      TOKEN_PROGRAM_ID,
    ),
  );

  let withdrawalFeeAmount = newAccountFee;
  let withdrawalFeeMint = args.mint;
  let feeSourceTokenAccount = senderTokenAccount;

  if (!isUsdcWithdrawal) {
    withdrawalFeeAmount = REKTO_WITHDRAW_FEE_MICRO_USDC;
    withdrawalFeeMint = USDC_MINT;
    feeSourceTokenAccount = await getAssociatedTokenAddress(
      USDC_MINT,
      args.sender,
      false,
    );
    const senderUsdcAccount = await connection.getAccountInfo(feeSourceTokenAccount);
    if (!senderUsdcAccount) {
      throw new Error("A USDC balance is required to pay the fixed 0.5 USDC REKTO withdrawal fee.");
    }
  }

  if (withdrawalFeeAmount > BigInt(0)) {
    const adminTokenAccount = await getAssociatedTokenAddress(
      withdrawalFeeMint,
      adminKeypair.publicKey,
      false,
    );
    const adminTokenAccountInfo = await connection.getAccountInfo(adminTokenAccount);
    if (!adminTokenAccountInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          adminKeypair.publicKey,
          adminTokenAccount,
          adminKeypair.publicKey,
          withdrawalFeeMint,
        ),
      );
    }
    tx.add(
      createTransferInstruction(
        feeSourceTokenAccount,
        adminTokenAccount,
        args.sender,
        withdrawalFeeAmount,
        [],
        TOKEN_PROGRAM_ID,
      ),
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.feePayer = adminKeypair.publicKey;
  tx.recentBlockhash = blockhash;
  tx.partialSign(adminKeypair);

  return {
    serializedTx: tx.serialize({ requireAllSignatures: false }).toString("base64"),
    blockhash,
    lastValidBlockHeight,
    withdrawalFee: {
      amount: withdrawalFeeAmount.toString(),
      mint: withdrawalFeeMint.toBase58(),
      symbol: "USDC",
      decimals: 6,
    },
  };
}

/**
 * Build a `create_challenge` transaction where:
 *   - `creator`   = user's wallet (their USDC ATA is debited)
 *   - `feePayer`  = the user's own wallet, if their SOL balance comfortably
 *                   covers the required rent (self-pay); otherwise the admin
 *                   wallet sponsors it, same as before.
 *
 * In the self-pay case `feePayer` and `creator` are the same key, so only the
 * user's own signature (collected client-side, same as always) is required —
 * the admin never signs, and the challenge's `rent_payer` is recorded
 * on-chain as the user, so *they* get the rent back when the challenge later
 * settles/cancels/closes, instead of it going to admin.
 *
 * @param userWallet  - The user's Solana wallet address (base58)
 * @param args        - Challenge creation parameters
 * @returns           - base64-encoded (partially-)signed transaction + metadata
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
    const counterAccount = program.account as unknown as {
      creatorCounter: { fetch: (address: PublicKey) => Promise<{ count: unknown }> };
    };
    const counter = await counterAccount.creatorCounter.fetch(counterPDA);
    nextChallengeId = Number(counter.count);
  } catch {
    // Counter doesn't exist yet — this will be the user's first challenge.
    nextChallengeId = 0;
  }

  // Decide who pays SOL rent: the user self-pays when their balance
  // comfortably covers it; otherwise admin sponsors, as before. Checking here
  // — server-side, before any signing — means an underfunded user still gets
  // a working sponsored transaction rather than a self-pay attempt that fails
  // at broadcast for insufficient funds.
  const requiredLamports = await estimateCreateChallengeRentLamports(
    program,
    connection,
    userPubkey,
    args
  );
  const userBalance = await connection.getBalance(userPubkey);
  const selfPay = userBalance >= requiredLamports;
  const feePayerPubkey = selfPay ? userPubkey : adminPubkey;

  // Build the transaction:
  //   creator  = userPubkey      → USDC is transferred from user's ATA
  //   feePayer = feePayerPubkey  → pays all SOL (rent, tx fee)
  const tx = await buildCreateChallengeTx(
    program,
    userPubkey,
    {
      ...args,
      expiresAt: Math.floor(args.expiresAt),
      resolvesAt: Math.floor(args.resolvesAt),
    },
    feePayerPubkey
  );

  // Set fee payer and fetch a fresh blockhash.
  tx.feePayer = feePayerPubkey;
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;

  // Only the sponsored path needs a server-side signature — in the self-pay
  // path feePayer === creator, so the user's own wallet signature (collected
  // client-side, as always) is the only one required.
  if (!selfPay) {
    tx.partialSign(adminKeypair);
  }

  // Serialize allowing incomplete signatures (user hasn't signed yet).
  const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");

  const [challengePDA] = deriveChallengePDA(userPubkey, nextChallengeId);

  return {
    serializedTx,
    blockhash,
    lastValidBlockHeight,
    admin: selfPay ? null : adminPubkey.toBase58(),
    rentSponsored: !selfPay,
    creator: userPubkey.toBase58(),
    challengePDA: challengePDA.toBase58(),
    challengeId: nextChallengeId,
  };
}
