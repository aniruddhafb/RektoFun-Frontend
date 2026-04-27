"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAccounts } from "@phantom/react-sdk";

export default function AuthCallbackPage() {
  const router = useRouter();
  const accounts = useAccounts();
  const walletAddress = accounts?.[0]?.address;
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  useEffect(() => {
    if (!walletAddress) return;

    router.replace(`/profile/${encodeURIComponent(walletAddress)}`);
  }, [router, walletAddress]);

  return (
    <div className="min-h-screen bg-[#f3e1d7] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(212,165,116,0.35),_transparent_35%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/50 p-6 shadow-[0_24px_80px_rgba(45,31,26,0.12)] backdrop-blur-md sm:p-8">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/logos/mainlogo.png"
              alt="RektoFun"
              width={220}
              height={60}
              className="h-10 w-auto"
              priority
            />

            <div className="mt-8 flex items-center gap-3 rounded-full border border-[#d4a574]/50 bg-[#f8ede7] px-4 py-2 text-sm text-[#6a4b3a]">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e85a2d]/50" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[#e85a2d]" />
              </span>
              Authenticating your wallet
            </div>

            <h1 className="mt-6 text-2xl font-bold text-[#2d1f1a] sm:text-3xl">
              Preparing your profile
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[#6f5b50] sm:text-base">
              We&apos;re confirming your session and taking you straight to your
              profile page.
            </p>

            <div className="mt-8 w-full">
              <div className="h-3 overflow-hidden rounded-full bg-[#ead6ca]">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-[#e85a2d] via-[#d4a574] to-[#f0c987]" />
              </div>
            </div>

            <div className="mt-6 w-full rounded-2xl border border-[#e3cfc3] bg-[#fffaf7] px-4 py-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a08070]">
                Status
              </p>
              <p className="mt-2 text-sm text-[#4f3b31]">
                {shortAddress
                  ? `Wallet detected: ${shortAddress}. Redirecting now.`
                  : "Waiting for wallet confirmation from Phantom. This should only take a moment."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
