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
        coin: "SOL",
        coinSymbol: "SOL",
        coinColor: "#9945FF",
        coinBg: "#1a1a2e",
        coinIcon: "S",
        category: "Crypto Price",
        title: "SOL Above $160 in 1 Hour?",
        creator: "DegenLord",
        mode: "PVP Mode",
        eventDetails: "Will the price of SOL on Binance spot market rise above $160 within 1 hour?",
        pool: "$500",
        participants: 24,
        split: "12 vs 12",
        expiresIn: "59m 12s",
        expiresMs: 59 * 60 * 1000 + 12 * 1000,
        submittedAgo: "2h ago",
        market: "Binance",
    },
    {
        id: 2,
        coin: "BTC",
        coinSymbol: "BTC",
        coinColor: "#F7931A",
        coinBg: "#F7931A",
        coinIcon: "₿",
        category: "Crypto Price",
        title: "BTC Above $95K in 2 Hours?",
        creator: "CryptoKing",
        mode: "Multi Mode",
        eventDetails: "Will the price of BTC on Binance spot market rise above $95,000 within 2 hours?",
        pool: "$2,250",
        participants: 30,
        split: "15 vs 15",
        expiresIn: "1h 45m",
        expiresMs: 1 * 60 * 60 * 1000 + 45 * 60 * 1000,
        submittedAgo: "3h ago",
        market: "Binance",
    },
    {
        id: 3,
        coin: "ETH",
        coinSymbol: "ETH",
        coinColor: "#627EEA",
        coinBg: "#627EEA",
        coinIcon: "Ξ",
        category: "Crypto Price",
        title: "ETH Below $3,200 in 30 mins?",
        creator: "BearWhale",
        mode: "PVP Mode",
        eventDetails: "Will the price of ETH on Binance spot market fall below $3,200 within 30 minutes?",
        pool: "$2,500",
        participants: 16,
        split: "8 vs 8",
        expiresIn: "28m 45s",
        expiresMs: 28 * 60 * 1000 + 45 * 1000,
        submittedAgo: "1h ago",
        market: "Binance",
    },
    {
        id: 4,
        coin: "DOGE",
        coinSymbol: "DOGE",
        coinColor: "#C2A633",
        coinBg: "#f5d020",
        coinIcon: "Ð",
        category: "Crypto Price",
        title: "DOGE Above $0.18 in 1 Hour?",
        creator: "DegenLord",
        mode: "Multi Mode",
        eventDetails: "Will the price of DOGE on Binance spot market rise above $0.18 within 1 hour?",
        pool: "$50",
        participants: 10,
        split: "5 vs 5",
        expiresIn: "52m 30s",
        expiresMs: 52 * 60 * 1000 + 30 * 1000,
        submittedAgo: "4h ago",
        market: "Binance",
    },
    {
        id: 5,
        coin: "PEPE",
        coinSymbol: "PEPE",
        coinColor: "#4CAF50",
        coinBg: "#2d5a27",
        coinIcon: "🐸",
        category: "Crypto Price",
        title: "PEPE Above $0.000015 in 3 Hours?",
        creator: "MoonBoy",
        mode: "PVP Mode",
        eventDetails: "Will the price of PEPE on Binance spot market rise above $0.000015 within 3 hours?",
        pool: "$900",
        participants: 14,
        split: "7 vs 7",
        expiresIn: "2h 15m",
        expiresMs: 2 * 60 * 60 * 1000 + 15 * 60 * 1000,
        submittedAgo: "2h ago",
        market: "Binance",
    },
    {
        id: 6,
        coin: "LINK",
        coinSymbol: "LINK",
        coinColor: "#2A5ADA",
        coinBg: "#2A5ADA",
        coinIcon: "⬡",
        category: "Crypto Price",
        title: "LINK Above $18 in 2 Hours?",
        creator: "ChainLink",
        mode: "PVP Mode",
        eventDetails: "Will the price of LINK on Binance spot market rise above $18 within 2 hours?",
        pool: "$1,200",
        participants: 20,
        split: "10 vs 10",
        expiresIn: "1h 30m",
        expiresMs: 1 * 60 * 60 * 1000 + 30 * 60 * 1000,
        submittedAgo: "5h ago",
        market: "Binance",
    },
    {
        id: 7,
        coin: "ADA",
        coinSymbol: "ADA",
        coinColor: "#0033AD",
        coinBg: "#0033AD",
        coinIcon: "₳",
        category: "Crypto Price",
        title: "ADA Above $0.65 in 1 Hour?",
        creator: "CardanoFan",
        mode: "Multi Mode",
        eventDetails: "Will the price of ADA on Binance spot market rise above $0.65 within 1 hour?",
        pool: "$750",
        participants: 18,
        split: "9 vs 9",
        expiresIn: "45m 20s",
        expiresMs: 45 * 60 * 1000 + 20 * 1000,
        submittedAgo: "3h ago",
        market: "Binance",
    },
    {
        id: 8,
        coin: "AVAX",
        coinSymbol: "AVAX",
        coinColor: "#E84142",
        coinBg: "#E84142",
        coinIcon: "A",
        category: "Crypto Price",
        title: "AVAX Above $40 in 3 Hours?",
        creator: "AvalancheKing",
        mode: "PVP Mode",
        eventDetails: "Will the price of AVAX on Binance spot market rise above $40 within 3 hours?",
        pool: "$3,000",
        participants: 22,
        split: "11 vs 11",
        expiresIn: "2h 50m",
        expiresMs: 2 * 60 * 60 * 1000 + 50 * 60 * 1000,
        submittedAgo: "1h ago",
        market: "Binance",
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
        SOL: "/scribbles/sol.png",
        BTC: "/scribbles/btc.png",
        ETH: "/scribbles/coins.png",
        DOGE: "/scribbles/doge.png",
        PEPE: "/scribbles/pepe.png",
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

                {/* Level badge */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                        <ShieldIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-orange-500">Level 3 Resolver</span>
                            <span className="text-xs font-semibold text-orange-500">{xp} / {maxXp} XP</span>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${progress}%`,
                                    background: "linear-gradient(90deg, #f97316, #ea580c)"
                                }}
                            />
                        </div>
                    </div>
                </div>

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
                            desc: "Earn XP and reputation for accurate resolutions.",
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
                                Verify your NFT to start resolving challenges.
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
                            <div className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                                <ShieldIcon className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">
                            Review real-world event challenges and help the community reach a fair resolution.
                        </p>
                    </div>

                    {/* NFT Verify Banner */}
                    <div className="flex items-center gap-3 bg-white/65 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm px-4 py-3 flex-shrink-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
                            <ShieldIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-semibold text-gray-900">Only NFT Holders can resolve</p>
                            <p className="text-xs text-gray-500">Verify your NFT to start resolving.</p>
                        </div>
                        <button className="ml-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm whitespace-nowrap">
                            Verify NFT
                        </button>
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
                                <option>Crypto Price</option>
                                <option>Sports</option>
                                <option>Politics</option>
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
                                <option>Binance</option>
                                <option>Coinbase</option>
                                <option>Kraken</option>
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
