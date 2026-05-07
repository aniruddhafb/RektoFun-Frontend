"use client";

import { useState } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Challenge {
    id: number;
    coin: string;
    coinSymbol: string;
    coinColor: string;
    coinBg: string;
    coinIcon: string;
    category: string;
    title: string;
    creator: string;
    mode: string;
    eventDetails: string;
    pool: string;
    participants: number;
    split: string;
    expiresIn: string;
    expiresMs: number;
    submittedAgo: string;
    market: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const challengesData: Challenge[] = [
    {
        id: 1,
        coin: "IPL",
        coinSymbol: "IPL",
        coinColor: "#1e3a8a",
        coinBg: "#1e3a8a",
        coinIcon: "I",
        category: "Cricket - IPL",
        title: "CSK To Win By 15+ Runs Tonight?",
        creator: "CricketNerd",
        mode: "PVP Mode",
        eventDetails: "In tonight's IPL match, will Chennai Super Kings defeat Mumbai Indians by 15 or more runs?",
        pool: "$850",
        participants: 26,
        split: "13 vs 13",
        expiresIn: "1h 08m",
        expiresMs: 1 * 60 * 60 * 1000 + 8 * 60 * 1000,
        submittedAgo: "36m ago",
        market: "FanDuel",
    },
    {
        id: 2,
        coin: "FIFA",
        coinSymbol: "FIFA",
        coinColor: "#0f766e",
        coinBg: "#0f766e",
        coinIcon: "F",
        category: "FIFA World Cup",
        title: "Brazil To Keep A Clean Sheet?",
        creator: "GoalGuru",
        mode: "Multi Mode",
        eventDetails: "Will Brazil keep a clean sheet in their next FIFA World Cup group-stage match?",
        pool: "$1,420",
        participants: 34,
        split: "19 vs 15",
        expiresIn: "2h 12m",
        expiresMs: 2 * 60 * 60 * 1000 + 12 * 60 * 1000,
        submittedAgo: "1h ago",
        market: "Bet365",
    },
    {
        id: 3,
        coin: "IPL",
        coinSymbol: "IPL",
        coinColor: "#d97706",
        coinBg: "#d97706",
        coinIcon: "I",
        category: "Cricket - IPL",
        title: "Virat Kohli 50+ Runs?",
        creator: "MidwicketMind",
        mode: "PVP Mode",
        eventDetails: "Will Virat Kohli score 50 or more runs in Royal Challengers Bengaluru's next IPL fixture?",
        pool: "$1,050",
        participants: 16,
        split: "8 vs 8",
        expiresIn: "42m 10s",
        expiresMs: 42 * 60 * 1000 + 10 * 1000,
        submittedAgo: "25m ago",
        market: "Dream11",
    },
    {
        id: 4,
        coin: "FIFA",
        coinSymbol: "FIFA",
        coinColor: "#7c3aed",
        coinBg: "#7c3aed",
        coinIcon: "F",
        category: "FIFA World Cup",
        title: "Argentina To Win In 90 Minutes?",
        creator: "CounterAttack",
        mode: "Multi Mode",
        eventDetails: "Will Argentina win their Round of 16 FIFA World Cup match within regular time?",
        pool: "$2,060",
        participants: 28,
        split: "18 vs 10",
        expiresIn: "3h 05m",
        expiresMs: 3 * 60 * 60 * 1000 + 5 * 60 * 1000,
        submittedAgo: "2h ago",
        market: "BetMGM",
    },
    {
        id: 5,
        coin: "IPL",
        coinSymbol: "IPL",
        coinColor: "#be123c",
        coinBg: "#be123c",
        coinIcon: "I",
        category: "Cricket - IPL",
        title: "Total Match Sixes Over 16.5?",
        creator: "PowerplayPro",
        mode: "PVP Mode",
        eventDetails: "In Rajasthan Royals vs Sunrisers Hyderabad, will total sixes scored be over 16.5?",
        pool: "$730",
        participants: 20,
        split: "11 vs 9",
        expiresIn: "1h 34m",
        expiresMs: 1 * 60 * 60 * 1000 + 34 * 60 * 1000,
        submittedAgo: "48m ago",
        market: "FanDuel",
    },
    {
        id: 6,
        coin: "FIFA",
        coinSymbol: "FIFA",
        coinColor: "#0369a1",
        coinBg: "#0369a1",
        coinIcon: "F",
        category: "FIFA World Cup",
        title: "Kylian Mbappe To Score Anytime?",
        creator: "TikiTakaIQ",
        mode: "PVP Mode",
        eventDetails: "Will Kylian Mbappe score at least one goal in France's next FIFA World Cup game?",
        pool: "$1,800",
        participants: 24,
        split: "14 vs 10",
        expiresIn: "2h 48m",
        expiresMs: 2 * 60 * 60 * 1000 + 48 * 60 * 1000,
        submittedAgo: "1h ago",
        market: "Bet365",
    },
    {
        id: 7,
        coin: "IPL",
        coinSymbol: "IPL",
        coinColor: "#166534",
        coinBg: "#166534",
        coinIcon: "I",
        category: "Cricket - IPL",
        title: "KKR Powerplay Score 55+?",
        creator: "SlipCordon",
        mode: "Multi Mode",
        eventDetails: "Will Kolkata Knight Riders score 55 or more runs in the first 6 overs?",
        pool: "$920",
        participants: 18,
        split: "9 vs 9",
        expiresIn: "37m 55s",
        expiresMs: 37 * 60 * 1000 + 55 * 1000,
        submittedAgo: "31m ago",
        market: "Dream11",
    },
    {
        id: 8,
        coin: "FIFA",
        coinSymbol: "FIFA",
        coinColor: "#b45309",
        coinBg: "#b45309",
        coinIcon: "F",
        category: "FIFA World Cup",
        title: "Match To Go Into Extra Time?",
        creator: "FinalWhistle",
        mode: "PVP Mode",
        eventDetails: "Will the FIFA World Cup semifinal between Spain and Germany be level after 90 minutes?",
        pool: "$2,450",
        participants: 22,
        split: "11 vs 11",
        expiresIn: "4h 10m",
        expiresMs: 4 * 60 * 60 * 1000 + 10 * 60 * 1000,
        submittedAgo: "2h ago",
        market: "BetMGM",
    },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ShieldIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
);

const FireIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9zm0 14a3 3 0 01-3-3c0-2 1.5-4 3-5 1.5 1 3 3 3 5a3 3 0 01-3 3z" />
    </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
);

const ChevronDown2 = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// ─── Coin Avatar ──────────────────────────────────────────────────────────────
const CoinAvatar = ({ challenge }: { challenge: Challenge }) => {
    const coinImages: Record<string, string> = {
        IPL: "/scribbles/ipl.png",
        FIFA: "/scribbles/fifa.png",
    };

    const imgSrc = coinImages[challenge.coinSymbol];

    if (imgSrc) {
        return (
            <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/30 shadow-md"
                style={{ backgroundColor: challenge.coinBg }}
            >
                <Image src={imgSrc} alt={challenge.coin} width={48} height={48} className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white/30 shadow-md text-white font-bold text-lg"
            style={{ backgroundColor: challenge.coinBg }}
        >
            {challenge.coinIcon}
        </div>
    );
};

// ─── Timer Component ──────────────────────────────────────────────────────────
const ExpiryTimer = ({ expiresIn, isUrgent }: { expiresIn: string; isUrgent: boolean }) => (
    <div className={`flex items-center gap-1 text-xs font-semibold ${isUrgent ? "text-red-500" : "text-orange-500"}`}>
        <ClockIcon className="w-3.5 h-3.5" />
        <span>Expires in {expiresIn}</span>
    </div>
);

// ─── Challenge Row Card ───────────────────────────────────────────────────────
const ChallengeCard = ({
    challenge,
    onApprove,
    onDeny,
    voted,
}: {
    challenge: Challenge;
    onApprove: (id: number) => void;
    onDeny: (id: number) => void;
    voted: "approve" | "deny" | null;
}) => {
    const isUrgent = challenge.expiresMs < 30 * 60 * 1000;

    return (
        <div className="bg-white/65 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm hover:shadow-md transition-all hover:bg-white/75 overflow-hidden">
            {/* Mobile Layout */}
            <div className="block sm:hidden p-4">
                {/* Top row: coin + title + expiry */}
                <div className="flex items-start gap-3 mb-3">
                    <CoinAvatar challenge={challenge} />
                    <div className="flex-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1"
                            style={{ backgroundColor: "#f3e1d7", color: "#c2410c" }}>
                            {challenge.category}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{challenge.title}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
                                <span className="text-white text-[8px] font-bold">R</span>
                            </div>
                            <span className="text-xs text-gray-500">{challenge.creator}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">{challenge.mode}</span>
                        </div>
                    </div>
                </div>

                {/* Event details */}
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{challenge.eventDetails}</p>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/50 rounded-xl p-2.5">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Pool</p>
                        <p className="text-base font-bold text-green-600">{challenge.pool}</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-2.5">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">Participants</p>
                        <p className="text-base font-bold text-gray-900">{challenge.participants}</p>
                        <p className="text-[10px] text-gray-400">{challenge.split}</p>
                    </div>
                </div>

                {/* Expiry + submitted */}
                <div className="flex items-center justify-between mb-3">
                    <ExpiryTimer expiresIn={challenge.expiresIn} isUrgent={isUrgent} />
                    <span className="text-xs text-gray-400">Submitted {challenge.submittedAgo}</span>
                </div>

                {/* Action buttons */}
                {voted ? (
                    <div className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center ${voted === "approve"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                        }`}>
                        {voted === "approve" ? "✓ Approved" : "✗ Denied"}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onApprove(challenge.id)}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl text-sm font-semibold text-gray-700 hover:text-green-700 transition-all shadow-sm"
                        >
                            <CheckIcon className="w-4 h-4" />
                            Approve
                        </button>
                        <button
                            onClick={() => onDeny(challenge.id)}
                            className="flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl text-sm font-semibold text-gray-700 hover:text-red-600 transition-all shadow-sm"
                        >
                            <XIcon className="w-4 h-4" />
                            Deny
                        </button>
                    </div>
                )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-4 p-4 lg:p-5">
                {/* Coin Avatar */}
                <CoinAvatar challenge={challenge} />

                {/* Title + creator */}
                <div className="w-44 lg:w-52 flex-shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1"
                        style={{ backgroundColor: "#f3e1d7", color: "#c2410c" }}>
                        {challenge.category}
                    </span>
                    <h3 className="text-sm lg:text-base font-bold text-gray-900 leading-tight">{challenge.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
                            <span className="text-white text-[8px] font-bold">R</span>
                        </div>
                        <span className="text-xs text-gray-500">{challenge.creator}</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs text-gray-500">{challenge.mode}</span>
                    </div>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0 hidden md:block">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Event Details</p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{challenge.eventDetails}</p>
                </div>

                {/* Pool */}
                <div className="w-20 lg:w-24 flex-shrink-0 text-center hidden lg:block">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Pool</p>
                    <p className="text-lg font-bold text-green-600">{challenge.pool}</p>
                </div>

                {/* Participants */}
                <div className="w-20 flex-shrink-0 text-center hidden lg:block">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Participants</p>
                    <p className="text-lg font-bold text-gray-900">{challenge.participants}</p>
                    <p className="text-xs text-gray-400">{challenge.split}</p>
                </div>

                {/* Actions + expiry */}
                <div className="flex-shrink-0 flex flex-col items-end gap-2 ml-auto">
                    <ExpiryTimer expiresIn={challenge.expiresIn} isUrgent={isUrgent} />

                    {voted ? (
                        <div className={`px-5 py-2 rounded-xl text-sm font-semibold ${voted === "approve"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-600 border border-red-200"
                            }`}>
                            {voted === "approve" ? "✓ Approved" : "✗ Denied"}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onApprove(challenge.id)}
                                className="flex items-center gap-1.5 px-3 lg:px-4 py-2 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl text-xs lg:text-sm font-semibold text-gray-700 hover:text-green-700 transition-all shadow-sm whitespace-nowrap"
                            >
                                <CheckIcon className="w-3.5 h-3.5" />
                                Approve
                            </button>
                            <button
                                onClick={() => onDeny(challenge.id)}
                                className="flex items-center gap-1.5 px-3 lg:px-4 py-2 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl text-xs lg:text-sm font-semibold text-gray-700 hover:text-red-600 transition-all shadow-sm whitespace-nowrap"
                            >
                                <XIcon className="w-3.5 h-3.5" />
                                Deny
                            </button>
                        </div>
                    )}

                    <span className="text-xs text-gray-400">Submitted {challenge.submittedAgo}</span>
                </div>
            </div>
        </div>
    );
};

// ─── Resolver Status Sidebar ──────────────────────────────────────────────────
const ResolverStatus = () => {
    const xp = 680;
    const maxXp = 1000;
    const progress = (xp / maxXp) * 100;

    return (
        <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white/65 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
                <h3 className="text-base font-bold text-gray-900 mb-4">Your Resolver Status</h3>

                {/* Stats */}
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                    <div className="text-center pr-3">
                        <p className="text-xl font-bold text-gray-900">42</p>
                        <p className="text-xs text-gray-400 mt-0.5">Total Resolved</p>
                    </div>
                    <div className="text-center px-3">
                        <p className="text-xl font-bold text-gray-900">92%</p>
                        <p className="text-xs text-gray-400 mt-0.5">Accuracy</p>
                    </div>
                    <div className="text-center pl-3">
                        <div className="flex items-center justify-center gap-1">
                            <p className="text-xl font-bold text-gray-900">7</p>
                            <FireIcon className="w-4 h-4 text-orange-500" />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">Streak</p>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="bg-white/65 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
                <h3 className="text-base font-bold text-gray-900 mb-4">How It Works</h3>
                <div className="space-y-4">
                    {[
                        {
                            step: 1,
                            title: "Review Challenge",
                            desc: "Read the event details and evidence submitted by the participants.",
                        },
                        {
                            step: 2,
                            title: "Approve or Deny",
                            desc: "Cast your vote based on whether the event condition was met.",
                        },
                        {
                            step: 3,
                            title: "Earn Rewards",
                            desc: "Earn points and rewards for accurate resolutions.",
                        },
                    ].map(({ step, title, desc }) => (
                        <div key={step} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {step}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}

                    {/* NFT Only note */}
                    <div className="flex gap-3 pt-1">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <LockIcon className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">NFT Holders only</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                Only Rekto Masters NFT Holders can participate in resolving challenges.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResolvePage() {
    const [activeTab, setActiveTab] = useState<"pending" | "resolved" | "myvotes">("pending");
    const [category, setCategory] = useState("All Categories");
    const [market, setMarket] = useState("All Markets");
    const [sort, setSort] = useState("Newest First");
    const [votes, setVotes] = useState<Record<number, "approve" | "deny">>({});
    const [visibleCount, setVisibleCount] = useState(5);
    const [showSidebar, setShowSidebar] = useState(false);

    const handleApprove = (id: number) => {
        setVotes((prev) => ({ ...prev, [id]: "approve" }));
    };

    const handleDeny = (id: number) => {
        setVotes((prev) => ({ ...prev, [id]: "deny" }));
    };

    const pendingChallenges = challengesData.filter((c) => !votes[c.id] || true);
    const visibleChallenges = pendingChallenges.slice(0, visibleCount);
    const pendingCount = challengesData.length;

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Resolve Challenges</h1>
                        </div>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">
                            Review real-world event challenges and help the community reach a fair resolution.
                        </p>
                    </div>
                </div>

                {/* ── Tabs + Filters ── */}
                <div className="bg-white/65 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm px-4 sm:px-5 py-3 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-shrink-0">
                        {[
                            { key: "pending", label: "Pending", count: pendingCount },
                            { key: "resolved", label: "Resolved" },
                            { key: "myvotes", label: "My Votes" },
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key as typeof activeTab)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${activeTab === key
                                    ? "text-orange-500 border-b-2 border-orange-500 bg-orange-50/50"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {label}
                                {count !== undefined && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${activeTab === key ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Category */}
                        <div className="relative">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 shadow-sm cursor-pointer"
                            >
                                <option>All Categories</option>
                                <option>Cricket - IPL</option>
                                <option>FIFA World Cup</option>
                                <option>Global Sports</option>
                            </select>
                            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Market */}
                        <div className="relative">
                            <select
                                value={market}
                                onChange={(e) => setMarket(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 shadow-sm cursor-pointer"
                            >
                                <option>All Markets</option>
                                <option>FanDuel</option>
                                <option>Bet365</option>
                                <option>BetMGM</option>
                                <option>Dream11</option>
                            </select>
                            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Sort */}
                        <div className="relative">
                            <div className="flex items-center gap-1.5 pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium shadow-sm cursor-pointer"
                                onClick={() => setSort(sort === "Newest First" ? "Oldest First" : "Newest First")}>
                                <FilterIcon className="w-3.5 h-3.5 text-gray-500" />
                                <span>{sort}</span>
                            </div>
                            <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* ── Main Content ── */}
                <div className="flex gap-5 lg:gap-6">

                    {/* ── Left: Challenge List ── */}
                    <div className="flex-1 min-w-0">
                        {/* Count */}
                        <p className="text-sm text-gray-500 mb-3 font-medium">
                            {pendingCount} challenges pending
                        </p>

                        {activeTab === "pending" && (
                            <div className="space-y-3">
                                {visibleChallenges.map((challenge) => (
                                    <ChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        onApprove={handleApprove}
                                        onDeny={handleDeny}
                                        voted={votes[challenge.id] ?? null}
                                    />
                                ))}

                                {/* Load More */}
                                {visibleCount < pendingChallenges.length && (
                                    <button
                                        onClick={() => setVisibleCount((v) => v + 5)}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/50 hover:bg-white/70 border border-white/70 rounded-2xl text-sm font-semibold text-gray-700 transition-all mt-2"
                                    >
                                        Load More
                                        <ChevronDown2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}

                        {activeTab === "resolved" && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center mb-4">
                                    <CheckIcon className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">No resolved challenges yet</h3>
                                <p className="text-gray-400 text-sm">Resolved challenges will appear here.</p>
                            </div>
                        )}

                        {activeTab === "myvotes" && (
                            <div className="space-y-3">
                                {Object.keys(votes).length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center mb-4">
                                            <ShieldIcon className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No votes cast yet</h3>
                                        <p className="text-gray-400 text-sm">Your votes will appear here.</p>
                                    </div>
                                ) : (
                                    challengesData
                                        .filter((c) => votes[c.id])
                                        .map((challenge) => (
                                            <ChallengeCard
                                                key={challenge.id}
                                                challenge={challenge}
                                                onApprove={handleApprove}
                                                onDeny={handleDeny}
                                                voted={votes[challenge.id] ?? null}
                                            />
                                        ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Right: Sidebar (desktop) ── */}
                    <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
                        <ResolverStatus />
                    </div>
                </div>

                {/* ── Mobile: Resolver Status Toggle ── */}
                <div className="lg:hidden mt-5">
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white/65 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm text-sm font-semibold text-gray-800"
                    >
                        <div className="flex items-center gap-2">
                            <ShieldIcon className="w-4 h-4 text-orange-500" />
                            Your Resolver Status
                        </div>
                        <ChevronDown2 className={`w-4 h-4 text-gray-400 transition-transform ${showSidebar ? "rotate-180" : ""}`} />
                    </button>

                    {showSidebar && (
                        <div className="mt-3">
                            <ResolverStatus />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
