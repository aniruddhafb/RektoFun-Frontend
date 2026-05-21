"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getRektoProgram, getReadonlyConnection } from "./rektofun-program";
import type { Program } from "@anchor-lang/core";

// USDC mint address on Solana devnet
const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const BALANCE_CACHE_TTL_MS = 30_000;

type SharedBalanceSnapshot = {
    usdcBalance: number;
    solBalance: number;
};

type SharedBalanceEntry = {
    value?: SharedBalanceSnapshot;
    fetchedAt?: number;
    inFlight?: Promise<SharedBalanceSnapshot>;
};

const sharedBalanceCache = new Map<string, SharedBalanceEntry>();

async function fetchBalancesByWalletAddress(
    walletAddress: string,
    options?: { force?: boolean }
): Promise<SharedBalanceSnapshot> {
    const now = Date.now();
    const cached = sharedBalanceCache.get(walletAddress);

    if (!options?.force && cached?.value && cached.fetchedAt && now - cached.fetchedAt < BALANCE_CACHE_TTL_MS) {
        return cached.value;
    }

    if (cached?.inFlight) {
        return cached.inFlight;
    }

    const inFlight = (async () => {
        const connection = getReadonlyConnection();
        const walletPublicKey = new PublicKey(walletAddress);

        const [tokenAccounts, solLamports] = await Promise.all([
            connection.getParsedTokenAccountsByOwner(walletPublicKey, { mint: USDC_MINT }),
            connection.getBalance(walletPublicKey),
        ]);

        const nextValue: SharedBalanceSnapshot = {
            usdcBalance:
                tokenAccounts.value.length > 0
                    ? Number(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount ?? 0)
                    : 0,
            solBalance: solLamports / 1e9,
        };

        sharedBalanceCache.set(walletAddress, {
            value: nextValue,
            fetchedAt: Date.now(),
        });

        return nextValue;
    })();

    sharedBalanceCache.set(walletAddress, {
        ...cached,
        inFlight,
    });

    try {
        return await inFlight;
    } finally {
        const latest = sharedBalanceCache.get(walletAddress);
        if (latest?.inFlight === inFlight) {
            sharedBalanceCache.set(walletAddress, {
                value: latest.value,
                fetchedAt: latest.fetchedAt,
            });
        }
    }
}

export async function getWalletBalancesByAddress(
    walletAddress: string,
    options?: { force?: boolean }
): Promise<SharedBalanceSnapshot> {
    if (!isValidBase58Address(walletAddress)) {
        throw new Error("Invalid Solana wallet address");
    }
    return fetchBalancesByWalletAddress(walletAddress, options);
}

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

    // Pick the first available Solana wallet
    const solanaWallet = wallets[0] ?? null;

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

    const fetchSharedBalances = useCallback(async (walletAddress: string, options?: { force?: boolean }): Promise<SharedBalanceSnapshot> => {
        return fetchBalancesByWalletAddress(walletAddress, options);
    }, []);

    const refreshBalances = useCallback(async () => {
        if (!publicKeyBase58) return null;
        try {
            const snapshot = await fetchSharedBalances(publicKeyBase58, { force: true });
            setUsdcBalance(snapshot.usdcBalance);
            setSolBalance(snapshot.solBalance);
            return snapshot;
        } catch (error) {
            console.error("[useSolanaWallet] Failed to refresh balances:", error);
            return null;
        }
    }, [publicKeyBase58, fetchSharedBalances]);

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

        const run = async () => {
            try {
                const snapshot = await fetchSharedBalances(publicKeyBase58);
                if (isStale) return;
                setUsdcBalance(snapshot.usdcBalance);
                setSolBalance(snapshot.solBalance);
            } catch (error) {
                if (isStale) return;
                console.error("[useSolanaWallet] Failed to fetch balances:", error);
            }
        };

        // Debounce + shared caching: avoid a burst of duplicate calls across mounted components.
        timeoutId = setTimeout(() => {
            isStale = false;
            run();
        }, 500);

        return () => {
            isStale = true;
            clearTimeout(timeoutId);
        };
    }, [publicKeyBase58, fetchSharedBalances]);

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
        const connection = getReadonlyConnection();

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
        refreshBalances,
    };
}
