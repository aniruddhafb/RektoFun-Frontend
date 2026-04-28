"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type MemberRole = "Leader" | "Co-Leader" | "Member";
type MemberStatus = "Online" | "Away" | "Offline";
type ChallengeMode = "PVP Mode" | "Multi Mode";
type ChallengeAction = "ACCEPT" | "JOIN CHALLENGE";

interface Member {
    id: number;
    name: string;
    avatar: string;
    role: MemberRole;
    rektPoints: string;
    status: MemberStatus;
}

interface ChallengeParticipant {
    name: string;
    avatar: string;
    label: "CHALLENGER" | "DEFENDER";
    sublabel: string;
    pool?: string;
}

interface ClanChallenge {
    id: number;
    title: string;
    asset: string;
    assetColor: string;
    creator: string;
    mode: ChallengeMode;
    challenger: ChallengeParticipant;
    defender: ChallengeParticipant | null;
    action: ChallengeAction;
    expiresIn: string;
    createdAgo: string;
    shares: number;
    views: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const clanData = {
    name: "Alpha Syndicate",
    slug: "alpha-syndicate",
    tagline: "Trade smart. Win together.",
    description: "Always stay one step ahead of the market.",
    leader: "LionKing",
    leaderAvatar: "/profiles/1.svg",
    logo: "/scribbles/coins.png",
    type: "Public" as const,
    members: 37,
    maxMembers: 50,
    totalWins: 128,
    totalRekts: 3460,
    winRate: 78,
    rektPoints: "12.4K",
    verified: true,
    isOpenToJoin: true,
};

const membersData: Member[] = [
    { id: 1, name: "LionKing", avatar: "/profiles/1.svg", role: "Leader", rektPoints: "12.4K", status: "Online" },
    { id: 2, name: "Ragnar", avatar: "/profiles/2.svg", role: "Co-Leader", rektPoints: "9.8K", status: "Online" },
    { id: 3, name: "Maverick", avatar: "/profiles/3.svg", role: "Co-Leader", rektPoints: "8.2K", status: "Away" },
    { id: 4, name: "CryptoKing", avatar: "/profiles/4.svg", role: "Member", rektPoints: "6.6K", status: "Online" },
    { id: 5, name: "DegenLord", avatar: "/profiles/5.svg", role: "Member", rektPoints: "5.4K", status: "Offline" },
    { id: 6, name: "Aqua", avatar: "/profiles/6.svg", role: "Member", rektPoints: "4.1K", status: "Online" },
    { id: 7, name: "MoonBoy", avatar: "/profiles/7.svg", role: "Member", rektPoints: "3.8K", status: "Offline" },
];

const challengesData: ClanChallenge[] = [
    {
        id: 1,
        title: "SOL Above $160 in 1 Hour?",
        asset: "SOL",
        assetColor: "#9945FF",
        creator: "DegenLord",
        mode: "PVP Mode",
        challenger: {
            name: "DegenLord",
            avatar: "/profiles/5.svg",
            label: "CHALLENGER",
            sublabel: "Created",
            pool: "$500",
        },
        defender: {
            name: "CryptoKing",
            avatar: "/profiles/4.svg",
            label: "DEFENDER",
            sublabel: "Defending",
        },
        action: "ACCEPT",
        expiresIn: "59m 12s",
        createdAgo: "2h ago",
        shares: 5,
        views: 0,
    },
    {
        id: 2,
        title: "BTC Above $95K in 2 Hours?",
        asset: "BTC",
        assetColor: "#F7931A",
        creator: "CryptoKing",
        mode: "Multi Mode",
        challenger: {
            name: "CryptoKing",
            avatar: "/profiles/4.svg",
            label: "CHALLENGER",
            sublabel: "Created",
            pool: "$2250",
        },
        defender: null,
        action: "JOIN CHALLENGE",
        expiresIn: "1h 45m",
        createdAgo: "2h ago",
        shares: 12,
        views: 0,
    },
    {
        id: 3,
        title: "ETH Below $3,200 in 30 mins?",
        asset: "ETH",
        assetColor: "#627EEA",
        creator: "BearWhale",
        mode: "PVP Mode",
        challenger: {
            name: "BearWhale",
            avatar: "/profiles/8.svg",
            label: "CHALLENGER",
            sublabel: "Created",
            pool: "$2500",
        },
        defender: null,
        action: "ACCEPT",
        expiresIn: "28m 45s",
        createdAgo: "2h ago",
        shares: 8,
        views: 0,
    },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ChevronLeftIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);

const UserPlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
);

const VerifiedIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
);

const SwordsIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
        <line x1="13" y1="19" x2="19" y2="13" />
        <line x1="16" y1="16" x2="20" y2="20" />
        <line x1="19" y1="21" x2="21" y2="19" />
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
        <line x1="5" y1="14" x2="9" y2="18" />
        <line x1="7" y1="21" x2="9" y2="19" />
        <line x1="3" y1="19" x2="5" y2="21" />
    </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const InfoIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const SettingsIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
);

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }: { role: MemberRole }) => {
    const styles: Record<MemberRole, string> = {
        Leader: "bg-amber-100 text-amber-700 border border-amber-200",
        "Co-Leader": "bg-blue-100 text-blue-700 border border-blue-200",
        Member: "bg-gray-100 text-gray-600 border border-gray-200",
    };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[role]}`}>
            {role}
        </span>
    );
};

// ─── Status Dot ───────────────────────────────────────────────────────────────
const StatusDot = ({ status }: { status: MemberStatus }) => {
    const styles: Record<MemberStatus, string> = {
        Online: "bg-green-500",
        Away: "bg-yellow-400",
        Offline: "bg-gray-400",
    };
    return (
        <span className={`inline-block w-2 h-2 rounded-full ${styles[status]}`} />
    );
};

// ─── Asset Icon ───────────────────────────────────────────────────────────────
const AssetIcon = ({ asset, color }: { asset: string; color: string }) => {
    const icons: Record<string, string> = {
        SOL: "◎",
        BTC: "₿",
        ETH: "Ξ",
    };
    return (
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: color }}
        >
            {icons[asset] ?? asset[0]}
        </div>
    );
};

// ─── Challenge Card ───────────────────────────────────────────────────────────
const ChallengeCard = ({ challenge }: { challenge: ClanChallenge }) => {
    const isAccept = challenge.action === "ACCEPT";

    return (
        <div className="bg-white/50 rounded-xl border border-white/70 p-4 hover:bg-white/60 transition-all">
            {/* Top row */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <AssetIcon asset={challenge.asset} color={challenge.assetColor} />
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">{challenge.title}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-xs text-gray-500">{challenge.creator}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-500 font-medium">{challenge.mode}</span>
                    <InfoIcon className="w-3.5 h-3.5 text-gray-400" />
                </div>
            </div>

            {/* Participants + Action */}
            <div className="flex items-center gap-3">
                {/* Challenger */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-0.5 rounded-full">
                        {challenge.challenger.label}
                    </span>
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                            <Image
                                src={challenge.challenger.avatar}
                                alt={challenge.challenger.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {challenge.challenger.pool && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
                                <span>💰</span>
                                <span>{challenge.challenger.pool}</span>
                            </div>
                        )}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 mt-1">{challenge.challenger.name}</span>
                    <span className="text-[10px] text-gray-400">{challenge.challenger.sublabel}</span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs font-black">VS</span>
                    </div>
                </div>

                {/* Defender */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold bg-gray-700 text-white px-2 py-0.5 rounded-full">
                        {challenge.defender ? challenge.defender.label : "DEFENDER"}
                    </span>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center">
                        {challenge.defender ? (
                            <Image
                                src={challenge.defender.avatar}
                                alt={challenge.defender.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-gray-400 text-xl font-bold">?</span>
                        )}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 mt-1">
                        {challenge.defender ? challenge.defender.name : "No one yet!"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {challenge.defender ? challenge.defender.sublabel : ""}
                    </span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Action + Timer */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                        className={`px-5 py-2.5 rounded-lg font-bold text-sm text-white transition-all shadow-sm hover:opacity-90 active:scale-95 ${isAccept
                            ? "bg-gradient-to-r from-green-600 to-green-500"
                            : "bg-gradient-to-r from-green-700 to-green-600"
                            }`}
                    >
                        {challenge.action} {isAccept ? "⚔️" : ""}
                    </button>
                    <span className="text-[10px] text-gray-400">Expires in</span>
                    <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-700">{challenge.expiresIn}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <ClockIcon className="w-3 h-3" />
                    <span>Created {challenge.createdAgo}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <ShareIcon className="w-3 h-3" />
                    <span>{challenge.shares}</span>
                </div>
                {challenge.views > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span>👁</span>
                        <span>{challenge.views}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Tab Types ────────────────────────────────────────────────────────────────
type Tab = "Overview" | "Members" | "Challenges" | "Settings";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClanDetailPage() {
    const [activeTab, setActiveTab] = useState<Tab>("Overview");
    const [memberSearch, setMemberSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    const filteredMembers = membersData.filter((m) => {
        const matchSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase());
        const matchRole = roleFilter === "All" || m.role === roleFilter;
        return matchSearch && matchRole;
    });

    const tabs: Tab[] = ["Overview", "Members", "Challenges", "Settings"];

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* ── Top Action Bar ── */}
                <div className="flex items-center justify-between mb-5">
                    <Link
                        href="/clans"
                        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Back to Clans
                    </Link>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white/90 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 transition-all shadow-sm">
                            <ShareIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Share Clan</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
                            <UserPlusIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Invite Members</span>
                        </button>
                    </div>
                </div>

                {/* ── Clan Header Card ── */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5 mb-5">
                    <div className="flex flex-col sm:flex-row gap-5">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white/80 shadow-md flex items-center justify-center">
                                <Image
                                    src={clanData.logo}
                                    alt={clanData.name}
                                    width={112}
                                    height={112}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{clanData.name}</h1>
                                {clanData.verified && (
                                    <VerifiedIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                )}
                            </div>
                            <p className="text-gray-700 font-semibold text-sm">{clanData.tagline}</p>
                            <p className="text-gray-500 text-sm mt-0.5">{clanData.description}</p>

                            {/* Leader */}
                            <div className="flex items-center gap-2 mt-2.5">
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                    <Image
                                        src={clanData.leaderAvatar}
                                        alt={clanData.leader}
                                        width={20}
                                        height={20}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-orange-500">{clanData.leader}</span>
                                <span className="text-xs text-gray-400">(Leader)</span>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                    <ShieldIcon className="w-3 h-3" />
                                    Public
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                    <UsersIcon className="w-4 h-4 text-gray-400" />
                                    {clanData.members} / {clanData.maxMembers} Members
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex sm:flex-row flex-wrap gap-6 sm:gap-8 items-center justify-start sm:justify-center">
                            <div className="flex flex-col items-center gap-1">
                                <TrophyIcon className="w-5 h-5 text-gray-700" />
                                <span className="text-xl font-bold text-gray-900">{clanData.totalWins}</span>
                                <span className="text-xs text-gray-400">Total Wins</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <SwordsIcon className="w-5 h-5 text-gray-700" />
                                <span className="text-xl font-bold text-gray-900">{clanData.totalRekts.toLocaleString()}</span>
                                <span className="text-xs text-gray-400">Total Rekts</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <TrendingUpIcon className="w-5 h-5 text-gray-700" />
                                <span className="text-xl font-bold text-gray-900">{clanData.winRate}%</span>
                                <span className="text-xs text-gray-400">Win Rate</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <StarIcon className="w-5 h-5 text-orange-400" />
                                <span className="text-xl font-bold text-orange-500">{clanData.rektPoints}</span>
                                <span className="text-xs text-gray-400">REKT Points</span>
                            </div>
                        </div>

                        {/* Join / Manage */}
                        <div className="flex-shrink-0 flex flex-col items-stretch sm:items-end gap-3 sm:min-w-[160px]">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <ShieldIcon className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Open to Join</p>
                                    <p className="text-xs text-gray-500">Anyone can join and compete</p>
                                </div>
                            </div>
                            <button className="w-full px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                Manage Clan
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center gap-1 mb-5 border-b border-gray-200/60 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === tab
                                ? "text-orange-500 border-orange-500"
                                : "text-gray-500 border-transparent hover:text-gray-800"
                                }`}
                        >
                            {tab === "Settings" && <SettingsIcon className="w-3.5 h-3.5" />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Overview Tab ── */}
                {activeTab === "Overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* Left: Clan Challenges */}
                        <div className="lg:col-span-2">
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Clan Challenges</h2>
                                    <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                        View All Challenges
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {challengesData.map((challenge) => (
                                        <ChallengeCard key={challenge.id} challenge={challenge} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Members */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Members{" "}
                                        <span className="text-gray-400 font-normal text-sm">
                                            ({clanData.members}/{clanData.maxMembers})
                                        </span>
                                    </h2>
                                </div>

                                {/* Search + Filter */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search members..."
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 bg-[#f3e1d7]/60 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                        />
                                    </div>
                                    <div className="relative flex-shrink-0">
                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="appearance-none pl-3 pr-7 py-2 bg-[#f3e1d7]/60 border border-gray-200 rounded-lg text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
                                        >
                                            <option value="All">Role: All</option>
                                            <option value="Leader">Leader</option>
                                            <option value="Co-Leader">Co-Leader</option>
                                            <option value="Member">Member</option>
                                        </select>
                                        <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Member List */}
                                <div className="space-y-3">
                                    {filteredMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 py-2 border-b border-gray-100/80 last:border-0"
                                        >
                                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-white shadow-sm">
                                                <Image
                                                    src={member.avatar}
                                                    alt={member.name}
                                                    width={36}
                                                    height={36}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-sm font-semibold text-gray-900 truncate">{member.name}</span>
                                                    <RoleBadge role={member.role} />
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <span className="text-sm font-bold text-gray-900">{member.rektPoints}</span>
                                                <span className="text-[10px] text-gray-400">REKT Points</span>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <StatusDot status={member.status} />
                                                <span className="text-xs text-gray-500">{member.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* View All */}
                                <button className="w-full mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors py-2">
                                    View All Members
                                    <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Members Tab ── */}
                {activeTab === "Members" && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900">
                                All Members{" "}
                                <span className="text-gray-400 font-normal text-sm">
                                    ({clanData.members}/{clanData.maxMembers})
                                </span>
                            </h2>
                        </div>

                        {/* Search + Filter */}
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                            <div className="relative flex-1 min-w-[200px]">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-[#f3e1d7]/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="appearance-none pl-4 pr-9 py-2.5 bg-[#f3e1d7]/60 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
                                >
                                    <option value="All">Role: All</option>
                                    <option value="Leader">Leader</option>
                                    <option value="Co-Leader">Co-Leader</option>
                                    <option value="Member">Member</option>
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            {filteredMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/50 transition-all"
                                >
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-sm">
                                        <Image
                                            src={member.avatar}
                                            alt={member.name}
                                            width={44}
                                            height={44}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-gray-900">{member.name}</span>
                                            <RoleBadge role={member.role} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="font-bold text-gray-900">{member.rektPoints}</span>
                                        <span className="text-xs text-gray-400">REKT Points</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <StatusDot status={member.status} />
                                        <span className="text-sm text-gray-500">{member.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Challenges Tab ── */}
                {activeTab === "Challenges" && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900">All Clan Challenges</h2>
                        </div>
                        <div className="space-y-4">
                            {challengesData.map((challenge) => (
                                <ChallengeCard key={challenge.id} challenge={challenge} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Settings Tab ── */}
                {activeTab === "Settings" && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
                        <h2 className="text-lg font-bold text-gray-900 mb-5">Clan Settings</h2>
                        <div className="space-y-5 max-w-xl">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Clan Name</label>
                                <input
                                    type="text"
                                    defaultValue={clanData.name}
                                    className="w-full px-4 py-2.5 bg-[#f3e1d7]/60 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                <textarea
                                    defaultValue={`${clanData.tagline} ${clanData.description}`}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-[#f3e1d7]/60 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Clan Type</label>
                                <div className="relative">
                                    <select
                                        defaultValue="Public"
                                        className="w-full appearance-none pl-4 pr-9 py-2.5 bg-[#f3e1d7]/60 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
                                    >
                                        <option>Public</option>
                                        <option>Invite Only</option>
                                    </select>
                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                                    Save Changes
                                </button>
                                <button className="px-5 py-2.5 bg-white/70 hover:bg-white/90 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all shadow-sm">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
