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

/**
 * Validates if a string is a valid base58 Solana address.
 */
function isValidBase58Address(address: string): boolean {
    if (!address || typeof address !== "string") return false;
    // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{32,44}$/.test(address);
}

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

    if (solanaWallet?.address && isValidBase58Address(solanaWallet.address)) {
        const address = solanaWallet.address;
        adapter = {
            publicKey: new PublicKey(address),
            signTransaction: async (tx: Transaction) => {
                // NOTE: Do NOT set recentBlockhash here — it will expire while the
                // user reviews the Privy signing modal. sendTransaction sets a fresh
                // blockhash immediately before broadcasting.
                tx.feePayer = new PublicKey(address);

                // Serialize the legacy transaction to bytes for the Privy Solana API
                const serialized = tx.serialize({ requireAllSignatures: false });
                const { signedTransaction } = await solanaWallet.signTransaction({
                    transaction: serialized,
                    chain: 'solana:devnet',
                });

                // Deserialize the signed transaction bytes back to a Transaction object
                return Transaction.from(signedTransaction);
            },
            signAllTransactions: async (txs: Transaction[]) => {
                return Promise.all(
                    txs.map(async (tx) => {
                        tx.feePayer = new PublicKey(address);

                        const serialized = tx.serialize({ requireAllSignatures: false });
                        const { signedTransaction } = await solanaWallet.signTransaction({
                            transaction: serialized,
                            chain: 'solana:devnet',
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
     *
     * Blockhash strategy:
     *  - We use "processed" commitment so we get the absolute freshest blockhash
     *    (~150 slots of validity remaining). "finalized" blockhashes are already
     *    ~32 slots old when received, leaving only ~118 slots — not enough when
     *    the Privy signing modal takes 10-15 s on a slow devnet.
     *  - The blockhash is fetched immediately before the signing modal opens so
     *    the clock starts as late as possible.
     *  - After signing we rebroadcast with skipPreflight + maxRetries to survive
     *    transient devnet congestion.
     */
    async function sendTransaction(tx: Transaction): Promise<string> {
        if (!adapter || !solanaWallet) throw new Error("Wallet not connected");
        const connection = new Connection(RPC_ENDPOINT, "confirmed");

        // ── Balance guard ────────────────────────────────────────────────────────
        // Check before signing so the user gets a clear error instead of a cryptic
        // "block height exceeded" (which happens when the tx is dropped by the RPC
        // node due to insufficient funds but skipPreflight hides the real reason).
        const balance = await connection.getBalance(adapter.publicKey);
        // Require at least 0.005 SOL to cover fees + rent (5_000_000 lamports)
        if (balance < 5_000_000) {
            throw new Error(
                `Insufficient SOL balance. Your wallet has ${(balance / 1e9).toFixed(4)} SOL. ` +
                `Please fund your wallet with at least 0.005 SOL on devnet to pay transaction fees. ` +
                `You can get free devnet SOL at https://faucet.solana.com`
            );
        }

        // "processed" gives the freshest blockhash — maximum ~150 slots of validity.
        const { blockhash, lastValidBlockHeight } =
            await connection.getLatestBlockhash("processed");
        tx.recentBlockhash = blockhash;
        tx.feePayer = adapter.publicKey;

        const serialized = tx.serialize({ requireAllSignatures: false });
        const { signedTransaction } = await solanaWallet.signTransaction({
            transaction: serialized,
            chain: 'solana:devnet',
        });

        const signed = Transaction.from(signedTransaction);
        const rawTx = signed.serialize();

        // Run preflight simulation so real errors (e.g. insufficient funds, program
        // errors) surface immediately rather than timing out as "block height exceeded".
        const sig = await connection.sendRawTransaction(rawTx, {
            skipPreflight: false,
            preflightCommitment: "processed",
            maxRetries: 3,
        });

        // Poll until confirmed or the block height is exceeded.
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