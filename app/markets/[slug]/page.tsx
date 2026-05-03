"use client";

import { useState } from "react";
import { CreateChallengeModal } from "../../components/challenge-components/CreateChallengeModal";
import { MarketHeader } from "../../components/market-slug-components/MarketHeader";
import { ChartSection } from "../../components/market-slug-components/ChartSection";
import { TopTradersSection } from "../../components/market-slug-components/TopTradersSection";
import { FilterBar } from "../../components/market-slug-components/FilterBar";
import { MarketChallengesGrid } from "../../components/market-slug-components/MarketChallengesGrid";
import { PLACEHOLDER_CHALLENGES } from "../../components/market-slug-components/types";

export default function MarketPage({ params }: { params: { slug: string } }) {
    const [showChart, setShowChart] = useState(true);
    const [showTopTraders, setShowTopTraders] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("Latest");
    const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Header Section */}
                <MarketHeader
                    marketName="Bitcoin Challenge Markets"
                    marketDescription="Predict and earn by betting on Bitcoin market movements"
                    marketLogo="/scribbles/btc.png"
                    onCreateChallenge={() => setIsCreateChallengeOpen(true)}
                />

                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">

                        {/* Chart Section */}
                        <ChartSection
                            showChart={showChart}
                            onToggleChart={() => setShowChart(!showChart)}
                        />

                        {/* Top Traders Section */}
                        <TopTradersSection
                            showTopTraders={showTopTraders}
                            onToggleTopTraders={() => setShowTopTraders(!showTopTraders)}
                        />

                        {/* Filter Bar */}
                        <FilterBar
                            selectedFilter={selectedFilter}
                            onFilterChange={setSelectedFilter}
                            filterOpen={filterOpen}
                            onFilterOpenChange={setFilterOpen}
                        />

                        {/* Challenge Cards Grid */}
                        <MarketChallengesGrid challenges={PLACEHOLDER_CHALLENGES} />
                    </div>
                </div>
            </div>

            <CreateChallengeModal
                isOpen={isCreateChallengeOpen}
                onClose={() => setIsCreateChallengeOpen(false)}
                onCreated={() => { }}
            />
        </div>
    );
}
