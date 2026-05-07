"use client";

import { ChevronDown } from "lucide-react";
import { statusFilterOptions, modeFilterOptions } from "./types";

interface FilterBarProps {
    selectedStatus: string;
    onStatusChange: (status: string) => void;
    selectedMode: string;
    onModeChange: (mode: string) => void;
    statusOpen: boolean;
    onStatusOpenChange: (open: boolean) => void;
    modeOpen: boolean;
    onModeOpenChange: (open: boolean) => void;
}

export function FilterBar({
    selectedStatus,
    onStatusChange,
    selectedMode,
    onModeChange,
    statusOpen,
    onStatusOpenChange,
    modeOpen,
    onModeOpenChange,
}: FilterBarProps) {
    return (
        <div className="flex items-center justify-end gap-2">
            {/* Status Filter Dropdown */}
            <div className="relative">
                <button
                    onClick={() => {
                        onStatusOpenChange(!statusOpen);
                        if (modeOpen) onModeOpenChange(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-sm whitespace-nowrap"
                >
                    <span className="text-gray-700 font-medium">{selectedStatus}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${statusOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Status Dropdown Menu */}
                {statusOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => onStatusOpenChange(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                            {statusFilterOptions.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        onStatusChange(option);
                                        onStatusOpenChange(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${selectedStatus === option
                                        ? "bg-amber-50 text-amber-700"
                                        : "text-gray-700"
                                        }`}
                                >
                                    <span className="font-medium">{option}</span>
                                    {selectedStatus === option && (
                                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Mode Filter Dropdown */}
            <div className="relative">
                <button
                    onClick={() => {
                        onModeOpenChange(!modeOpen);
                        if (statusOpen) onStatusOpenChange(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-sm whitespace-nowrap"
                >
                    <span className="text-gray-700 font-medium">{selectedMode}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${modeOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Mode Dropdown Menu */}
                {modeOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => onModeOpenChange(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                            {modeFilterOptions.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        onModeChange(option);
                                        onModeOpenChange(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${selectedMode === option
                                        ? "bg-amber-50 text-amber-700"
                                        : "text-gray-700"
                                        }`}
                                >
                                    <span className="font-medium">{option}</span>
                                    {selectedMode === option && (
                                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    );
}