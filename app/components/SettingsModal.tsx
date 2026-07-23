"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ExternalLink, KeyRound, Wallet, X } from "lucide-react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

const REOWN_SECURE_DASHBOARD_URL = "https://secure.walletconnect.org/dashboard";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const formatProvider = (provider?: string) => {
  if (!provider) return "External wallet";
  if (provider === "email") return "Email";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { address, embeddedWalletInfo } = useAppKitAccount();
  const [showExport, setShowExport] = useState(false);
  useBodyScrollLock(isOpen);

  const handleClose = useCallback(() => {
    setShowExport(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && handleClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  const isEmbeddedWallet = Boolean(embeddedWalletInfo);
  const connectionMethod = formatProvider(embeddedWalletInfo?.authProvider);
  const connectedEmail = embeddedWalletInfo?.user?.email;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected";

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-start justify-center overflow-y-auto p-2 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <button type="button" className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm" onClick={handleClose} aria-label="Close settings" />
      <div className="relative z-10 my-1 max-h-[calc(100dvh-0.75rem)] w-full max-w-md touch-pan-y overflow-y-auto overscroll-contain rounded-2xl border border-[#1f2937] bg-[#fff8f4] sm:my-0 sm:max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[#ead7cc] bg-white/60 px-5 py-4">
          {showExport ? (
            <button type="button" onClick={() => setShowExport(false)} aria-label="Back to wallet settings" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#d7c5ba] bg-white text-gray-700 transition hover:border-gray-900 hover:bg-[#ffe8db]">
              <ArrowLeft className="h-4.5 w-4.5" strokeWidth={2.7} />
            </button>
          ) : (
            <div className="h-9 w-9" aria-hidden="true" />
          )}
          <h2 id="settings-modal-title" className="text-lg font-black text-gray-950">
            {showExport ? "Export Your Wallet" : "Wallet Settings"}
          </h2>
          <button type="button" onClick={handleClose} aria-label="Close" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#d7c5ba] bg-white text-gray-700 transition hover:border-gray-900 hover:bg-[#ffe8db]">
            <X className="h-4.5 w-4.5" strokeWidth={2.7} />
          </button>
        </div>

        {showExport ? (
          <div className="p-5 text-center">
            <p className="text-sm font-bold text-gray-800">Follow the instructions on Reown&apos;s secure website</p>
            <a href={REOWN_SECURE_DASHBOARD_URL} target="_blank" rel="noopener noreferrer" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#bde3ce] bg-[#e5f7ed] px-4 py-3 text-sm font-black text-[#087a49] transition hover:border-[#087a49] hover:bg-[#d7f2e3]">
              Open secure.walletconnect.org
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
            <p className="mt-4 text-xs font-semibold text-[#7c6a60]">You will have to reconnect for security reasons.</p>
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-left text-xs font-semibold text-red-700">
              Never share your recovery key. RektoFun will never ask you to paste it here.
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-[#ead7cc] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5d547] text-gray-950"><Wallet className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#7c6a60]">Connected with</p>
                  <p className="font-black text-gray-950">{connectionMethod}</p>
                  {connectedEmail ? <p className="mt-0.5 truncate text-sm font-semibold text-gray-700">{connectedEmail}</p> : null}
                  <p className="mt-0.5 font-mono text-xs text-gray-500">{shortAddress}</p>
                </div>
              </div>
            </div>

            {isEmbeddedWallet ? (
              <button type="button" onClick={() => setShowExport(true)} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-black bg-black px-4 py-3 text-sm font-black text-white transition hover:bg-gray-800">
                <KeyRound className="h-4 w-4" />
                Export wallet keys
              </button>
            ) : (
              <p className="rounded-lg border border-[#ead7cc] bg-white px-3 py-2.5 text-xs font-semibold text-[#7c6a60]">
                Keys for an external wallet are managed by your wallet provider.
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
