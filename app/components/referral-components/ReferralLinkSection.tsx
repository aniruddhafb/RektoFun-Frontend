"use client";

import { useState } from "react";
import { CheckCircle, Copy, Gift, Link2, Loader2, Share2 } from "lucide-react";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import { acceptReferral } from "@/app/lib/users-service/users";

interface ReferralLinkSectionProps {
    referralLink: string;
    referralCode: string;
    referredBy: string | null;
    onRedeemSuccess?: () => void;
}

export function ReferralLinkSection({
    referralLink,
    referralCode,
    referredBy,
    onRedeemSuccess
}: ReferralLinkSectionProps) {
    const [copied, setCopied] = useState(false);
    const [redeemCode, setRedeemCode] = useState("");
    const [redeemError, setRedeemError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [isRedeeming, setIsRedeeming] = useState(false);

    const { publicKey } = useSolanaWallet();
    const walletAddress = publicKey?.toBase58() ?? null;

    const handleRedeem = async () => {
        if (!redeemCode.trim()) {
            setRedeemError("Please enter a referral code");
            return;
        }

        if (redeemCode.trim() === referralCode) {
            setRedeemError("You cannot redeem your own referral code");
            return;
        }

        if (!walletAddress) {
            setRedeemError("Please connect your wallet first");
            return;
        }

        setIsRedeeming(true);
        setRedeemError("");

        try {
            await acceptReferral(walletAddress, redeemCode.trim());
            setShowSuccess(true);
            setRedeemCode("");
            setTimeout(() => {
                setShowSuccess(false);
                if (onRedeemSuccess) onRedeemSuccess();
            }, 3000);
        } catch (error: unknown) {
            console.error('[ReferralLinkSection] Failed to redeem referral:', error);
            setRedeemError(error instanceof Error ? error.message : "Failed to redeem referral code");
        } finally {
            setIsRedeeming(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(referralLink);
        setShowSharePopup(true);
        setTimeout(() => setShowSharePopup(false), 4000);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="referral-hover-shadow rounded-lg border border-black/10 bg-white/80 p-4 shadow-none backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-black sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-gray-500">
                        <Link2 className="h-4 w-4" />
                        Your invite link
                    </div>
                    <h2 className="text-xl font-black text-gray-950">Share this link to start earning</h2>
                    <p className="mt-1 text-sm font-medium text-gray-600">
                        Anyone who joins with this link is counted toward your referral rewards.
                    </p>
                </div>
                <div className="rounded-full bg-gray-950 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                    Code: {referralCode || "..."}
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="referral-hover-shadow flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-black/10 bg-[#fffaf6] px-4 py-3 shadow-none transition-all duration-200 hover:border-black">
                    <span className="truncate text-sm font-semibold text-gray-700 sm:text-base">{referralLink}</span>
                    <button
                        onClick={handleCopy}
                        className="ml-auto inline-flex h-9 flex-shrink-0 items-center gap-2 rounded-lg bg-gray-950 px-3 text-sm font-black text-white transition-colors hover:bg-gray-800"
                    >
                        {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                </div>
                <button
                    onClick={handleShare}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-black bg-white px-5 text-sm font-black text-gray-950 transition-all hover:bg-gray-950 hover:text-white active:scale-95"
                >
                    <Share2 className="h-4 w-4" />
                    Share
                </button>
            </div>

            {/* Share Popup */}
            {showSharePopup && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                    <div>
                        <p className="text-sm font-black text-emerald-900">Referral link copied</p>
                        <p className="mt-0.5 text-xs font-medium text-emerald-800">Paste it wherever you want to invite friends.</p>
                    </div>
                </div>
            )}

            {/* Redeem Referral Code Section - Only show if not already referred */}
            <div className="mt-4">
                {referredBy ? (
                    <div className="referral-hover-shadow rounded-lg border border-black/10 bg-[#fffaf6] p-4 shadow-none transition-all duration-200 hover:border-black">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-black text-gray-950">Referral code already redeemed</p>
                                {/* <p className="text-sm text-gray-600">
                                    You used referral code: <span className="font-mono font-medium text-gray-900">{referralCode}</span>
                                </p> */}
                            </div>
                        </div>
                        <div className="mt-3 rounded-lg bg-white p-2">
                            <p className="text-xs font-medium text-gray-500">This reward was applied when you signed up.</p>
                        </div>
                    </div>
                ) : (
                    <div className="referral-hover-shadow rounded-lg border border-black/10 bg-[#fffaf6] p-4 shadow-none transition-all duration-200 hover:border-black">
                        <div className="mb-3 flex items-start gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-amber-700 ring-1 ring-black/10">
                                <Gift className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-black text-gray-950">Have a friend&apos;s code?</p>
                                <p className="mt-1 text-sm font-medium text-gray-600">Redeem it here before your friend&apos;s referral is applied.</p>
                            </div>
                        </div>
                        {/* <p className="text-sm text-gray-600 mb-3">
                            Get <span className="font-semibold text-gray-900">50 REKTO points</span> for using a referral code!
                        </p> */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder="Enter referral code"
                                value={redeemCode}
                                onChange={(e) => {
                                    setRedeemCode(e.target.value);
                                    setRedeemError("");
                                }}
                                className="h-11 flex-1 rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold uppercase text-gray-900 placeholder:normal-case placeholder:font-medium placeholder:text-gray-400 focus:border-gray-950 focus:outline-none focus:ring-4 focus:ring-amber-500/15"
                                maxLength={10}
                            />
                            <button
                                onClick={handleRedeem}
                                disabled={isRedeeming}
                                className="inline-flex h-11 min-w-[112px] items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 text-sm font-black text-white shadow-none transition-all hover:bg-gray-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                                {isRedeeming ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Redeeming...
                                    </>
                                ) : (
                                    "Redeem"
                                )}
                            </button>
                        </div>
                        {redeemError && (
                            <p className="mt-2 text-xs font-semibold text-red-600">{redeemError}</p>
                        )}
                    </div>
                )}
                {showSuccess && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                        <CheckCircle className="h-4 w-4 text-emerald-700" />
                        <span className="text-sm font-black text-emerald-900">Referral code accepted.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
