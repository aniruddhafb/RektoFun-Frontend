"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { ArrowUpFromLine, X } from "lucide-react";
import { USDC_MINT, USDC_MULTIPLIER, getReadonlyConnection } from "@/app/lib/rektofun-program";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  const connection = getReadonlyConnection();
  const parsedAmount = parseFloat(amountInput) || 0;

  const handleClose = useCallback(() => {
    setRecipientAddress("");
    setAmountInput("");
    setError(null);
    setTxSignature(null);
    onClose();
  }, [onClose]);

  useBodyScrollLock(isOpen);

  // Fetch USDC balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !isConnected) {
        setUsdcBalance(null);
        return;
      }

      try {
        const pubKey = new PublicKey(address);
        const ata = await getAssociatedTokenAddress(USDC_MINT, pubKey, false);
        const accountInfo = await connection.getTokenAccountBalance(ata);
        setUsdcBalance(accountInfo.value.uiAmount || 0);
      } catch {
        setUsdcBalance(0);
      }
    };

    fetchBalance();
  }, [address, isConnected, connection]);

  // Escape key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const displayBalance = usdcBalance !== null ? `$${usdcBalance.toFixed(2)}` : "$0.00";

  const handleWithdraw = async () => {
    setError(null);
    setTxSignature(null);

    if (!address || !walletProvider) {
      setError("Wallet not connected.");
      return;
    }

    const recipient = recipientAddress.trim();
    if (!recipient) {
      setError("Please enter a recipient Solana wallet address.");
      return;
    }

    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(recipient);
    } catch {
      setError("Invalid recipient Solana wallet address.");
      return;
    }

    if (parsedAmount <= 0) {
      setError("Please enter a valid USDC amount.");
      return;
    }

    const amountMicro = Math.floor(parsedAmount * USDC_MULTIPLIER);
    if (amountMicro <= 0) {
      setError("Amount must be at least 0.000001 USDC.");
      return;
    }

    if (usdcBalance !== null && parsedAmount > usdcBalance) {
      setError(`Insufficient USDC balance. You have ${usdcBalance.toFixed(2)} USDC.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const senderPubkey = new PublicKey(address);
      const senderUsdcAta = await getAssociatedTokenAddress(USDC_MINT, senderPubkey, false);
      const recipientUsdcAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey, false);

      const tx = new Transaction();
      const recipientAtaInfo = await connection.getAccountInfo(recipientUsdcAta);

      if (!recipientAtaInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            senderPubkey,
            recipientUsdcAta,
            recipientPubkey,
            USDC_MINT
          )
        );
      }

      tx.add(
        createTransferInstruction(
          senderUsdcAta,
          recipientUsdcAta,
          senderPubkey,
          BigInt(amountMicro),
          [],
          TOKEN_PROGRAM_ID
        )
      );

      tx.feePayer = senderPubkey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTx = await (walletProvider as any).signAndSendTransaction(tx);
      setTxSignature(signedTx);
      setAmountInput("");
      setRecipientAddress("");

      // Refresh balance after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: unknown) {
      console.error("[WithdrawModal] Withdraw failed:", err);
      setError(err instanceof Error ? err.message : "Withdraw failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-lg border border-[#1f2937] bg-[#fff8f4] shadow-[0_18px_60px_rgba(17,17,17,0.28)]">
        <div className="border-b border-[#ead7cc] bg-white/55 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#f0cdbc] bg-[#ffe8db] text-[#e85a2d]">
                <ArrowUpFromLine className="h-5 w-5" strokeWidth={2.6} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-gray-950">Withdraw USDC</h2>
                <p className="text-xs font-semibold text-[#7c6a60]">Solana devnet USDC</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close withdraw modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d7c5ba] bg-white text-gray-600 transition hover:border-[#111827] hover:bg-[#ffe8db] hover:text-gray-950 focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/20"
            >
              <X className="h-5 w-5" strokeWidth={2.8} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Current USDC Balance</p>
              <p className="text-xl font-black text-gray-950">{displayBalance}</p>
            </div>
          </div>

          <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Recipient Solana Address</label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Enter destination wallet address"
              disabled={!isConnected}
              className="w-full rounded-md border border-[#d7c5ba] bg-[#fffaf7] px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-500 focus:border-[#e85a2d] focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/15 disabled:opacity-50"
            />
          </div>

          <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Amount (USDC)</label>
              {usdcBalance !== null && usdcBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountInput(String(usdcBalance))}
                  className="text-xs font-black text-[#e85a2d] hover:text-gray-950"
                >
                  Max
                </button>
              )}
            </div>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.000001"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0.00"
              disabled={!isConnected}
              className="w-full rounded-md border border-[#d7c5ba] bg-[#fffaf7] px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-500 focus:border-[#e85a2d] focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/15 disabled:opacity-50"
            />
          </div>

          {error && <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

          {txSignature && (
            <p className="mb-3 break-all rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
              ✓ Transaction sent:{" "}
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                View on explorer
              </a>
            </p>
          )}

          <button
            type="button"
            onClick={handleWithdraw}
            disabled={isSubmitting || !isConnected}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-gray-900 py-3 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
          >
            <ArrowUpFromLine className="h-4 w-4" strokeWidth={2.6} />
            {isSubmitting ? "Processing..." : "Withdraw USDC"}
          </button>

          <p className="mt-4 text-xs font-semibold text-black text-center">
            Withdraw sends devnet USDC on Solana from your connected wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
