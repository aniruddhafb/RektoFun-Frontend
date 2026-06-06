"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { ArrowDownToLine, ArrowUpFromLine, Check, Copy, ExternalLink, X } from "lucide-react";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import { USDC_MINT, USDC_MULTIPLIER, getReadonlyConnection } from "@/app/lib/rektofun-program";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

type FundsMode = "deposit" | "withdraw";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: FundsMode;
}

export function DepositModal({ isOpen, onClose, initialMode = "deposit" }: DepositModalProps) {
  const { publicKey, usdcBalance, sendTransaction, refreshBalances } = useSolanaWallet();
  const walletAddress = publicKey?.toBase58() ?? null;
  const [mode, setMode] = useState<FundsMode>(initialMode);
  const [copied, setCopied] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const resetWithdrawForm = useCallback(() => {
    setRecipientAddress("");
    setAmountInput("");
    setIsSubmitting(false);
    setError(null);
    setTxSignature(null);
  }, []);

  const handleClose = useCallback(() => {
    resetWithdrawForm();
    onClose();
  }, [onClose, resetWithdrawForm]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, handleClose]);

  const parsedAmount = useMemo(() => Number.parseFloat(amountInput), [amountInput]);

  if (!isOpen) return null;

  const displayBalance = usdcBalance !== null ? `$${usdcBalance.toFixed(2)}` : "$0.00";

  const handleModeChange = (nextMode: FundsMode) => {
    setMode(nextMode);
    setCopied(false);
    setError(null);
    setTxSignature(null);
  };

  const handleCopy = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async () => {
    setError(null);
    setTxSignature(null);

    if (!publicKey || !walletAddress) {
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

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid USDC amount.");
      return;
    }

    const amountMicro = Math.floor(parsedAmount * USDC_MULTIPLIER);
    if (amountMicro <= 0) {
      setError("Amount is too small. Minimum is 0.000001 USDC.");
      return;
    }

    if (usdcBalance !== null && parsedAmount > usdcBalance) {
      setError("Insufficient USDC balance.");
      return;
    }

    try {
      setIsSubmitting(true);
      const connection = getReadonlyConnection();
      const senderUsdcAta = await getAssociatedTokenAddress(USDC_MINT, publicKey, false);
      const recipientUsdcAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey, false);

      const tx = new Transaction();
      const recipientAtaInfo = await connection.getAccountInfo(recipientUsdcAta);
      if (!recipientAtaInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
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
          publicKey,
          BigInt(amountMicro),
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const signature = await sendTransaction(tx);
      setTxSignature(signature);
      await refreshBalances();
      setAmountInput("");
    } catch (withdrawError: unknown) {
      console.error("[DepositModal] Withdraw failed:", withdrawError);
      setError(
        withdrawError instanceof Error
          ? withdrawError.message
          : "Withdraw failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-lg border border-[#1f2937] bg-[#fff8f4] shadow-[4px_4px_0_#111]">
        <div className="border-b border-[#ead7cc] bg-white/55 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#f0cdbc] bg-[#ffe8db] text-[#e85a2d]">
                {mode === "deposit" ? <ArrowDownToLine className="h-5 w-5" strokeWidth={2.6} /> : <ArrowUpFromLine className="h-5 w-5" strokeWidth={2.6} />}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-gray-950">
                  {mode === "deposit" ? "Deposit Funds" : "Withdraw Funds"}
                </h2>
                <p className="text-xs font-semibold text-[#7c6a60]">USDC</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close funds modal"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#d7c5ba] bg-white text-gray-600 transition hover:border-[#111827] hover:bg-[#ffe8db] hover:text-gray-950 focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/20"
            >
              <X className="h-4.5 w-4.5" strokeWidth={2.8} />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-md border border-[#ead7cc] bg-white p-1">
            <button
              type="button"
              onClick={() => handleModeChange("deposit")}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded px-3 py-2 text-sm font-black transition-colors ${mode === "deposit"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-[#fff1e8] hover:text-gray-950"
                }`}
            >
              <ArrowDownToLine className="h-4 w-4" strokeWidth={2.6} />
              Deposit
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("withdraw")}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded px-3 py-2 text-sm font-black transition-colors ${mode === "withdraw"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-[#fff1e8] hover:text-gray-950"
                }`}
            >
              <ArrowUpFromLine className="h-4 w-4" strokeWidth={2.6} />
              Withdraw
            </button>
          </div>

          <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Current USDC Balance</p>
              <p className="text-xl font-black text-gray-950">{displayBalance}</p>
            </div>
          </div>

          {mode === "deposit" ? (
            <>
              <div className="mb-4 rounded-lg border border-[#f0cdbc] bg-[#fff1e8] p-3">
                <p className="text-sm font-bold text-[#5c4035]">
                  Only deposit Solana USDC to this wallet address.
                </p>
              </div>

              <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Wallet Address</p>
                <div className="flex items-center gap-2 rounded-md border border-[#ead7cc] bg-[#fffaf7] p-2">
                  <p className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-gray-800">
                    {walletAddress ?? "No wallet connected"}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!walletAddress}
                    aria-label="Copy wallet address"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d7c5ba] bg-white text-gray-700 transition hover:border-[#111827] hover:bg-[#f5d547] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" strokeWidth={2.8} />
                    ) : (
                      <Copy className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* <div className="rounded-lg border border-[#ead7cc] bg-white p-4">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Devnet Faucets</p>
                <p className="text-sm font-semibold leading-relaxed text-gray-700">
                  Get devnet SOL for transaction fees and devnet USDC for deposits.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 rounded-md border border-[#d7c5ba] bg-[#fffaf7] px-3 py-2 text-xs font-black text-gray-800 transition hover:border-[#111827] hover:bg-[#f5d547]">
                    SOL <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 rounded-md border border-[#d7c5ba] bg-[#fffaf7] px-3 py-2 text-xs font-black text-gray-800 transition hover:border-[#111827] hover:bg-[#f5d547]">
                    USDC <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div> */}

            </>
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Recipient Solana Address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Enter destination wallet address"
                  className="w-full rounded-md border border-[#d7c5ba] bg-[#fffaf7] px-3 py-2.5 text-sm font-semibold text-gray-900 focus:border-[#e85a2d] focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/15"
                />
              </div>

              <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Amount (USDC)</label>
                  {usdcBalance !== null && (
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
                  className="w-full rounded-md border border-[#d7c5ba] bg-[#fffaf7] px-3 py-2.5 text-sm font-semibold text-gray-900 focus:border-[#e85a2d] focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/15"
                />
              </div>

              {error && <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

              {txSignature && (
                <p className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 break-all">
                  Success. Tx:{" "}
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    {txSignature}
                  </a>
                </p>
              )}

              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isSubmitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-gray-900 py-3 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                <ArrowUpFromLine className="h-4 w-4" strokeWidth={2.6} />
                {isSubmitting ? "Processing..." : "Withdraw USDC"}
              </button>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
