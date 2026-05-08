"use client";

import React from "react";

type TabType = "challenges" | "activity";

interface ProfileTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
    const tabs: { id: TabType; label: string }[] = [
        { id: "challenges", label: "Challenges" },
        { id: "activity", label: "Activity" },
    ];

    return (
        <div className="mt-8 border-b border-gray-300/50">
            <div className="flex gap-1 bg-white/30 rounded-t-lg p-1 inline-flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}