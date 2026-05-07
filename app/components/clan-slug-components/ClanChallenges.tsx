import { useState, useMemo, useEffect } from "react";
import ChallengeCard from "./ClanChallengeCard";
import ChallengeDetailModal from "../challenge-components/ChallengeDetailModal";
import { CreateChallengeModal } from "../challenge-components/CreateChallengeModal";
import { ClanChallenge } from "./types";
import { getClanMembers } from "@/app/lib/clan-service/clanMembers";
import { ChallengeListItem, getChallenges } from "@/app/lib/challenges-service/challenges";

type SortOption = "latest" | "expiring-soon" | "ongoing" | "expired";

type EnrichedClanChallenge = {
    card: ClanChallenge;
    sourceChallenge: ChallengeListItem;
};

interface ClanChallengesProps {
    clanId: string;
}

const ASSET_COLORS: Record<string, string> = {
    BTC: "#F7931A",
    ETH: "#627EEA",
    SOL: "#9945FF",
};

function formatRelativeTime(dateValue: string): string {
    const ts = new Date(dateValue).getTime();
    if (Number.isNaN(ts)) return "recently";

    const diffMs = Date.now() - ts;
    if (diffMs < 0) return "just now";

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;

    return "just now";
}

function formatCountdown(dateValue: string): string {
    const ts = new Date(dateValue).getTime();
    if (Number.isNaN(ts)) return "N/A";

    const diffMs = ts - Date.now();
    if (diffMs <= 0) return "Expired";

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function mapChallengeToCard(challenge: ChallengeListItem): EnrichedClanChallenge {
    const asset = challenge.market?.name || "Asset";
    const creatorName = challenge.creator?.username || "Creator";
    const creatorAvatar = challenge.creator?.profile_image || "/profiles/1.svg";
    const opponentName = challenge.opponent_info?.username || "No one yet!";
    const opponentAvatar = challenge.opponent_info?.profile_image || "/profiles/1.svg";
    const isAccepted =
        challenge.status === "locked" ||
        challenge.status === "resolved" ||
        Boolean(challenge.opponent_info?.wallet_address || challenge.opponent_info?.username);

    return {
        sourceChallenge: challenge,
        card: {
            id: Number.isFinite(Number(challenge.id)) ? Number(challenge.id) : Date.now(),
            title: challenge.title,
            asset,
            assetColor: ASSET_COLORS[asset.toUpperCase()] || "#2d1f1a",
            creator: creatorName,
            mode: challenge.mode === "pool" ? "Multi Mode" : "PVP Mode",
            challenger: {
                name: creatorName,
                avatar: creatorAvatar,
                label: "CHALLENGER",
                sublabel: "Created",
                pool: `$${Number(challenge.total_pool || challenge.initial_bet || 0)}`,
            },
            opponent: isAccepted
                ? {
                    name: opponentName,
                    avatar: opponentAvatar,
                    label: "opponent",
                    sublabel: "Defending",
                }
                : null,
            action: challenge.mode === "pool" ? "JOIN CHALLENGE" : "ACCEPT",
            expiresIn: formatCountdown(challenge.expire_time),
            createdAgo: formatRelativeTime(challenge.created_at),
            shares: 0,
            views: 0,
        },
    };
}

const ClanChallenges = ({ clanId }: ClanChallengesProps) => {
    const [activeTab, setActiveTab] = useState<"friendly" | "wager" | "wars">("wager");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("latest");
    const [items, setItems] = useState<EnrichedClanChallenge[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        const interval = window.setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadLeaderChallenges = async () => {
            if (!clanId) return;

            try {
                setLoading(true);

                const membersResponse = await getClanMembers(clanId);
                const leaders = membersResponse.members.filter((member) => member.role === "Leader");

                if (leaders.length === 0) {
                    if (!cancelled) setItems([]);
                    return;
                }

                const challengeResponses = await Promise.all(
                    leaders.map((leader) =>
                        getChallenges({
                            created_by: leader.id,
                            sort: "latest",
                            limit: 10,
                        }),
                    ),
                );

                const mergedChallenges = challengeResponses
                    .flatMap((response) => response.challenges)
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                const uniqueById = new Map<string, ChallengeListItem>();
                for (const challenge of mergedChallenges) {
                    if (!uniqueById.has(challenge.id)) uniqueById.set(challenge.id, challenge);
                }

                if (!cancelled) {
                    setItems(Array.from(uniqueById.values()).slice(0, 20).map(mapChallengeToCard));
                }
            } catch (error) {
                console.error("Failed to fetch clan leader challenges:", error);
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadLeaderChallenges();

        return () => {
            cancelled = true;
        };
    }, [clanId, refreshKey]);

    const filteredAndSortedChallenges = useMemo(() => {
        let filtered = [...items];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                ({ card }) =>
                    card.title.toLowerCase().includes(query) ||
                    card.asset.toLowerCase().includes(query) ||
                    card.creator.toLowerCase().includes(query),
            );
        }

        filtered.sort((a, b) => {
            if (sortOption === "latest") {
                return new Date(b.sourceChallenge.created_at).getTime() - new Date(a.sourceChallenge.created_at).getTime();
            }
            if (sortOption === "expiring-soon") {
                return new Date(a.sourceChallenge.expire_time).getTime() - new Date(b.sourceChallenge.expire_time).getTime();
            }
            if (sortOption === "ongoing") {
                const aOngoing = a.sourceChallenge.status === "locked" ? 1 : 0;
                const bOngoing = b.sourceChallenge.status === "locked" ? 1 : 0;
                return bOngoing - aOngoing;
            }
            if (sortOption === "expired") {
                const aExpired = new Date(a.sourceChallenge.expire_time).getTime() < currentTime ? 1 : 0;
                const bExpired = new Date(b.sourceChallenge.expire_time).getTime() < currentTime ? 1 : 0;
                return bExpired - aExpired;
            }
            return 0;
        });

        return filtered;
    }, [items, searchQuery, sortOption, currentTime]);

    return (
        <>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5 flex flex-col max-h-[600px]">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">
                        {activeTab === "friendly"
                            ? "Friendly Challenges"
                            : activeTab === "wager"
                                ? "Wager Challenges"
                                : "Clan Wars"}
                    </h2>
                    <div className="flex bg-gray-200/60 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("friendly")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "friendly"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Friendly
                        </button>
                        <button
                            onClick={() => setActiveTab("wager")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "wager"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Wager
                        </button>
                        <button
                            onClick={() => setActiveTab("wars")}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "wars"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Clan Wars
                        </button>
                    </div>
                </div>

                {activeTab === "wager" && (
                    <div className="flex gap-3 mb-4 flex-shrink-0">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search challenges..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-transparent bg-white/80"
                            />
                            <svg
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white/80 cursor-pointer"
                        >
                            <option value="latest">Latest</option>
                            <option value="expiring-soon">Expiring Soon</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                )}

                <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin">
                    {activeTab === "wager" ? (
                        loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-gray-600">Loading latest leader challenges...</p>
                            </div>
                        ) : filteredAndSortedChallenges.length > 0 ? (
                            <div className="space-y-4">
                                {filteredAndSortedChallenges.map(({ card, sourceChallenge }) => (
                                    <ChallengeCard
                                        key={sourceChallenge.id}
                                        challenge={card}
                                        sourceChallenge={sourceChallenge}
                                        sourceChallengeId={sourceChallenge.id}
                                        onChallengeOpen={(challenge) => {
                                            setSelectedChallenge(challenge);
                                            setIsModalOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Wager Challenges Yet!</h3>
                                <p className="text-gray-600 max-w-md">
                                    Wager challenges will appear here as soon as they are created.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="mt-5 px-5 py-2.5 rounded-lg font-bold text-sm text-white bg-gradient-to-r from-green-700 to-green-600 shadow-sm hover:opacity-90 active:scale-95 transition-all"
                                >
                                    Create Wager
                                </button>
                            </div>
                        )
                    ) : activeTab === "friendly" ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Friendly Challenges Coming Soon</h3>
                            <p className="text-gray-600 max-w-md">
                                Friendly challenges for clan members are under development.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-6xl mb-4">🏆</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Clan Wars Coming Soon</h3>
                            <p className="text-gray-600 max-w-md">
                                Get ready for epic battles! Clan Wars will allow your clan to compete against other clans in intense prediction competitions.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedChallenge(null);
                }}
            />
            <CreateChallengeModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => {
                    setIsCreateModalOpen(false);
                    setRefreshKey((prev) => prev + 1);
                }}
            />
        </>
    );
};

export default ClanChallenges;
