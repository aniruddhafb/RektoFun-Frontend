import { useState, useMemo } from "react";
import ChallengeCard from "./ChallengeCard";
import { ClanChallenge } from "./types";

type SortOption = "latest" | "expiring-soon" | "ongoing" | "expired";

interface ClanChallengesProps {
    challenges: ClanChallenge[];
}

const ClanChallenges = ({ challenges }: ClanChallengesProps) => {
    const [activeTab, setActiveTab] = useState<"friendly" | "wars">("friendly");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("latest");

    const filteredAndSortedChallenges = useMemo(() => {
        let filtered = [...challenges];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.title.toLowerCase().includes(query) ||
                    c.asset.toLowerCase().includes(query) ||
                    c.creator.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortOption) {
                case "latest":
                    // Sort by createdAgo (newest first) - simplistic approach
                    return 0; // Keep original order for now
                case "expiring-soon":
                    // Challenges with sooner expiration first
                    return 0; // Would need proper date parsing
                case "ongoing":
                    // Ongoing challenges first
                    return 0;
                case "expired":
                    // Expired challenges first
                    return 0;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [challenges, searchQuery, sortOption]);

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5 flex flex-col max-h-[600px]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900">
                    {activeTab === "friendly" ? "Friendly Clan Challenges" : "Clan Wars"}
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
            {/* Filters Section - Outside Scroll Area */}
            {activeTab === "friendly" && (
                <div className="flex gap-3 mb-4 flex-shrink-0">
                    {/* Search Input */}
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
                    {/* Sort Dropdown */}
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
            {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin">
                {activeTab === "friendly" ? (
                    <div className="space-y-4">
                        {filteredAndSortedChallenges.map((challenge) => (
                            <ChallengeCard key={challenge.id} challenge={challenge} />
                        ))}
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
    );
};

export default ClanChallenges;
