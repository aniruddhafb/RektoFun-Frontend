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
    validatorCount: number;
    validatorTarget: number;
    verificationResources: string[];
    resolvedTrueCount: number;
    resolvedFalseCount: number;
    rektoPointsWon: number;
    usdcRewards: string;
    wrongDecisionPointsPenalty: number;
    wrongDecisionUsdcPenalty: string;
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
        title: "CSK To Win By 15+ Runs Tonight",
        creator: "CricketNerd",
        mode: "PVP Mode",
        eventDetails: "has Chennai Super Kings defeat Mumbai Indians by 15 or more runs?",
        pool: "$850",
        participants: 26,
        split: "13 vs 13",
        expiresIn: "1h 08m",
        expiresMs: 1 * 60 * 60 * 1000 + 8 * 60 * 1000,
        submittedAgo: "36m ago",
        market: "FanDuel",
        validatorCount: 5,
        validatorTarget: 75,
        verificationResources: [
            "Official IPL Match Center",
            "ESPNcricinfo Live Scorecard",
            "Cricbuzz Post Match Report",
        ],
        resolvedTrueCount: 41,
        resolvedFalseCount: 19,
        rektoPointsWon: 40,
        usdcRewards: "0.00",
        wrongDecisionPointsPenalty: 20,
        wrongDecisionUsdcPenalty: "0.00",
    },
    {
        id: 2,
        coin: "FIFA",
        coinSymbol: "FIFA",
        coinColor: "#0f766e",
        coinBg: "#0f766e",
        coinIcon: "F",
        category: "FIFA World Cup",
        title: "Brazil To Win FIFA 2026",
        creator: "GoalGuru",
        mode: "Multi Mode",
        eventDetails: "Has Brazil won the FIFA 2026 cup?",
        pool: "$1,420",
        participants: 34,
        split: "19 vs 15",
        expiresIn: "2h 12m",
        expiresMs: 2 * 60 * 60 * 1000 + 12 * 60 * 1000,
        submittedAgo: "1h ago",
        market: "Bet365",
        validatorCount: 22,
        validatorTarget: 75,
        verificationResources: [
            "FIFA Official Match Report",
            "Sofascore Match Stats",
            "BBC Sport Match Summary",
        ],
        resolvedTrueCount: 33,
        resolvedFalseCount: 21,
        rektoPointsWon: 40,
        usdcRewards: "0.00",
        wrongDecisionPointsPenalty: 20,
        wrongDecisionUsdcPenalty: "0.00",
    },
    {
        id: 3,
        coin: "IPL",
        coinSymbol: "IPL",
        coinColor: "#d97706",
        coinBg: "#d97706",
        coinIcon: "I",
        category: "Cricket - IPL",
        title: "Virat Kohli 50+ Runs Tonight",
        creator: "MidwicketMind",
        mode: "PVP Mode",
        eventDetails: "Has Virat Kohli scored 50 or more runs in today's RCB vs MI match?",
        pool: "$1,050",
        participants: 16,
        split: "8 vs 8",
        expiresIn: "42m 10s",
        expiresMs: 42 * 60 * 1000 + 10 * 1000,
        submittedAgo: "25m ago",
        market: "Dream11",
        validatorCount: 13,
        validatorTarget: 75,
        verificationResources: [
            "IPL Official Scoreboard",
            "Cricbuzz Player Stats",
            "FanCode Match Highlights",
        ],
        resolvedTrueCount: 28,
        resolvedFalseCount: 17,
        rektoPointsWon: 40,
        usdcRewards: "0.00",
        wrongDecisionPointsPenalty: 20,
        wrongDecisionUsdcPenalty: "0.00",
    }
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

// ─── Challenge Row Card ───────────────────────────────────────────────────────
const ChallengeCard = ({
    challenge,
    onDecisionClick,
    voted,
}: {
    challenge: Challenge;
    onDecisionClick: (challenge: Challenge, decision: "approve" | "deny") => void;
    voted: "approve" | "deny" | null;
}) => {
    const [expanded, setExpanded] = useState(false);
    const isUrgent = challenge.expiresMs < 30 * 60 * 1000;
    const validationProgress = Math.min((challenge.validatorCount / challenge.validatorTarget) * 100, 100);
    const resolutionStatus =
        voted === "approve" ? "Approved" : voted === "deny" ? "Denied" : "Pending Resolution";
    const resolutionStatusClasses =
        voted === "approve"
            ? "bg-green-50 text-green-700 border-green-200"
            : voted === "deny"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-700 border-amber-200";

    return (
        <div className="bg-white/65 backdrop-blur-sm rounded-2xl border border-gray-400 shadow-sm hover:shadow-md transition-all hover:bg-white/75 overflow-hidden">
            <div className="p-4 lg:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                    <CoinAvatar challenge={challenge} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1"
                                style={{ backgroundColor: "#f3e1d7", color: "#c2410c" }}>
                                {challenge.category}
                            </span>
                            <div className="text-right flex-shrink-0">
                                <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Validation ends in</p>
                                <p className={`text-xs font-semibold ${isUrgent ? "text-red-500" : "text-orange-500"}`}>{challenge.expiresIn}</p>
                            </div>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">{challenge.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                            {challenge.eventDetails}
                        </p>
                        <div className="mt-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${resolutionStatusClasses}`}>
                                {resolutionStatus}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                        onClick={() => onDecisionClick(challenge, "approve")}
                        className={`cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm border ${voted === "approve"
                            ? "bg-green-50 border-green-300 text-green-700"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                            }`}
                    >
                        <CheckIcon className="w-4 h-4" />
                        Resolve True
                    </button>
                    <button
                        onClick={() => onDecisionClick(challenge, "deny")}
                        className={`cursor-pointer flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm border ${voted === "deny"
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                            }`}
                    >
                        <XIcon className="w-4 h-4" />
                        Resolve False
                    </button>
                </div>

                <div className="mt-3 bg-white/50 rounded-xl p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">Live Validations</p>
                        <p className="text-sm font-bold text-gray-800">
                            {challenge.validatorCount}/{challenge.validatorTarget}
                        </p>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-orange-500 transition-all duration-300"
                            style={{ width: `${validationProgress}%` }}
                        />
                    </div>
                </div>

                <button
                    onClick={() => setExpanded((prev) => !prev)}
                    className="cursor-pointer mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                    {expanded ? "Show less" : "Show more"}
                    <ChevronDown2 className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>

                {expanded && (
                    <div className="mt-3 pt-3 border-t border-white/70">

                        <div className="mt-2.5 bg-white/50 rounded-xl p-3 border border-gray-300">
                            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-1.5">
                                Verify Statement Resources
                            </p>
                            <div className="space-y-1.5">
                                {challenge.verificationResources.map((resource) => (
                                    <p key={resource} className="text-xs sm:text-sm text-gray-700">
                                        - {resource}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                <p className="text-[10px] uppercase tracking-wide text-green-700 font-semibold mb-0.5">Resolved True</p>
                                <p className="text-lg font-bold text-green-800">{challenge.resolvedTrueCount}</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <p className="text-[10px] uppercase tracking-wide text-red-700 font-semibold mb-0.5">Resolved False</p>
                                <p className="text-lg font-bold text-red-800">{challenge.resolvedFalseCount}</p>
                            </div>
                        </div>

                        <div className="mt-2.5 bg-white/60 rounded-xl p-3 border border-gray-300">
                            <p className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold mb-2">Rewards</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Rekto Points won</p>
                                    <p className="text-base font-bold text-gray-900 mt-0.5">{challenge.rektoPointsWon}</p>
                                </div>
                                <div className="bg-white rounded-lg border border-gray-100 px-3 py-2">
                                    <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">USDC rewards Won</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Image src="/Icons/usdc.png" alt="USDC" width={18} height={18} className="w-[18px] h-[18px] object-contain" />
                                        <p className="text-base font-bold text-gray-900">{challenge.usdcRewards}</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Gets updated when the challenge gets resolved.
                            </p>
                        </div>
                    </div>
                )}
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
    const [market, setMarket] = useState("All Markets");
    const [sort, setSort] = useState("Newest First");
    const [votes, setVotes] = useState<Record<number, "approve" | "deny">>({});
    const [visibleCount, setVisibleCount] = useState(5);
    const [showSidebar, setShowSidebar] = useState(false);
    const [pendingDecision, setPendingDecision] = useState<{
        challenge: Challenge;
        decision: "approve" | "deny";
    } | null>(null);

    const handleApprove = (id: number) => {
        setVotes((prev) => ({ ...prev, [id]: "approve" }));
    };

    const handleDeny = (id: number) => {
        setVotes((prev) => ({ ...prev, [id]: "deny" }));
    };

    const handleDecisionClick = (challenge: Challenge, decision: "approve" | "deny") => {
        setPendingDecision({ challenge, decision });
    };

    const handleConfirmDecision = () => {
        if (!pendingDecision) {
            return;
        }
        if (pendingDecision.decision === "approve") {
            handleApprove(pendingDecision.challenge.id);
        } else {
            handleDeny(pendingDecision.challenge.id);
        }
        setPendingDecision(null);
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

                        {/* Market */}
                        <div className="relative">
                            <select
                                value={market}
                                onChange={(e) => setMarket(e.target.value)}
                                className="appearance-none pl-3 pr-8 py-2 bg-white/80 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-200 shadow-sm cursor-pointer"
                            >
                                <option>All Markets</option>
                                <option>FIFA 26</option>
                                <option>IPL 26</option>
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
                                        onDecisionClick={handleDecisionClick}
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
                                                onDecisionClick={handleDecisionClick}
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

                {pendingDecision && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <button
                            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
                            aria-label="Close modal"
                            onClick={() => setPendingDecision(null)}
                        />
                        <div className="relative w-full max-w-lg bg-white rounded-2xl border border-white/80 shadow-2xl p-5 sm:p-6">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Confirm Resolution</h3>
                            <p className="text-sm text-gray-500 mt-1">Final step before you submit your validation.</p>

                            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1">Challenge</p>
                                <p className="text-sm sm:text-base font-semibold text-gray-900">{pendingDecision.challenge.title}</p>
                            </div>

                            <div className="mt-3">
                                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1.5">Your Decision</p>
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold border ${pendingDecision.decision === "approve"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                    }`}>
                                    {pendingDecision.decision === "approve" ? "Resolve True" : "Resolve False"}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-green-700 font-semibold mb-1">If Correct, You Win</p>
                                    <p className="text-sm text-green-900 font-semibold">
                                        Rekto Points: +{pendingDecision.challenge.rektoPointsWon}
                                    </p>
                                    <p className="text-sm text-green-900 font-semibold mt-0.5">
                                        USDC: +{pendingDecision.challenge.usdcRewards}
                                    </p>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-red-700 font-semibold mb-1">If Wrong, Penalty</p>
                                    <p className="text-sm text-red-900 font-semibold">
                                        Rekto Points: -{pendingDecision.challenge.wrongDecisionPointsPenalty}
                                    </p>
                                    <p className="text-sm text-red-900 font-semibold mt-0.5">
                                        USDC: -{pendingDecision.challenge.wrongDecisionUsdcPenalty}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                                <button
                                    onClick={() => setPendingDecision(null)}
                                    className="cursor-pointer px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDecision}
                                    className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${pendingDecision.decision === "approve"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                        }`}
                                >
                                    Confirm {pendingDecision.decision === "approve" ? "True" : "False"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
