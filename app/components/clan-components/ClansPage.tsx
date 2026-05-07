"use client";

import { useState, useEffect } from "react";
import { Clan } from "./ClanTypes";
import { ClanHeader } from "./ClanHeader";
import { ClanFilters } from "./ClanFilters";
import { ClanGrid } from "./ClanGrid";
import { getClans } from "@/app/lib/clan-service/clans";

const CLANS_PER_PAGE = 10;
type GetClansResult = Awaited<ReturnType<typeof getClans>>;
const inFlightClanRequests = new Map<string, Promise<GetClansResult>>();

function getClansDeduped(limit: number, offset: number): Promise<GetClansResult> {
    const key = `${limit}-${offset}`;
    const existingRequest = inFlightClanRequests.get(key);
    if (existingRequest) return existingRequest;

    const request = getClans(limit, offset).finally(() => {
        inFlightClanRequests.delete(key);
    });
    inFlightClanRequests.set(key, request);
    return request;
}

export default function ClansPage() {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All Clans");
    const [filterChain, setFilterChain] = useState("All Chains");
    const [sortBy, setSortBy] = useState("Top");

    const [clans, setClans] = useState<Clan[]>([]);
    const [totalClans, setTotalClans] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClans = async (page: number) => {
        setLoading(true);
        setError(null);
        try {
            const offset = (page - 1) * CLANS_PER_PAGE;
            const result = await getClansDeduped(CLANS_PER_PAGE, offset);
            setClans(result.clans);
            setTotalClans(result.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch clans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClans(currentPage);
    }, [currentPage]);

    const totalPages = Math.ceil(totalClans / CLANS_PER_PAGE);

    const filtered = clans.filter((c) => {
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
                <ClanHeader onClanCreated={() => fetchClans(currentPage)} />
                <ClanFilters
                    search={search}
                    onSearchChange={setSearch}
                    filterType={filterType}
                    onFilterTypeChange={setFilterType}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                />
                <ClanGrid clans={filtered} loading={loading} error={error} />

                {/* Pagination Controls */}
                {!loading && !error && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-gray-700 font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
