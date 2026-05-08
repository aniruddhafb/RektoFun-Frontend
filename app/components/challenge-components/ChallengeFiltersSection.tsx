"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Clock, TrendingUp, Eye, Bookmark, PinIcon } from "lucide-react";

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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                {/* Search Input */}
                <div className="relative w-full lg:flex-1 lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search challenges..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/50 rounded-full border border-gray-400 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    />
                </div>

                {/* Dropdowns - Side by side on all screen sizes */}
                <div className="flex flex-row gap-3 items-center">
                    {/* First Dropdown - Filter Options */}
                    <div className="relative" ref={filterDropdownRef}>
                        <button
                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            className=" border border-gray-400 cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/50 rounded-full text-sm text-gray-700 hover:bg-white/70 transition-colors justify-between flex-1"
                        >
                            <div className="flex items-center gap-2">
                                <span>{getCurrentFilterIcon()}</span>
                                <span>{activeFilter}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isFilterDropdownOpen && (
                            <div className="absolute left-0 sm:right-0 top-full mt-2 w-full sm:w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.label}
                                        onClick={() => {
                                            setActiveFilter(option.label);
                                            setIsFilterDropdownOpen(false);
                                        }}
                                        className={`w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${activeFilter === option.label
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

                    {/* Second Dropdown - Market Options */}
                    <div className="relative" ref={marketDropdownRef}>
                        <button
                            onClick={() => setIsMarketDropdownOpen(!isMarketDropdownOpen)}
                            className=" border border-gray-400 cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/50 rounded-full text-sm text-gray-700 hover:bg-white/70 transition-colors justify-between flex-1"
                        >
                            <div className="flex items-center gap-2">
                                <span>{activeAsset}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isMarketDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isMarketDropdownOpen && (
                            <div className="absolute left-0 sm:right-0 top-full mt-2 w-full sm:w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                {marketOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setActiveAsset(option);
                                            setIsMarketDropdownOpen(false);
                                        }}
                                        className={`w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${activeAsset === option
                                            ? "text-black font-semibold"
                                            : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
