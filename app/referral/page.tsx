"use client";

import { useState } from "react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import {
    Sparkles,
    HandHeart,
    Trophy,
    Skull,
    Copy,
    MessageCircle,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Crown,
    Gem,
    Gift,
    CheckCircle,
    Users,
    Coins,
    Share2,
    Lock,
} from "lucide-react";

// Custom social icons
const FacebookIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const TwitterIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

// Mock data for leaderboard
const leaderboardData = [
    {
        rank: 1,
        player: "TraderX",
        avatar: "/scribbles/pepe.png",
        flag: "🇺🇸",
        joined: "Jun 2023",
        referrals: "8.9k",
        points: 840,
        earnings: "128.4 SOL",
    },
    {
        rank: 2,
        player: "CryptoNinja",
        avatar: "/scribbles/shiba.png",
        flag: "🇰🇷",
        joined: "Jan 2024",
        referrals: "7.6k",
        points: 675,
        earnings: "116.2 SOL",
    },
    {
        rank: 3,
        player: "WhaleWatcher",
        avatar: "/scribbles/doge.png",
        flag: "🇯🇵",
        joined: "Mar 2023",
        referrals: "6.2k",
        points: 590,
        earnings: "98.7 SOL",
    },
    {
        rank: 4,
        player: "MoonHunter",
        avatar: "/scribbles/pengu.png",
        flag: "🇬🇧",
        joined: "Aug 2023",
        referrals: "5.1k",
        points: 445,
        earnings: "76.3 SOL",
    },
    {
        rank: 5,
        player: "DiamondHands",
        avatar: "/scribbles/btc.png",
        flag: "🇨🇦",
        joined: "Dec 2023",
        referrals: "4.3k",
        points: 380,
        earnings: "62.1 SOL",
    },
];

export default function ReferralPage() {
    const { authenticated, login } = usePrivy();
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"wins" | "rekts">("wins");
    const [searchQuery, setSearchQuery] = useState("");
    const [referralCode, setReferralCode] = useState("");
    const [isRedeemed, setIsRedeemed] = useState(false);
    const [redeemError, setRedeemError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSharePopup, setShowSharePopup] = useState(false);

    const referralLink = "rekto.fun/?ref=UQKDn6e6";

    const handleRedeem = () => {
        if (!referralCode.trim()) {
            setRedeemError("Please enter a referral code");
            return;
        }
        // Mock redemption - in real app this would validate with backend
        setIsRedeemed(true);
        setShowSuccess(true);
        setRedeemError("");
        setTimeout(() => setShowSuccess(false), 3000);
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

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
        if (rank === 2) return <Gem className="w-5 h-5 text-slate-400" />;
        if (rank === 3) return <Gem className="w-5 h-5 text-amber-700" />;
        return <span className="text-gray-500 font-medium">{rank}</span>;
    };

    return (
        <div className="min-h-full" style={{ backgroundColor: "#f3e1d7" }}>
            {/* Top Section - Refer & Earn */}
            <section className="px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-2">
                        <Sparkles className="w-8 h-8 text-amber-600 mt-1" />
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Refer & Earn REKT POINTS
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg mb-8 ml-11">
                        Invite friends to Rekto.fun and earn REKT POINTS by competing challenges.
                    </p>

                    <div className="flex flex-col xl:flex-row gap-6">
                        {/* Left Side - Cards and Referral Link */}
                        <div className="flex-1 space-y-6">
                            {/* Three Info Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Refer Friends Card */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/50 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <HandHeart className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Refer Friends</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Get <span className="font-semibold text-gray-900">100 REKT POINTS</span> for every
                                        friend you invite when they sign
                                    </p>
                                </div>

                                {/* Win Challenges Card */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/50 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Trophy className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Win Challenges</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Earn <span className="font-semibold text-gray-900">20 REKT POINTS</span> for every
                                        challenge you win.
                                    </p>
                                </div>

                                {/* Get Rekt Card */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/50 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Skull className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Get Rekt!</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Even if you lose, you still receive{" "}
                                        <span className="font-semibold text-gray-900">10 REKT POINTS</span>.
                                    </p>
                                </div>
                            </div>

                            {/* Referral Link Section - Only for authenticated users */}
                            {authenticated ? (
                                <>
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
                                                Get <span className="font-semibold text-gray-900">100 REKT POINTS</span> for each friend who signs up using your link!
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
                                                    <p className="text-xs text-gray-600 mt-0.5">Share it with your friends and get REKT POINTS!</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Redeem Referral Code Section */}
                                        <div className="mt-4">
                                            {!isRedeemed ? (
                                                <div className="bg-white/60 rounded-xl p-4 border border-white/50">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Gift className="w-5 h-5 text-gray-600" />
                                                        <span className="font-semibold text-gray-900">Redeem Referral Code</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-3">
                                                        Get <span className="font-semibold text-gray-900">50 REKT POINTS</span> for using a referral code!
                                                    </p>
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Enter referral code"
                                                            value={referralCode}
                                                            onChange={(e) => {
                                                                setReferralCode(e.target.value.toUpperCase());
                                                                setRedeemError("");
                                                            }}
                                                            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent uppercase"
                                                            maxLength={10}
                                                        />
                                                        <button
                                                            onClick={handleRedeem}
                                                            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-sm transition-all active:scale-95"
                                                        >
                                                            Redeem
                                                        </button>
                                                    </div>
                                                    {redeemError && (
                                                        <p className="text-red-500 text-xs mt-2">{redeemError}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-white/60 rounded-xl p-4 border border-white/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <CheckCircle className="w-5 h-5 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">Code Redeemed!</p>
                                                            <p className="text-sm text-gray-600">
                                                                You received <span className="font-semibold text-gray-900">50 REKT POINTS</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 p-2 bg-white/60 rounded-lg">
                                                        <p className="text-xs text-gray-500">Redeemed code: <span className="font-mono font-medium text-gray-700">{referralCode}</span></p>
                                                        <p className="text-xs text-gray-400 mt-1">This code cannot be changed once redeemed.</p>
                                                    </div>
                                                </div>
                                            )}
                                            {showSuccess && (
                                                <div className="mt-3 p-3 bg-gray-100 border border-gray-300 rounded-lg flex items-center gap-2 animate-pulse">
                                                    <CheckCircle className="w-4 h-4 text-gray-600" />
                                                    <span className="text-sm font-medium text-gray-800">Successfully redeemed! +50 points added!</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Login Prompt for unauthenticated users */
                                <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/50">
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                            <Lock className="w-8 h-8 text-gray-500" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Login to Access Referral</h3>
                                        <p className="text-gray-600 mb-6 max-w-sm">
                                            Sign in or create an account to access your referral link and start earning REKT POINTS!
                                        </p>
                                        <button
                                            onClick={login}
                                            className="px-8 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                                        >
                                            Login to Get Started
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side - User Referral Stats */}
                        <div className="xl:w-80 flex flex-col gap-4">
                            {/* User Stats Card */}
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/50 shadow-sm">
                                <h3 className="font-semibold text-gray-900 mb-4">Your Referral Stats</h3>

                                {/* Total Referrals */}
                                <div className="mb-4 p-4 bg-white/40 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Friends Referred</p>
                                            <p className="text-2xl font-bold text-gray-900">12</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Points */}
                                <div className="p-4 bg-white/40 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                            <Coins className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Your REKT POINTS</p>
                                            <p className="text-2xl font-bold text-gray-900">1,250</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">+50 from referrals this week</p>
                                </div>
                            </div>

                            {/* Quick Tip Card */}
                            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/50">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm">Pro Tip</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Share your referral link on social media to maximize your earnings. Each friend brings you 100 points!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Below Section - Leaderboard Table */}
            <section className="px-4 sm:px-6 lg:px-8 xl:px-12 pb-12">
                <div className="max-w-7xl mx-auto">
                    {/* Leaderboard Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-gray-600" />
                            <h2 className="text-xl font-bold text-gray-900">Referral Leaderboard</h2>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Search - Bigger */}
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search traders..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-white/60 border border-white/50 rounded-lg text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 w-full sm:w-64"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard Table - Horizontally Scrollable */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            {/* Table Header */}
                            <div className="min-w-[700px] grid grid-cols-12 gap-4 px-4 lg:px-6 py-4 border-b border-white/50 text-sm font-medium text-gray-500">
                                <div className="col-span-1">Rank</div>
                                <div className="col-span-3">Player</div>
                                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                                    Joined
                                    <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                                </div>
                                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                                    Referrals
                                    <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                                </div>
                                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                                    Points
                                    <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                                </div>
                                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                                    Earnings
                                    <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="min-w-[700px] divide-y divide-white/50">
                                {leaderboardData.map((user) => (
                                    <div
                                        key={user.rank}
                                        className="grid grid-cols-12 gap-4 px-4 lg:px-6 py-4 items-center hover:bg-white/30 transition-colors"
                                    >
                                        {/* Rank */}
                                        <div className="col-span-1 flex items-center gap-2">
                                            {getRankIcon(user.rank)}
                                        </div>

                                        {/* Player */}
                                        <div className="col-span-3 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                                <Image
                                                    src={user.avatar}
                                                    alt={user.player}
                                                    width={40}
                                                    height={40}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="font-medium text-gray-900 truncate">{user.player}</span>
                                                <span className="text-lg flex-shrink-0">{user.flag}</span>
                                            </div>
                                        </div>

                                        {/* Joined */}
                                        <div className="col-span-2 text-gray-600 text-sm">{user.joined}</div>

                                        {/* Referrals */}
                                        <div className="col-span-2 text-gray-900 font-medium text-sm">{user.referrals}</div>

                                        {/* REKT POINTS */}
                                        <div className="col-span-2 text-gray-900 font-medium text-sm">{user.points}</div>

                                        {/* Earnings */}
                                        <div className="col-span-2 text-gray-900 font-medium text-sm">{user.earnings}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end gap-2 mt-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
