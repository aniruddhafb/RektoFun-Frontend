"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Clock, Shield, Lock, Users, Trophy } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Clan {
    rank: number;
    name: string;
    description: string;
    leader: string;
    leaderAvatar: string;
    logo: string;
    type: "Public" | "Invite Only";
    members: number;
    maxMembers: number;
    totalWins: number;
    totalRekts: number;
    winRate: number;
    rektPoints: string;
    verified: boolean;
    chain: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const clansData: Clan[] = [
    {
        rank: 1,
        name: "Alpha Syndicate",
        description: "Trade smart. Win together. Always stay one step ahead of the market.",
        leader: "LionKing",
        leaderAvatar: "/scribbles/btc.png",
        logo: "/scribbles/coins.png",
        type: "Public",
        members: 37,
        maxMembers: 50,
        totalWins: 128,
        totalRekts: 3460,
        winRate: 78,
        rektPoints: "12.4K",
        verified: true,
        chain: "Solana",
    },
    {
        rank: 2,
        name: "Rekt Hunters",
        description: "Hunt the markets. Rekt the rest.",
        leader: "Ragnar",
        leaderAvatar: "/scribbles/pepe.png",
        logo: "/scribbles/shiba.png",
        type: "Invite Only",
        members: 45,
        maxMembers: 50,
        totalWins: 96,
        totalRekts: 2780,
        winRate: 74,
        rektPoints: "9.8K",
        verified: true,
        chain: "Solana",
    },
    {
        rank: 3,
        name: "Market Mavericks",
        description: "Different mindset. Better results.",
        leader: "Maverick",
        leaderAvatar: "/scribbles/doge.png",
        logo: "/scribbles/btc.png",
        type: "Public",
        members: 31,
        maxMembers: 50,
        totalWins: 75,
        totalRekts: 2190,
        winRate: 71,
        rektPoints: "8.2K",
        verified: true,
        chain: "Ethereum",
    },
    {
        rank: 4,
        name: "Liquidity Legends",
        description: "Liquidity is power.",
        leader: "Aqua",
        leaderAvatar: "/scribbles/sol.png",
        logo: "/scribbles/dollars.png",
        type: "Invite Only",
        members: 27,
        maxMembers: 50,
        totalWins: 63,
        totalRekts: 1890,
        winRate: 68,
        rektPoints: "6.6K",
        verified: false,
        chain: "Solana",
    },
    {
        rank: 5,
        name: "Green Candles",
        description: "We don't guess, we predict.",
        leader: "Greeny",
        leaderAvatar: "/scribbles/pepe.png",
        logo: "/scribbles/bags.png",
        type: "Public",
        members: 23,
        maxMembers: 50,
        totalWins: 52,
        totalRekts: 1620,
        winRate: 65,
        rektPoints: "5.4K",
        verified: true,
        chain: "Ethereum",
    },
];

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ShieldIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const VerifiedIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const BlueCheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
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

const DollarIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
);

const TargetIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
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

const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const MyClansIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
);

// ─── Rank Badge ───────────────────────────────────────────────────────────────
const RankBadge = ({ rank }: { rank: number }) => {
    const colors: Record<number, { bg: string; text: string; border: string }> = {
        1: { bg: "bg-amber-400", text: "text-white", border: "border-amber-500" },
        2: { bg: "bg-gray-400", text: "text-white", border: "border-gray-500" },
        3: { bg: "bg-amber-700", text: "text-white", border: "border-amber-800" },
    };
    const style = colors[rank] ?? { bg: "bg-gray-300", text: "text-gray-700", border: "border-gray-400" };

    return (
        <div className={`absolute -top-1 -left-1 w-8 h-10 flex flex-col items-center justify-start pt-1 rounded-sm ${style.bg} ${style.text} z-10`}>
            <span className="text-xs font-bold leading-none">{rank}</span>
            {/* ribbon tail */}
            <div className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${rank === 1 ? "border-t-amber-400" : rank === 2 ? "border-t-gray-400" : rank === 3 ? "border-t-amber-700" : "border-t-gray-300"} mt-auto`} />
        </div>
    );
};

// ─── Clan Card ────────────────────────────────────────────────────────────────
const ClanCard = ({ clan }: { clan: Clan }) => {
    const router = useRouter();
    const isInviteOnly = clan.type === "Invite Only";

    const handleClick = () => {
        router.push(`/clan/${clan.name.toLowerCase().replace(/\s+/g, '-')}`);
    };

    // Generate slug from clan name
    const slug = clan.name.toLowerCase().replace(/\s+/g, '-');

    return (
        <div
            onClick={handleClick}
            className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm hover:shadow-md transition-all hover:bg-white/70 overflow-hidden cursor-pointer"
        >
            {/* Top section */}
            <div className="p-5 pb-3">
                <div className="flex gap-4">
                    {/* Logo with rank badge */}
                    <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-white/80 shadow-sm ml-2">
                            <Image
                                src={clan.logo}
                                alt={clan.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{clan.name}</h3>
                                {clan.verified && (
                                    <BlueCheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-1 leading-snug line-clamp-2">{clan.description}</p>

                        {/* Leader */}
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <Image
                                    src={clan.leaderAvatar}
                                    alt={clan.leader}
                                    width={20}
                                    height={20}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{clan.leader}</span>
                            <span className="text-xs text-gray-400">(Leader)</span>
                        </div>
                    </div>
                </div>

                {/* Type & Members row - centered */}
                <div className="flex items-center justify-center gap-3 mt-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${isInviteOnly
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : "bg-green-50 text-green-700 border-green-200"
                        }`}>
                        {isInviteOnly ? (
                            <LockIcon className="w-3 h-3" />
                        ) : (
                            <ShieldIcon className="w-3 h-3" />
                        )}
                        {clan.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        {clan.members} / {clan.maxMembers}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100/80 mx-4" />

            {/* Stats row - centered */}
            <div className="grid grid-cols-3 divide-x divide-gray-100/80 px-1 py-3">
                <div className="flex flex-col items-center justify-center gap-0.5 px-2">
                    <div className="flex items-center gap-1">
                        <TrophyIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-sm font-bold text-gray-900">{clan.totalWins}</span>
                    </div>
                    <span className="text-xs text-gray-400">Total Wins</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-0.5 px-2">
                    <div className="flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm font-bold text-gray-900">{clan.totalRekts.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-gray-400">Total Rekts</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-0.5 px-2">
                    <div className="flex items-center gap-1">
                        <TrendingUpIcon className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-sm font-bold text-gray-900">{clan.winRate}%</span>
                    </div>
                    <span className="text-xs text-gray-400">Win Rate</span>
                </div>
            </div>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClansPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All Clans");
    const [filterTime, setFilterTime] = useState("All Time");
    const [filterChain, setFilterChain] = useState("All Chains");
    const [sortBy, setSortBy] = useState("Top");

    // Dropdown state
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const timeDropdownRef = useRef<HTMLDivElement>(null);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    // Filter options for dropdowns
    const typeOptions = [
        { label: "All Clans", icon: <Users className="w-4 h-4" /> },
        { label: "Public", icon: <Shield className="w-4 h-4" /> },
        { label: "Invite Only", icon: <Lock className="w-4 h-4" /> },
    ];

    const timeOptions = [
        { label: "All Time", icon: <Clock className="w-4 h-4" /> },
        { label: "This Week", icon: <Clock className="w-4 h-4" /> },
        { label: "This Month", icon: <Clock className="w-4 h-4" /> },
    ];

    const sortOptions = [
        { label: "Top", icon: <Trophy className="w-4 h-4" /> },
        { label: "Newest", icon: <Clock className="w-4 h-4" /> },
        { label: "Members", icon: <Users className="w-4 h-4" /> },
    ];

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setIsFilterDropdownOpen(false);
            }
            if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
                setIsTimeDropdownOpen(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setIsSortDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = clansData.filter((c) => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
        const matchType =
            filterType === "All Clans" ||
            (filterType === "Public" && c.type === "Public") ||
            (filterType === "Invite Only" && c.type === "Invite Only");
        const matchChain =
            filterChain === "All Chains" || c.chain === filterChain;
        return matchSearch && matchType && matchChain;
    });

    // Layout: top 3 in a row, then remaining 2 centered
    const topThree = filtered.slice(0, 3);
    const rest = filtered.slice(3);

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Explore Clans</h1>
                        </div>
                        <p className="text-gray-500 mt-1 text-base">Team up and compete to win together</p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* <button className="flex items-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white/90 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 transition-all shadow-sm">
                            <MyClansIcon className="w-4 h-4" />
                            My Clans
                        </button> */}
                        <button className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
                            <PlusIcon className="w-4 h-4" />
                            Create Clan
                        </button>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="max-w-7xl mx-auto pb-8">
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                        {/* Search Input */}
                        <div className="relative w-full lg:flex-1 lg:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search clans..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/50 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                            />
                        </div>

                        {/* Dropdowns - Side by side on all screen sizes */}
                        <div className="flex flex-row gap-3 items-center">
                            {/* Type Dropdown */}
                            <div className="relative" ref={filterDropdownRef}>
                                <button
                                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                    className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/50 rounded-full text-sm text-gray-700 hover:bg-white/70 transition-colors justify-between flex-1"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{typeOptions.find((o) => o.label === filterType)?.icon}</span>
                                        <span>{filterType}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isFilterDropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isFilterDropdownOpen && (
                                    <div className="absolute left-0 sm:right-0 top-full mt-2 w-full sm:w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                        {typeOptions.map((option) => (
                                            <button
                                                key={option.label}
                                                onClick={() => {
                                                    setFilterType(option.label);
                                                    setIsFilterDropdownOpen(false);
                                                }}
                                                className={`w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${filterType === option.label
                                                    ? "text-black font-semibold"
                                                    : "text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {option.icon}
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative" ref={sortDropdownRef}>
                                <button
                                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                                    className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/50 rounded-full text-sm text-gray-700 hover:bg-white/70 transition-colors justify-between flex-1"
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{sortOptions.find((o) => o.label === sortBy)?.icon}</span>
                                        <span>Sort: {sortBy}</span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${isSortDropdownOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isSortDropdownOpen && (
                                    <div className="absolute left-0 sm:right-0 top-full mt-2 w-full sm:w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                        {sortOptions.map((option) => (
                                            <button
                                                key={option.label}
                                                onClick={() => {
                                                    setSortBy(option.label);
                                                    setIsSortDropdownOpen(false);
                                                }}
                                                className={`w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${sortBy === option.label
                                                    ? "text-black font-semibold"
                                                    : "text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {option.icon}
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Clan Grid ── */}
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ShieldIcon className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No clans found</h3>
                        <p className="text-gray-400">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Top 3 */}
                        {topThree.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {topThree.map((clan) => (
                                    <ClanCard key={clan.rank} clan={clan} />
                                ))}
                            </div>
                        )}

                        {/* Remaining clans — centered */}
                        {rest.length > 0 && (
                            <div className="flex justify-center">
                                <div className={`grid gap-4 w-full ${rest.length === 1
                                    ? "max-w-sm"
                                    : rest.length === 2
                                        ? "grid-cols-1 md:grid-cols-2 max-w-2xl"
                                        : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                                    }`}>
                                    {rest.map((clan) => (
                                        <ClanCard key={clan.rank} clan={clan} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
