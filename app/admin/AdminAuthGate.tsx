"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { isAdminWallet } from "@/app/lib/admin";

type SolanaMessageProvider = { signMessage: (message: Uint8Array) => Promise<Uint8Array> };

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<SolanaMessageProvider>("solana");
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const adminConnected = isConnected && isAdminWallet(address);

  const checkSession = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/admin/auth/session", { cache: "no-store" });
      const data = await response.json();
      setAuthenticated(Boolean(data.authenticated && data.address === address));
    } catch {
      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  }, [address]);

  useEffect(() => {
    const timer = window.setTimeout(() => void checkSession(), 0);
    return () => window.clearTimeout(timer);
  }, [checkSession]);

  const authenticate = async () => {
    if (!adminConnected || !address || !walletProvider) return;
    setSigning(true);
    setError("");
    try {
      const nonceResponse = await fetch("/api/admin/auth/nonce", { method: "POST" });
      const nonceData = await nonceResponse.json();
      if (!nonceResponse.ok || !nonceData.message) {
        throw new Error(nonceData.error || "Could not start admin authentication");
      }
      const signature = await walletProvider.signMessage(
        new TextEncoder().encode(nonceData.message),
      );
      const signatureBase64 = btoa(String.fromCharCode(...signature));
      const verifyResponse = await fetch("/api/admin/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message: nonceData.message, signature: signatureBase64 }),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyData.authenticated) {
        throw new Error(verifyData.error || "Admin signature was rejected");
      }
      setAuthenticated(true);
    } catch (authError) {
      setAuthenticated(false);
      setError(authError instanceof Error ? authError.message : "Admin authentication failed");
    } finally {
      setSigning(false);
    }
  };

  if (checking) {
    return <div className="min-h-[70vh] bg-[#f3e1d7]" aria-label="Checking admin session" />;
  }
  if (authenticated && adminConnected) return children;

  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-[#f3e1d7] px-4 py-12 text-[#151515]">
      <section className="w-full max-w-lg border-2 border-black bg-[#fffaf6] p-7 text-center shadow-[6px_6px_0_#111]">
        <ShieldCheck className="mx-auto mb-4 h-12 w-12" />
        <h1 className="text-3xl font-black">Admin verification</h1>
        <p className="mx-auto mt-3 max-w-sm font-semibold text-black/60">
          Connect the configured admin wallet and sign a one-time message to open the control room.
        </p>
        {error && <p className="mt-5 border-2 border-black bg-[#ff8c79] p-3 font-bold">{error}</p>}
        {!isConnected ? (
          <button
            onClick={() => void open()}
            className="mt-6 cursor-pointer border-2 border-black bg-[#f5d547] px-5 py-3 font-black shadow-[3px_3px_0_#111]"
          >
            Connect admin wallet
          </button>
        ) : !adminConnected ? (
          <div className="mt-6">
            <p className="font-black text-[#b72c1f]">The connected wallet is not the admin wallet.</p>
            <button
              onClick={() => void open({ view: "Account" })}
              className="mt-4 cursor-pointer border-2 border-black bg-white px-5 py-3 font-black shadow-[3px_3px_0_#111]"
            >
              Change wallet
            </button>
          </div>
        ) : (
          <button
            onClick={() => void authenticate()}
            disabled={signing}
            className="mt-6 cursor-pointer border-2 border-black bg-[#a8d85b] px-5 py-3 font-black shadow-[3px_3px_0_#111] disabled:opacity-50"
          >
            {signing ? "Waiting for signature…" : "Sign to enter admin panel"}
          </button>
        )}
      </section>
    </div>
  );
}
