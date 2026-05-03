"use client";

import { Search, ChevronDown } from "lucide-react";
import { filterOptions } from "./types";

interface FilterBarProps {
    selectedFilter: string;
    onFilterChange: (filter: string) => void;
    filterOpen: boolean;
    onFilterOpenChange: (open: boolean) => void;
}

export function FilterBar({
    selectedFilter,
    onFilterChange,
    filterOpen,
    onFilterOpenChange,
}: FilterBarProps) {
    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                {/* Search - Bigger */}
                <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search challenges..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => onFilterOpenChange(!filterOpen)}
                        className="flex items-center justify-between gap-3 px-5 py-3.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all min-w-[180px]"
                    >
                        <span className="font-medium text-gray-700">{selectedFilter}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {filterOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => onFilterOpenChange(false)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                                {filterOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            onFilterChange(option);
                                            onFilterOpenChange(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedFilter === option
                                            ? "bg-amber-50 text-amber-700"
                                            : "text-gray-700"
                                            }`}
                                    >
                                        <span className="font-medium">{option}</span>
                                        {selectedFilter === option && (
                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}