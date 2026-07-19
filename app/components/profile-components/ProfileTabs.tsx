"use client";

import React from "react";
import { ChevronDown, Search, TrendingUp } from "lucide-react";

export type ProfileTabType = "challenges" | "past" | "redeem" | "activity";

interface ProfileTabsProps {
    activeTab: ProfileTabType;
    onTabChange: (tab: ProfileTabType) => void;
    isOwnProfile?: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortOrder: "latest" | "oldest";
    onSortChange: (order: "latest" | "oldest") => void;
}

export function ProfileTabs({ activeTab, onTabChange, searchQuery, onSearchChange, sortOrder, onSortChange, isOwnProfile = false }: ProfileTabsProps) {
    const tabs: { id: ProfileTabType; label: string }[] = [
        { id: "challenges", label: "Challenges" },
        { id: "past", label: "Past Wins" },
        ...(isOwnProfile ? [{ id: "redeem" as const, label: "Redeem" }] : []),
        { id: "activity", label: "Activity" },
    ];

    return (
        <div className="mt-8 flex flex-col gap-3 border-b border-gray-300/50 pb-3 lg:flex-row lg:items-center lg:justify-between">
            <div
                className="grid h-11 w-full border-2 border-black bg-white/60 p-1 shadow-[3px_3px_0_rgba(0,0,0,0.14)] sm:w-auto"
                style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        aria-pressed={activeTab === tab.id}
                        className={`relative h-8 cursor-pointer px-3 text-xs font-black transition-colors sm:text-sm ${activeTab === tab.id
                                ? "bg-black text-white shadow-[2px_2px_0_#e85a2d]"
                                : "bg-transparent text-gray-500 hover:bg-[#fff4e9] hover:text-gray-950"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <div className="relative w-full sm:min-w-72 lg:w-96">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder={`Search ${activeTab}...`}
                        className="h-11 w-full border-2 border-black bg-white/70 pl-10 pr-4 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:bg-white"
                    />
                </div>
                <div className="relative min-w-48">
                    <TrendingUp className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <select
                        value={sortOrder}
                        onChange={(event) => onSortChange(event.target.value as "latest" | "oldest")}
                        className="h-11 w-full cursor-pointer appearance-none border-2 border-black bg-white/70 pl-10 pr-10 text-sm font-bold text-gray-800 outline-none focus:bg-white"
                        aria-label={`Sort ${activeTab}`}
                    >
                        <option value="latest">Latest</option>
                        <option value="oldest">Oldest</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
            </div>
        </div>
    );
}
