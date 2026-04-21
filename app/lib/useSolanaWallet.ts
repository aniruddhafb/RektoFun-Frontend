"use client";

/**
 * useSolanaWallet
 *
 * Bridges Privy's embedded/external Solana wallet to the Anchor program client.
 * Returns a wallet adapter compatible with getRektoProgram().
 */

import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction, Connection } from "@solana/web3.js";
import { getRektoProgram, RPC_ENDPOINT } from "./rektofun-program";
import type { Program } from "@anchor-lang/core";

export interface SolanaWalletAdapter {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
}

export function useSolanaWallet() {
  const { authenticated, login } = usePrivy();
  const { wallets, ready } = useWallets();

  console.log({ solanaWallets: wallets, ready });

  // Pick the first available Solana wallet
  const solanaWallet = wallets[0] ?? null;

  console.log({ solanaWallet });

  let adapter: SolanaWalletAdapter | null = null;

  if (solanaWallet?.address) {
    const address = solanaWallet.address;
    adapter = {
      publicKey: new PublicKey(address),
      signTransaction: async (tx: Transaction) => {
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = new PublicKey(address);

        // Serialize the legacy transaction to bytes for the Privy Solana API
        const serialized = tx.serialize({ requireAllSignatures: false });
        const { signedTransaction } = await solanaWallet.signTransaction({
          transaction: serialized,
        });

        // Deserialize the signed transaction bytes back to a Transaction object
        return Transaction.from(signedTransaction);
      },
      signAllTransactions: async (txs: Transaction[]) => {
        const connection = new Connection(RPC_ENDPOINT, "confirmed");
        const { blockhash } = await connection.getLatestBlockhash();
        return Promise.all(
          txs.map(async (tx) => {
            tx.recentBlockhash = blockhash;
            tx.feePayer = new PublicKey(address);

            const serialized = tx.serialize({ requireAllSignatures: false });
            const { signedTransaction } = await solanaWallet.signTransaction({
              transaction: serialized,
            });

            return Transaction.from(signedTransaction);
          })
        );
      },
    };
  }

  let program: Program | null = null;
  if (adapter) {
    try {
      program = getRektoProgram(adapter);
    } catch {
      program = null;
    }
  }

  /**
   * Send a pre-built transaction via the Solana wallet.
   * Returns the transaction signature.
   */
  async function sendTransaction(tx: Transaction): Promise<string> {
    if (!adapter || !solanaWallet) throw new Error("Wallet not connected");
    const connection = new Connection(RPC_ENDPOINT, "confirmed");
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = adapter.publicKey;

    const serialized = tx.serialize({ requireAllSignatures: false });
    const { signedTransaction } = await solanaWallet.signTransaction({
      transaction: serialized,
    });

    const signed = Transaction.from(signedTransaction);
    const rawTx = signed.serialize();
    const sig = await connection.sendRawTransaction(rawTx, {
      skipPreflight: false,
    });
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );
    return sig;
  }

  return {
    authenticated,
    login,
    solanaWallet,
    adapter,
    program,
    sendTransaction,
    publicKey: adapter?.publicKey ?? null,
  };
}
