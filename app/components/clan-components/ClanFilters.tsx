"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Clock, Shield, Lock, Users, Trophy } from "lucide-react";
import { PlusIcon, MyClansIcon } from "./Icons";

interface ClanFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    filterType: string;
    onFilterTypeChange: (value: string) => void;
    sortBy: string;
    onSortByChange: (value: string) => void;
}

export function ClanFilters({
    search,
    onSearchChange,
    filterType,
    onFilterTypeChange,
    sortBy,
    onSortByChange,
}: ClanFiltersProps) {
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    const typeOptions = [
        { label: "All Clans", icon: <Users className="w-4 h-4" /> },
        { label: "Public", icon: <Shield className="w-4 h-4" /> },
        { label: "Invite Only", icon: <Lock className="w-4 h-4" /> },
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
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
                setIsSortDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="max-w-7xl mx-auto pb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                {/* Search Input */}
                <div className="relative w-full lg:flex-1 lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search clans..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
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
                                            onFilterTypeChange(option.label);
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
                                            onSortByChange(option.label);
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
    );
}