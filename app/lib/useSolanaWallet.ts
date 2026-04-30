"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction, Connection } from "@solana/web3.js";
import { getRektoProgram, RPC_ENDPOINT } from "./rektofun-program";
import type { Program } from "@anchor-lang/core";

// USDC mint address on Solana devnet
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

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
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
    const [solBalance, setSolBalance] = useState<number | null>(null);

    console.log({ solanaWallets: wallets, ready });

    // Pick the first available Solana wallet
    const solanaWallet = wallets[0] ?? null;

    console.log({ solanaWallet });

    // Use useMemo to create a stable adapter reference based on the wallet address.
    // This prevents the useEffect from re-running on every render.
    const adapter: SolanaWalletAdapter | null = useMemo(() => {
        if (!solanaWallet?.address || !isValidBase58Address(solanaWallet.address)) {
            return null;
        }

        const address = solanaWallet.address;
        return {
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
    }, [solanaWallet?.address]);

    // Derive a stable publicKey string for dependency tracking
    const publicKeyBase58 = adapter?.publicKey?.toBase58() ?? null;

    const program: Program | null = useMemo(() => {
        if (!adapter) return null;
        try {
            return getRektoProgram(adapter);
        } catch {
            return null;
        }
    }, [adapter]);

    // Fetch USDC balance with debouncing to avoid rate limit (429) errors.
    // The effect depends on publicKeyBase58 (a stable string), not the adapter object.
    useEffect(() => {
        if (!publicKeyBase58) {
            setUsdcBalance(null);
            setSolBalance(null);
            return;
        }

        // Track if this fetch has been superseded by a newer trigger
        let isStale = false;
        let timeoutId: ReturnType<typeof setTimeout>;

        const fetchBalances = async () => {
            try {
                const connection = new Connection(RPC_ENDPOINT, "confirmed");
                
                // Fetch USDC balance
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                    new PublicKey(publicKeyBase58),
                    { mint: USDC_MINT }
                );

                // Ignore response if a newer fetch has started
                if (isStale) return;

                if (tokenAccounts.value.length > 0) {
                    const usdcBal = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
                    setUsdcBalance(usdcBal);
                } else {
                    setUsdcBalance(0);
                }

                // Fetch SOL balance
                const solBal = await connection.getBalance(new PublicKey(publicKeyBase58));
                if (!isStale) {
                    setSolBalance(solBal / 1e9); // Convert lamports to SOL
                }
            } catch (error) {
                // Ignore errors from superseded requests
                if (isStale) return;
                console.error('[useSolanaWallet] Failed to fetch balances:', error);
            }
        };

        // Debounce: wait 500ms before fetching to avoid rapid re-renders hitting rate limit
        timeoutId = setTimeout(() => {
            isStale = false;
            fetchBalances();
        }, 500);

        return () => {
            isStale = true;
            clearTimeout(timeoutId);
        };
    }, [publicKeyBase58]);

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
        usdcBalance,
        solBalance,
    };
}
