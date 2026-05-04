"use client";

import { useState } from "react";
import { Copy, Share2, Gift, CheckCircle, Loader2 } from "lucide-react";
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
        } catch (error: any) {
            console.error('[ReferralLinkSection] Failed to redeem referral:', error);
            setRedeemError(error.message || "Failed to redeem referral code");
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
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/50">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Link Input */}
                <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm w-full">
                    <span className="text-gray-600 font-medium text-sm sm:text-base truncate">{referralLink}</span>
                    <button
                        onClick={handleCopy}
                        className="ml-auto px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium text-sm transition-colors flex-shrink-0"
                    >
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            </div>

            {/* Share Referral Code Section */}
            <div className="mt-4 bg-white/60 rounded-xl p-4 border border-white/50">
                <div className="flex items-center gap-2 mb-3">
                    <Share2 className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Share Your Referral Code</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                    Get <span className="font-semibold text-gray-900">100 REKTO points</span> for each friend who signs up using your link!
                </p>
                <button
                    onClick={handleShare}
                    className="w-full px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Copy className="w-4 h-4" />
                    Share Referral Link
                </button>
            </div>

            {/* Share Popup */}
            {showSharePopup && (
                <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded-lg flex items-start gap-2 animate-pulse">
                    <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-gray-800">Referral link copied!</p>
                        <p className="text-xs text-gray-600 mt-0.5">Share it with your friends and get REKTO points!</p>
                    </div>
                </div>
            )}

            {/* Redeem Referral Code Section - Only show if not already referred */}
            <div className="mt-4">
                {referredBy ? (
                    <div className="bg-white/60 rounded-xl p-4 border border-white/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Referral Code Already Redeemed!</p>
                                {/* <p className="text-sm text-gray-600">
                                    You used referral code: <span className="font-mono font-medium text-gray-900">{referralCode}</span>
                                </p> */}
                            </div>
                        </div>
                        <div className="mt-3 p-2 bg-white/60 rounded-lg">
                            <p className="text-xs text-gray-400">This code was applied when you signed up.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/60 rounded-xl p-4 border border-white/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Gift className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-900">Redeem Referral Code</span>
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
                                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                                maxLength={10}
                            />
                            <button
                                onClick={handleRedeem}
                                disabled={isRedeeming}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-sm transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
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
                            <p className="text-red-500 text-xs mt-2">{redeemError}</p>
                        )}
                    </div>
                )}
                {showSuccess && (
                    <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded-lg flex items-center gap-2 animate-pulse">
                        <CheckCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">Successfully redeemed! Referral code accepted!</span>
                    </div>
                )}
            </div>
        </div>
    );
}