"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Check, Copy, Crown, Gift, Loader2, Medal, Sparkles, Trophy, Users, X } from "lucide-react";
import { acceptReferral, getLeaderboard, getUserByWallet, type LeaderboardUser, type User } from "@/app/lib/users-service/users";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

type ReferralModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type LeaderboardRow = {
  id: string;
  name: string;
  walletAddress: string;
  referrals: number;
};

const TOP_REFERRERS_LIMIT = 10;

function getDisplayName(user: LeaderboardUser) {
  if (user.username) return user.username;
  const wallet = user.wallet_address || user.pubkey || "";
  return wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "Anonymous";
}

function formatUsdc(value?: number | null) {
  return `$${(value ?? 0).toFixed(2)}`;
}

export function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  const [user, setUser] = useState<User | null>(null);
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useBodyScrollLock(isOpen);

  const referralLink = useMemo(() => {
    const code = user?.referral_code;
    if (!code) return "https://rekto.fun/";
    return `https://rekto.fun/?ref=${code}`;
  }, [user?.referral_code]);

  const referralsCount = user?.referrals?.length ?? 0;
  const totalEarned = user?.earnings ?? 0;
  const isInitialUserLoading = isConnected && isLoadingUser && !user;
  const referralRate = user?.user_type === "moderator" ? 40 : 25;

  const loadUser = useCallback(async () => {
    if (!isOpen || !isConnected || !address) {
      setUser(null);
      setError(null);
      return;
    }

    try {
      setIsLoadingUser(true);
      setError(null);
      const nextUser = await getUserByWallet(address);
      setUser(nextUser);
    } catch (loadError) {
      console.error("[ReferralModal] Failed to load referral user:", loadError);
      setUser(null);
      setError("We couldn't load your referral link. Please try again.");
    } finally {
      setIsLoadingUser(false);
    }
  }, [address, isConnected, isOpen]);

  const loadLeaderboard = useCallback(async () => {
    if (!isOpen || !showLeaderboard) return;

    try {
      setIsLoadingLeaderboard(true);
      const response = await getLeaderboard(TOP_REFERRERS_LIMIT, 0);
      const rows = response.users
        .map((leaderboardUser) => ({
          id: leaderboardUser.id,
          name: getDisplayName(leaderboardUser),
          walletAddress: leaderboardUser.wallet_address || leaderboardUser.pubkey,
          referrals: leaderboardUser.referrals?.length ?? 0,
        }))
        .sort((a, b) => b.referrals - a.referrals);

      setLeaderboardRows(rows);
    } catch (loadError) {
      console.error("[ReferralModal] Failed to load referral leaderboard:", loadError);
      setLeaderboardRows([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [isOpen, showLeaderboard]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadUser();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUser]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadLeaderboard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) return;

    const timer = window.setTimeout(() => {
      setCopied(false);
      setShowLeaderboard(false);
      setRedeemCode("");
      setRedeemMessage(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleRedeem = async () => {
    const code = redeemCode.trim().toUpperCase();
    if (!address || !code) return;

    try {
      setIsRedeeming(true);
      setRedeemMessage(null);
      const updatedUser = await acceptReferral(address, code);
      setUser(updatedUser);
      setRedeemCode("");
      setRedeemMessage({ type: "success", text: "Referral code redeemed successfully." });
    } catch (redeemError) {
      setRedeemMessage({
        type: "error",
        text: redeemError instanceof Error ? redeemError.message : "Unable to redeem this referral code.",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-4 font-sans sm:py-6">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-lg border-2 border-black bg-[#fff8f4] sm:max-h-[calc(100vh-3rem)]">
        <div className="shrink-0 border-b border-[#ead7cc] bg-[#fff8f4]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black text-gray-950">Refer & Earn</h2>
              <p className="text-xs font-semibold text-[#7c6a60]">Rewards paid in USDC</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close referral modal"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#d7c5ba] bg-white text-gray-700 transition hover:border-black hover:bg-[#ffe8db]"
            >
              <X className="h-5 w-5" strokeWidth={2.8} />
            </button>
          </div>
        </div>

        <div className="referral-modal-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-4 overflow-hidden rounded-lg border border-[#ead7cc] bg-white">
            <div className="flex items-start gap-3 p-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#ffe8db] text-[#e85a2d]">
                <Sparkles className="h-4.5 w-4.5" strokeWidth={2.6} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-gray-950">Earn {referralRate}% of every referred friend&apos;s trading fees.</p>
                {/* <p className="mt-1 text-xs font-semibold leading-5 text-[#7c6a60]">
                  Share your link, keep it simple, and track everything from here.
                </p> */}
              </div>
            </div>
          </div>

          {isInitialUserLoading ? (
            <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-6">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md border border-[#f0cdbc] bg-[#ffe8db] text-[#e85a2d]">
                  <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.6} />
                </div>
                <p className="text-sm font-black text-gray-950">Loading referral dashboard</p>
                <p className="mt-1 text-xs font-semibold text-[#7c6a60]">Fetching your link, earnings, and invite count.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#ead7cc] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Total earned</p>
                  <p className="mt-2 text-2xl font-black text-gray-950">{formatUsdc(totalEarned)}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">USDC rewards</p>
                </div>
                <div className="rounded-lg border border-[#ead7cc] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Invites</p>
                  <p className="mt-2 text-2xl font-black text-gray-950">{referralsCount}</p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">Friends referred</p>
                </div>
              </div>

              {!isConnected ? (
                <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4 text-center">
                  <p className="text-sm font-bold text-gray-700">Connect your wallet to get your invite link.</p>
                  <button
                    type="button"
                    onClick={() => open({ view: "Connect" })}
                    className="mt-3 inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-5 text-sm font-black text-white transition hover:bg-gray-800"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Your invite link</p>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">{referralRate}% fees</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-[#ead7cc] bg-[#fffaf7] p-2">
                      <span className="min-w-0 flex-1 truncate px-1 text-sm font-semibold text-gray-800">
                        {isLoadingUser ? "Loading your link..." : referralLink.replace("https://", "")}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        disabled={isLoadingUser || !user?.referral_code}
                        aria-label="Copy referral link"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d7c5ba] bg-white text-gray-700 transition hover:border-[#111827] hover:bg-[#f5d547] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg border border-[#ead7cc] bg-white p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Gift className="h-4 w-4 text-[#e85a2d]" strokeWidth={2.6} />
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#7c6a60]">Redeem a referral code</p>
                    </div>
                    {user?.referred_by ? (
                      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700">
                        <Check className="h-4 w-4 shrink-0" /> Code {user.referred_by} redeemed
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={redeemCode}
                          onChange={(event) => setRedeemCode(event.target.value.toUpperCase())}
                          onKeyDown={(event) => event.key === "Enter" && handleRedeem()}
                          placeholder="Enter code"
                          aria-label="Referral code"
                          maxLength={32}
                          className="h-10 min-w-0 flex-1 rounded-md border border-[#d7c5ba] bg-[#fffaf7] px-3 text-sm font-black uppercase tracking-wide text-gray-900 outline-none transition placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal focus:border-gray-900 focus:ring-2 focus:ring-[#f5d547]/50"
                        />
                        <button type="button" onClick={handleRedeem} disabled={!redeemCode.trim() || isRedeeming} className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-4 text-sm font-black text-white transition hover:bg-[#e85a2d] disabled:cursor-not-allowed disabled:opacity-50">
                          {isRedeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redeem"}
                        </button>
                      </div>
                    )}
                    {redeemMessage && <p className={`mt-2 text-xs font-bold ${redeemMessage.type === "success" ? "text-emerald-700" : "text-red-600"}`}>{redeemMessage.text}</p>}
                  </div>

                  {error && <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
                </>
              )}
            </>
          )}

          <div className="flex items-center justify-between gap-4 rounded-lg border border-[#e2c8ba] bg-gradient-to-r from-white to-[#fff0e8] p-4 shadow-[0_3px_0_#ead7cc]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[#f0cdbc] bg-[#ffe8db] text-[#e85a2d]">
                <Trophy className="h-4.5 w-4.5" strokeWidth={2.6} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-950">Show leaderboard</p>
                <p className="text-xs font-semibold text-[#7c6a60]">Top 10 referrers</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLeaderboard((value) => !value)}
              aria-pressed={showLeaderboard}
              aria-label="Toggle referral leaderboard"
              className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#f5d547] focus:ring-offset-2 ${showLeaderboard ? "border-[#e85a2d] bg-[#e85a2d]" : "border-[#9b887d] bg-[#eadfd8]"}`}
            >
              <span className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white shadow-md transition-all ${showLeaderboard ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

          {showLeaderboard && (
            <div className="mt-3 overflow-hidden rounded-xl border border-[#e2c8ba] bg-white shadow-[0_5px_0_#ead7cc]">
              <div className="flex items-center justify-between bg-gradient-to-r from-[#1f1720] to-[#3d2930] px-4 py-3 text-white">
                <div><p className="text-sm font-black">Referral champions</p><p className="text-[11px] font-semibold text-white/65">Most successful community builders</p></div>
                <Crown className="h-5 w-5 text-[#f5d547]" fill="currentColor" />
              </div>
              {isLoadingLeaderboard ? (
                <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm font-bold text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading leaders
                </div>
              ) : leaderboardRows.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm font-bold text-gray-500">No referrals yet.</div>
              ) : (
                <div className="referral-leaderboard-scrollbar max-h-64 overflow-y-auto divide-y divide-[#ead7cc]">
                  {leaderboardRows.map((row, index) => (
                    <Link
                      key={row.id}
                      href={row.walletAddress ? `/profile/${row.walletAddress}` : "#"}
                      onClick={onClose}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#fffaf7] focus:bg-[#fffaf7] focus:outline-none"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${index === 0 ? "bg-[#f5d547] text-gray-950 shadow-sm" : index === 1 ? "bg-slate-200 text-slate-700" : index === 2 ? "bg-orange-100 text-orange-700" : "border border-[#ead7cc] bg-[#fff8f4] text-gray-700"}`}>
                          {index < 3 ? <Medal className="h-4 w-4" /> : index + 1}
                        </span>
                        <span className="truncate text-sm font-black text-gray-900 underline-offset-4 hover:underline">{row.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                        <Users className="h-3.5 w-3.5" />
                        {row.referrals}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* <p className="mt-4 text-center text-xs font-semibold leading-5 text-black">
            Invite friends to start earning 25% of their trading fees.
          </p> */}
        </div>
      </div>
      <style jsx global>{`
        .referral-modal-scrollbar,
        .referral-leaderboard-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d7c5ba transparent;
        }

        .referral-modal-scrollbar::-webkit-scrollbar,
        .referral-leaderboard-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .referral-modal-scrollbar::-webkit-scrollbar-track,
        .referral-leaderboard-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .referral-modal-scrollbar::-webkit-scrollbar-thumb,
        .referral-leaderboard-scrollbar::-webkit-scrollbar-thumb {
          background: #d7c5ba;
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}
