"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Connection, PublicKey } from "@solana/web3.js";
import { useSolanaWallet } from "./useSolanaWallet";
import { RPC_ENDPOINT } from "./rektofun-program";

// USDC mint address on Solana devnet
export const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

export interface WalletData {
    solanaWallet: ReturnType<typeof useSolanaWallet>["solanaWallet"];
    walletAddress: string | null;
    usdcBalance: number | null;
}

/**
 * Validates if a string is a valid base58 Solana address.
 */
function isValidBase58Address(address: string): boolean {
    if (!address || typeof address !== "string") return false;
    // Base58 alphabet: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{32,44}$/.test(address);
}

export function useWalletData() {
    const { user } = usePrivy();
    const { solanaWallet } = useSolanaWallet();
    const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

    // Get wallet address from solanaWallet first, fallback to user.wallet
    // Only use addresses that pass base58 validation
    const rawAddress = solanaWallet?.address || user?.wallet?.address || null;
    const walletAddress = rawAddress && isValidBase58Address(rawAddress) ? rawAddress : null;

    // Fetch USDC balance
    useEffect(() => {
        const fetchUsdcBalance = async () => {
            if (!walletAddress) {
                setUsdcBalance(null);
                return;
            }

            try {
                const connection = new Connection(RPC_ENDPOINT, "confirmed");
                const publicKey = new PublicKey(walletAddress);
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                    mint: USDC_MINT,
                });

                if (tokenAccounts.value.length > 0) {
                    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
                    setUsdcBalance(balance);
                } else {
                    setUsdcBalance(0);
                }
            } catch (error) {
                console.error('[useWalletData] Failed to fetch USDC balance:', error);
                setUsdcBalance(null);
            }
        };

        fetchUsdcBalance();
    }, [walletAddress]);

    return {
        solanaWallet,
        walletAddress,
        usdcBalance,
    };
}