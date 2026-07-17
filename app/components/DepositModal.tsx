"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from "@reown/appkit/react";
import { solana, solanaDevnet } from "@reown/appkit/networks";
import QRCode from "qrcode";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  getMint,
} from "@solana/spl-token";
import { ArrowDownToLine, ArrowUpFromLine, ArrowUpRight, Check, ChevronDown, Copy, X } from "lucide-react";
import { SOLANA_CLUSTER, getSolanaRpcEndpoint, getSolscanClusterQuery, getTokenMintAddress } from "@/app/lib/solana-config";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { useTokenBalanceStore } from "@/app/store/useTokenBalanceStore";

type FundsMode = "deposit" | "withdraw";
type Asset = "usdc" | "rekto";
type SolanaWalletProvider = {
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
};

const ASSET_CONFIG = {
  usdc: { mint: new PublicKey(getTokenMintAddress("usdc")) },
  rekto: { mint: new PublicKey(getTokenMintAddress("rekto")) },
} as const;
const MIN_WITHDRAW_AMOUNT: Record<Asset, number> = {
  usdc: 5,
  rekto: 1_000,
};
const activeNetwork = SOLANA_CLUSTER === "devnet" ? solanaDevnet : solana;

function formatAssetBalance(balance: number | null, maximumFractionDigits = 2) {
  if (balance === null || !Number.isFinite(balance)) return "0";

  if (Math.abs(balance) <= 10_000) {
    return balance.toLocaleString(undefined, { maximumFractionDigits });
  }

  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(balance);
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: FundsMode;
  usdcBalance: number | null;
  rektoBalance: number | null;
}

export function DepositModal({ isOpen, onClose, initialMode = "deposit", usdcBalance, rektoBalance }: DepositModalProps) {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<SolanaWalletProvider>("solana");
  const { switchNetwork } = useAppKitNetwork();
  const loadBalances = useTokenBalanceStore((state) => state.loadBalances);

  const [mode, setMode] = useState<FundsMode>(initialMode);
  const [copied, setCopied] = useState(false);
  const [asset, setAsset] = useState<Asset>("usdc");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const parsedAmount = parseFloat(amountInput) || 0;

  const handleClose = useCallback(() => {
    setRecipientAddress("");
    setAmountInput("");
    setError(null);
    setTxSignature(null);
    onClose();
  }, [onClose]);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    let isCurrent = true;

    if (!isOpen || mode !== "deposit" || !address) {
      return;
    }

    QRCode.toDataURL(address, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 320,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (isCurrent) setQrCodeUrl(url);
      })
      .catch((qrError) => {
        console.error("[DepositModal] QR generation failed:", qrError);
        if (isCurrent) setQrCodeUrl(null);
      });

    return () => {
      isCurrent = false;
    };
  }, [address, isOpen, mode]);

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

  const selectedBalance = asset === "usdc" ? usdcBalance : rektoBalance;
  const assetLabel = asset.toUpperCase();
  const minimumWithdrawAmount = MIN_WITHDRAW_AMOUNT[asset];
  const solscanUrl = address
    ? `https://solscan.io/account/${address}${getSolscanClusterQuery()}`
    : undefined;

  const handleModeChange = (nextMode: FundsMode) => {
    setMode(nextMode);
    setCopied(false);
    setError(null);
    setTxSignature(null);
    setRecipientAddress("");
    setAmountInput("");
    setAsset("usdc");
  };

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

    if (parsedAmount < minimumWithdrawAmount) {
      setError(`Minimum withdrawal amount is ${minimumWithdrawAmount.toLocaleString()} ${assetLabel}.`);
      return;
    }

    if (selectedBalance !== null && parsedAmount > selectedBalance) {
      setError(`Insufficient ${assetLabel} balance. You have ${selectedBalance.toLocaleString()} ${assetLabel}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const config = ASSET_CONFIG[asset];
      await switchNetwork(activeNetwork);
      const connection = new Connection(getSolanaRpcEndpoint(), "confirmed");
      const mintInfo = await getMint(connection, config.mint);
      const multiplier = 10 ** mintInfo.decimals;
      const tokenAmount = BigInt(Math.round(parsedAmount * multiplier));
      if (tokenAmount <= BigInt(0)) {
        setError(`Amount is below the minimum precision for ${assetLabel}.`);
        return;
      }

      const response = await fetch("/api/tokens/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: address,
          recipient: recipientPubkey.toBase58(),
          asset,
          amount: tokenAmount.toString(),
        }),
      });
      const data = (await response.json()) as {
        serializedTx?: string;
        blockhash?: string;
        lastValidBlockHeight?: number;
        error?: string;
      };
      if (!response.ok || !data.serializedTx || !data.blockhash || !data.lastValidBlockHeight) {
        throw new Error(data.error || "Failed to prepare withdrawal.");
      }

      const tx = Transaction.from(Buffer.from(data.serializedTx, "base64"));
      const signedTx = await walletProvider.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      await connection.confirmTransaction({
        signature,
        blockhash: data.blockhash,
        lastValidBlockHeight: data.lastValidBlockHeight,
      }, "confirmed");

      setTxSignature(signature);
      setAmountInput("");
      setRecipientAddress("");
      await loadBalances(address, true);
    } catch (err: unknown) {
      console.error("[DepositModal] Withdraw failed:", err);
      setError(err instanceof Error ? err.message : "Withdraw failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center sm:items-center sm:px-4 sm:py-4">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={handleClose}
      />
      <section role="dialog" aria-modal="true" aria-labelledby="funds-modal-title" className="relative z-10 mx-2 mt-16 flex h-[calc(100dvh-9rem)] w-full max-w-md flex-col overflow-hidden border-2 border-black bg-[#fff8f4] sm:mx-0 sm:mt-0 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-lg">
        {/* Header */}
        <div className="shrink-0 border-b-2 border-black bg-white/70 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#f0cdbc] bg-[#ffe8db] text-[#e85a2d]">
                {mode === "deposit" ? (
                  <ArrowDownToLine className="h-5 w-5" strokeWidth={2.6} />
                ) : (
                  <ArrowUpFromLine className="h-5 w-5" strokeWidth={2.6} />
                )}
              </div>
              <div className="min-w-0">
                <h2 id="funds-modal-title" className="truncate text-lg font-black text-gray-950">
                  {mode === "deposit" ? "Deposit Funds" : "Withdraw Funds"}
                </h2>
                <p className="text-xs font-semibold text-[#7c6a60]">Solana · {assetLabel}</p>
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

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          {!isConnected && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-bold text-red-700">Connect your wallet to continue.</p>
            </div>
          )}

          {/* Mode Tabs */}
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

          {/* Asset overview */}
          <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-3">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Current assets</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-md border border-[#dce7f7] bg-[#f5f9ff] p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Icons/usdc.png" alt="" className="h-8 w-8" />
                <div className="min-w-0"><p className="text-xs font-bold text-gray-500">USDC</p><p className="truncate font-black text-gray-950" title={usdcBalance?.toLocaleString()}>{formatAssetBalance(usdcBalance)}</p></div>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-[#f0dca1] bg-[#fffbea] p-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/fav_old.png" alt="REKTO" className="h-8 w-8 rounded-full object-cover" />
                <div className="min-w-0"><p className="text-xs font-bold text-gray-500">REKTO</p><p className="truncate font-black text-gray-950" title={rektoBalance?.toLocaleString()}>{formatAssetBalance(rektoBalance)}</p></div>
              </div>
            </div>
          </div>

          {/* Network and asset selectors */}
          <div className="mb-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <label className="block text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">
              Network
              <div className="relative mt-2">
                <select disabled className="h-11 w-full appearance-none rounded-md border border-[#d7c5ba] bg-white px-3 pr-8 text-sm font-bold normal-case tracking-normal text-gray-900 disabled:opacity-100">
                  <option>Solana</option>
                </select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4" />
              </div>
            </label>
            <label className="block text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">
              Asset
              <div className="relative mt-2">
                <select value={asset} onChange={(event) => { setAsset(event.target.value as Asset); setAmountInput(""); setError(null); }} className="h-11 w-full cursor-pointer appearance-none rounded-md border border-[#d7c5ba] bg-white px-3 pr-8 text-sm font-bold normal-case tracking-normal text-gray-900 focus:border-[#e85a2d] focus:outline-none">
                  <option value="usdc">USDC</option><option value="rekto">REKTO</option>
                </select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4" />
              </div>
            </label>
          </div>

          {/* Deposit Mode */}
          {mode === "deposit" ? (
            <>
              {/* <div className="mb-4 rounded-lg border border-[#f0cdbc] bg-[#fff1e8] p-3">
                <p className="text-sm font-bold text-[#5c4035]">
                  Send only {assetLabel} on Solana to this address. Other assets or networks may be lost.
                </p>
              </div> */}

              {address && (
                <div className="mb-4 flex justify-center">
                  <div className="relative overflow-hidden rounded-2xl border-2 border-gray-900 bg-white p-2 shadow-[4px_4px_0_#111827]">
                    {qrCodeUrl ? (
                      // Generated from the connected Solana address returned by Reown AppKit.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrCodeUrl}
                        alt="QR code for your Solana deposit address"
                        className="h-[min(14rem,58vw)] w-[min(14rem,58vw)]"
                      />
                    ) : (
                      <div className="flex h-[min(14rem,58vw)] w-[min(14rem,58vw)] items-center justify-center text-sm font-bold text-gray-500">
                        Generating QR code…
                      </div>
                    )}
                    {qrCodeUrl && (
                      <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border-4 border-white bg-[#2775ca] shadow-sm">
                        {asset === "usdc" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src="/Icons/usdc.png" alt="" className="h-7 w-7" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src="/fav_old.png" alt="REKTO" className="h-7 w-7 rounded-lg object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">
                  Wallet Address
                </p>
                <div className="flex items-center gap-2 rounded-md border border-[#ead7cc] bg-[#fffaf7] p-2">
                  <p className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-gray-800">
                    {address ? address.substring(0, 8) + "..." + address.substring(32) : "Not connected"}
                  </p>
                  <a
                    href={solscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View wallet address on Solscan"
                    title="View on Solscan"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d7c5ba] bg-white text-gray-700 transition hover:border-[#111827] hover:bg-[#f5d547] ${address ? "cursor-pointer" : "pointer-events-none cursor-not-allowed opacity-50"
                      }`}
                  >
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
                  </a>
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!address}
                    aria-label="Copy wallet address"
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#d7c5ba] bg-white text-gray-700 transition hover:border-[#111827] hover:bg-[#f5d547] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" strokeWidth={2.8} />
                    ) : (
                      <Copy className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Recipient Address */}
              <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">
                  Recipient Solana Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Enter destination wallet address"
                  disabled={!isConnected}
                  className="w-full rounded-md border border-[#d7c5ba] bg-[#fffaf7] px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-500 focus:border-[#e85a2d] focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/15 disabled:opacity-50"
                />
              </div>

              {/* Amount */}
              <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">
                    Amount ({assetLabel})
                  </label>
                  {selectedBalance !== null && selectedBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmountInput(String(selectedBalance))}
                      className="cursor-pointer text-xs font-black text-[#e85a2d] hover:text-gray-950"
                    >
                      Max
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  min={minimumWithdrawAmount}
                  step="0.000001"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  disabled={!isConnected}
                  className="w-full rounded-md border border-[#d7c5ba] bg-[#fffaf7] px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-500 focus:border-[#e85a2d] focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/15 disabled:opacity-50"
                />
                <p className="mt-2 text-xs font-semibold text-[#7c6a60]">
                  Minimum withdrawal: {minimumWithdrawAmount.toLocaleString()} {assetLabel}
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              {/* Success */}
              {txSignature && (
                <p className="mb-3 break-all rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
                  ✓ Transaction sent:{" "}
                  <a
                    href={`https://solscan.io/tx/${txSignature}${getSolscanClusterQuery()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-pointer underline"
                  >
                    View on explorer
                  </a>
                </p>
              )}

              {/* Withdraw Button */}
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={isSubmitting || !isConnected}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-gray-900 py-3 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-500"
              >
                <ArrowUpFromLine className="h-4 w-4" strokeWidth={2.6} />
                {isSubmitting ? "Processing..." : `Withdraw ${assetLabel}`}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
