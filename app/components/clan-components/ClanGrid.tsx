"use client";

import { Clan } from "./ClanTypes";
import { ClanCard } from "./ClanCard";
import { ShieldIcon } from "./Icons";

interface ClanGridProps {
    clans: Clan[];
    loading?: boolean;
    error?: string | null;
}

export function ClanGrid({ clans, loading, error }: ClanGridProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" />
                <p className="text-gray-600">Loading clans...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShieldIcon className="w-16 h-16 text-red-400 mb-4" />
                <h3 className="text-xl font-semibold text-red-600 mb-2">Failed to load clans</h3>
            </div>
        );
    }

    if (clans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShieldIcon className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No clans found</h3>
                <p className="text-gray-400">Try adjusting your search or filters.</p>
            </div>
        );
    }

    // Layout: top 3 in a row, then remaining centered
    const topThree = clans.slice(0, 3);
    const rest = clans.slice(3);

    return (
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
    );
}