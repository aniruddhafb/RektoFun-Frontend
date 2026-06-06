"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Clock, TrendingUp, Eye, Bookmark, PinIcon, Shapes } from "lucide-react";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

interface ChallengeFiltersSectionProps {
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    activeAsset: string;
    setActiveAsset: (asset: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    marketOptions: string[];
}

const filterOptions: { label: string; icon: React.ReactNode }[] = [
    { label: "Latest", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Expiring Soon", icon: <Clock className="w-4 h-4" /> },
    { label: "Pinned", icon: <PinIcon className="w-4 h-4 rotate-45" /> },
    { label: "My Bets", icon: <Bookmark className="w-4 h-4" /> },
    { label: "Created By Me", icon: <Eye className="w-4 h-4" /> },
];

export function ChallengeFiltersSection({
    activeFilter,
    setActiveFilter,
    activeAsset,
    setActiveAsset,
    searchQuery,
    setSearchQuery,
    marketOptions,
}: ChallengeFiltersSectionProps) {
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    useBodyScrollLock(isMobileFiltersOpen);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const marketDropdownRef = useRef<HTMLDivElement>(null);

    // Close filter dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setIsFilterDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close market dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (marketDropdownRef.current && !marketDropdownRef.current.contains(event.target as Node)) {
                setIsMarketDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getCurrentFilterIcon = () => {
        return filterOptions.find((o) => o.label === activeFilter)?.icon || <Clock className="w-4 h-4" />;
    };

    return (
        <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
            <div className="flex flex-col items-stretch gap-3 sm:gap-3 lg:flex-row lg:items-center">
                {/* Search Input */}
                <div className="relative hidden w-full sm:block lg:max-w-md lg:flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search challenges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-full border border-black/15 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-[2px_2px_0_rgba(0,0,0,0.16)] placeholder:text-gray-400 outline-none transition hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)] focus:border-black/25 focus:bg-white focus:ring-4 focus:ring-gray-900/[0.04]"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-black/15 bg-white/75 px-4 py-3 text-sm font-medium text-gray-800 !shadow-none transition hover:border-black/25 hover:bg-white hover:!shadow-none active:!shadow-none sm:hidden"
                >
                    <span>Filters</span>
                    <span className="max-w-[65%] truncate text-right text-xs text-gray-500">
                        {activeFilter} • {activeAsset}
                    </span>
                </button>

                {/* Desktop Dropdowns */}
                <div className="hidden w-full items-stretch gap-3 sm:grid sm:grid-cols-2 lg:w-auto">
                    {/* First Dropdown - Filter Options */}
                    <div className="relative w-full min-w-0" ref={filterDropdownRef}>
                        <button
                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${isFilterDropdownOpen
                                ? "border-black/25 bg-white text-gray-950 shadow-[3px_3px_0_rgba(0,0,0,0.2)] ring-4 ring-gray-900/[0.04]"
                                : "border-black/15 bg-white/70 text-gray-700 hover:border-black/25 hover:bg-white hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)]"
                                }`}
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="text-gray-500">{getCurrentFilterIcon()}</span>
                                <span className="truncate">{activeFilter}</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isFilterDropdownOpen ? "rotate-180 text-gray-700" : ""}`} />
                        </button>

                        {isFilterDropdownOpen && (
                            <div className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-black/15 bg-white p-1.5 sm:w-auto sm:min-w-[14rem]">
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.label}
                                        onClick={() => {
                                            setActiveFilter(option.label);
                                            setIsFilterDropdownOpen(false);
                                        }}
                                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeFilter === option.label
                                            ? "bg-gray-950 font-semibold text-white"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
                                            }`}
                                    >
                                        <span className={activeFilter === option.label ? "text-white" : "text-gray-500"}>{option.icon}</span>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Second Dropdown - Market Options */}
                    <div className="relative w-full min-w-0" ref={marketDropdownRef}>
                        <button
                            onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
                            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${isMarketDropdownOpen
                                ? "border-black/25 bg-white text-gray-950 shadow-[3px_3px_0_rgba(0,0,0,0.2)] ring-4 ring-gray-900/[0.04]"
                                : "border-black/15 bg-white/70 text-gray-700 hover:border-black/25 hover:bg-white hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)]"
                                }`}
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <Shapes className="h-4 w-4 text-gray-500" />
                                <span className="truncate">{activeAsset}</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isMarketDropdownOpen ? "rotate-180 text-gray-700" : ""}`} />
                        </button>

                        {isMarketDropdownOpen && (
                            <div className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-black/15 bg-white p-1.5 sm:w-auto sm:min-w-[14rem]">
                                {marketOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setActiveAsset(option);
                                            setIsMarketDropdownOpen(false);
                                        }}
                                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeAsset === option
                                            ? "bg-gray-950 font-semibold text-white"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
                                            }`}
                                    >
                                        <Shapes className={`h-4 w-4 ${activeAsset === option ? "text-white" : "text-gray-500"}`} />
                                        <span className="truncate">{option}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isMobileFiltersOpen && (
                <div className="sm:hidden fixed inset-0 z-50">
                    <button
                        type="button"
                        aria-label="Close filters"
                        onClick={() => setIsMobileFiltersOpen(false)}
                        className="absolute inset-0 bg-black/40"
                    />

                    <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border border-b-0 border-black/[0.06] bg-white p-4 pb-6">
                        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />

                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Challenge Filters</h3>
                            <button
                                type="button"
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="px-2 py-1 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-5">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Search</p>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search challenges..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-black/[0.07] py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-900/[0.04]"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Sort By</p>
                            <div className="space-y-2">
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.label}
                                        onClick={() => {
                                            setActiveFilter(option.label);
                                            setIsMobileFiltersOpen(false);
                                        }}
                                        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${activeFilter === option.label
                                            ? "border-gray-950 bg-gray-950 font-semibold text-white"
                                            : "border-black/[0.07] text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Market</p>
                            <div className="space-y-2">
                                {marketOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setActiveAsset(option);
                                            setIsMobileFiltersOpen(false);
                                        }}
                                        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${activeAsset === option
                                            ? "border-gray-950 bg-gray-950 font-semibold text-white"
                                            : "border-black/[0.07] text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        <Shapes className="h-4 w-4" />
                                        <span className="truncate block">{option}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
