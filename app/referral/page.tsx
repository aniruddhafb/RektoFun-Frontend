"use client";

import { useState } from "react";
import Image from "next/image";
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
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"wins" | "rekts">("wins");
    const [searchQuery, setSearchQuery] = useState("");

    const referralLink = "rekto.fun/?ref=UQKDn6e6";

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
                            Refer & Earn Rekt Points
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg mb-8 ml-11">
                        Invite friends to Rekto.fun and earn Rekt Points by completing challenges.
                    </p>

                    <div className="flex flex-col xl:flex-row gap-6">
                        {/* Left Side - Cards and Referral Link */}
                        <div className="flex-1 space-y-6">
                            {/* Three Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Refer Friends Card */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                            <HandHeart className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Refer Friends</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Get <span className="font-semibold text-gray-900">100 Rekt Points</span> for every
                                        friend you invite when they sign
                                    </p>
                                </div>

                                {/* Win Challenges Card */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                            <Trophy className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Win Challenges</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Earn <span className="font-semibold text-gray-900">20 Rekt Points</span> for every
                                        challenge you win.
                                    </p>
                                </div>

                                {/* Get Rekt Card */}
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                            <Skull className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Get Rekt!</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Even if you lose, you still receive{" "}
                                        <span className="font-semibold text-gray-900">10 Rekt Points</span>.
                                    </p>
                                </div>
                            </div>

                            {/* Referral Link Section */}
                            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    {/* Link Input */}
                                    <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm w-full">
                                        <span className="text-gray-600 font-medium">{referralLink}</span>
                                        <button
                                            onClick={handleCopy}
                                            className="ml-auto px-4 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-medium text-sm transition-colors"
                                        >
                                            {copied ? "Copied!" : "Copy"}
                                        </button>
                                    </div>

                                    {/* Social Share Buttons */}
                                    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 shadow-sm">
                                        <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <FacebookIcon />
                                        </button>
                                        <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors">
                                            <TwitterIcon />
                                        </button>
                                        <button className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <MessageCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Invite Button */}
                                <div className="mt-4 flex justify-center">
                                    <button className="px-8 py-3 bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-400 hover:to-amber-500 text-amber-900 font-bold rounded-full shadow-lg border-2 border-amber-500/30 transition-all transform hover:scale-105 active:scale-95">
                                        INVITE FRIENDS
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Image and Stats Card */}
                        <div className="xl:w-80 flex flex-col gap-4">
                            {/* Penguin Image */}
                            <div className="relative">
                                <Image
                                    src="/scribbles/pengu.png"
                                    alt="Penguin with Bitcoin"
                                    width={300}
                                    height={250}
                                    className="w-full h-auto object-contain scribble-pengu"
                                />
                            </div>

                            {/* Referral Leaderboard Card */}
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-sm">
                                <h3 className="font-semibold text-gray-900 mb-3">Referral Leaderboard</h3>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">🔥</span>
                                    <span className="text-2xl font-bold text-gray-900">54,320</span>
                                    <span className="text-gray-600">Rekt Points</span>
                                </div>
                                <p className="text-gray-500 text-sm">+135 this week</p>
                                <button className="mt-4 w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 shadow-sm transition-colors flex items-center justify-center gap-2">
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>View Leaderboard</span>
                                </button>
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
                            <Sparkles className="w-6 h-6 text-amber-600" />
                            <h2 className="text-xl font-bold text-gray-900">Referral Leaderboard</h2>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-full border border-white/50">
                                <span className="text-amber-600">👥</span>
                                <span className="text-sm font-medium text-gray-700">178.5K Referred by Players</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Tabs */}
                            <div className="flex bg-white/60 rounded-lg p-1 border border-white/50">
                                <button
                                    onClick={() => setActiveTab("wins")}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "wins"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    Wins
                                </button>
                                <button
                                    onClick={() => setActiveTab("rekts")}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "rekts"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    Rekts
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search traders"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-1.5 bg-white/60 border border-white/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-300 w-40"
                                />
                            </div>

                            {/* Filter Button */}
                            <button className="p-2 bg-white/60 border border-white/50 rounded-lg text-gray-600 hover:text-gray-900 transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/50 text-sm font-medium text-gray-500">
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
                                Rekto Points
                                <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                            </div>
                            <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                                Earnings
                                <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-white/50">
                            {leaderboardData.map((user) => (
                                <div
                                    key={user.rank}
                                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/30 transition-colors"
                                >
                                    {/* Rank */}
                                    <div className="col-span-1 flex items-center gap-2">
                                        {getRankIcon(user.rank)}
                                    </div>

                                    {/* Player */}
                                    <div className="col-span-3 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm">
                                            <Image
                                                src={user.avatar}
                                                alt={user.player}
                                                width={40}
                                                height={40}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{user.player}</span>
                                            <span className="text-lg">{user.flag}</span>
                                        </div>
                                    </div>

                                    {/* Joined */}
                                    <div className="col-span-2 text-gray-600">{user.joined}</div>

                                    {/* Referrals */}
                                    <div className="col-span-2 text-gray-900 font-medium">{user.referrals}</div>

                                    {/* Rekto Points */}
                                    <div className="col-span-2 text-gray-900 font-medium">{user.points}</div>

                                    {/* Earnings */}
                                    <div className="col-span-2 text-gray-900 font-medium">{user.earnings}</div>
                                </div>
                            ))}
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
