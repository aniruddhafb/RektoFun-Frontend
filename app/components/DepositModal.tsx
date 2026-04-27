"use client";

import { useState, useEffect } from "react";
import { useAccounts } from "@phantom/react-sdk";
import QRCode from "qrcode";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const accounts = useAccounts();
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const walletAddress = accounts?.[0]?.address || null;

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    const generateQR = async () => {
      if (walletAddress) {
        try {
          const url = await QRCode.toDataURL(walletAddress, {
            width: 256,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
          });
          setQrCodeUrl(url);
        } catch (err) {
          console.error("Failed to generate QR code:", err);
        }
      } else {
        setQrCodeUrl("");
      }
    };
    generateQR();
  }, [walletAddress]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md mx-4 bg-[#f3e1d7] rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Deposit Funds</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-xs font-semibold text-black text-center mb-4">
            Only deposit USDC on Solana Chain to this address 👇
          </p>

          <div className="bg-white/60 rounded-2xl p-4 mb-4">
            <p className="text-xs font-medium text-black mb-2">YOUR WALLET ADDRESS</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-gray-800 truncate flex-1">
                {walletAddress || "No wallet connected"}
              </p>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 p-2 rounded-full bg-[#f3e1d7] hover:bg-[#e8d4c5] transition-colors"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white/60 rounded-2xl p-4 mb-4">
            <p className="text-xs font-medium text-black mb-2">QR CODE</p>
            <div className="flex justify-center py-4">
              {walletAddress ? (
                qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code for wallet address"
                    className="w-32 h-32 rounded-xl border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-xl border-2 border-gray-200 flex items-center justify-center bg-white">
                    <div className="animate-pulse text-xs text-gray-400">Generating...</div>
                  </div>
                )
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-gray-200 flex items-center justify-center bg-white">
                  <div className="text-xs text-gray-400 text-center">No wallet connected</div>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs font-semibold text-black text-center">
            Only send USDC tokens on solana chain to this address. Other tokens may be lost permanently.
          </p>
        </div>
      </div>
    </div>
  );
}