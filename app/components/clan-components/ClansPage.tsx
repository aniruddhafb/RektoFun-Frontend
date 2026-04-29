"use client";

import { useState } from "react";
import { Clan } from "./ClanTypes";
import { clansData } from "./clansData";
import { ClanHeader } from "./ClanHeader";
import { ClanFilters } from "./ClanFilters";
import { ClanGrid } from "./ClanGrid";

export default function ClansPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All Clans");
    const [filterChain, setFilterChain] = useState("All Chains");
    const [sortBy, setSortBy] = useState("Top");

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

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ClanHeader />
                <ClanFilters
                    search={search}
                    onSearchChange={setSearch}
                    filterType={filterType}
                    onFilterTypeChange={setFilterType}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                />
                <ClanGrid clans={filtered} />
            </div>
        </div>
    );
}