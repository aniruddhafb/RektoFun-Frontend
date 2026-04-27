"use client";

import React from "react";
import Image from "next/image";

interface ActivityItem {
    id: string;
    type: "bet" | "win" | "follow" | "buy";
    user: {
        name: string;
        avatar: string;
    };
    action: string;
    target?: string;
    amount?: string;
    details: string;
    subAction?: {
        user: string;
        action: string;
        icon?: string;
        highlight?: string;
    };
    timestamp: string;
}

interface ProfileActivityProps {
    activityData: ActivityItem[];
}

export function ProfileActivity({ activityData }: ProfileActivityProps) {
    const getHighlightColor = (text?: string) => {
        if (!text) return "text-gray-500";
        if (text.includes("Up")) return "text-green-600";
        if (text.includes("Down")) return "text-red-600";
        return "text-amber-600";
    };

    return (
        <div className="mt-6 max-w-3xl">
            <div className="space-y-3">
                {activityData.map((item) => (
                    <div
                        key={item.id}
                        className="group bg-[#f8ede7] hover:bg-white/50 rounded-2xl p-4 transition-all duration-200 border border-[#e8d5c8] hover:border-[#d4b8a8] hover:shadow-lg"
                    >
                        <div className="flex items-start gap-4">
                            {/* Avatar with status */}
                            <div className="relative flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-[#d4b8a8] shadow-md bg-white`}>
                                    <Image
                                        src={item.user.avatar}
                                        alt={item.user.name}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Main Activity Line */}
                                <div className="flex flex-wrap items-center gap-x-1.5 text-sm sm:text-base leading-relaxed">
                                    <span className="font-bold text-[#2d1f1a]">
                                        {item.user.name}
                                    </span>
                                    <span className="text-[#5c4a42]">{item.action}</span>
                                    {item.amount && (
                                        <span className={`font-bold ${item.amount.includes("+") ? "text-green-700" : item.amount.includes("-") ? "text-red-700" : "text-[#2d1f1a]"}`}>
                                            {item.amount}
                                        </span>
                                    )}
                                    {item.target && (
                                        <>
                                            <span className="text-[#5c4a42]">on</span>
                                            <span className="font-semibold text-[#2d1f1a]">{item.target}</span>
                                        </>
                                    )}
                                    {item.details && (
                                        <span className="text-[#8b7355]">{item.details}</span>
                                    )}
                                </div>

                                {/* Sub Action Line */}
                                {item.subAction && (
                                    <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
                                        <div className="flex items-center gap-1.5 bg-[#f3e1d7]/50 rounded-full px-2.5 py-1">
                                            <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#d4b8a8]">
                                                <Image
                                                    src={item.user.avatar}
                                                    alt=""
                                                    width={14}
                                                    height={14}
                                                    className="w-3.5 h-3.5 object-cover"
                                                />
                                            </div>
                                            <span className="text-[#5c4a42] font-medium">{item.subAction.user}</span>
                                            <span className="text-[#8b7355]">
                                                {item.subAction.action}
                                            </span>
                                            {item.subAction.highlight && (
                                                <span
                                                    className={`font-semibold ${getHighlightColor(
                                                        item.subAction.highlight
                                                    )}`}
                                                >
                                                    {item.subAction.highlight}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[#a08070] text-xs">• {item.timestamp}</span>
                                    </div>
                                )}

                                {/* Timestamp for items without subAction */}
                                {!item.subAction && (
                                    <div className="mt-1.5">
                                        <span className="text-[#a08070] text-xs">{item.timestamp}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <button
                                className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f3e1d7]/50 hover:bg-[#2d1f1a] text-[#5c4a42] hover:text-[#f3e1d7] transition-all duration-200 flex items-center justify-center group-hover:shadow-md"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More Button */}
            <div className="mt-8 text-center">
                <button className="px-8 py-3.5 bg-[#2d1f1a] hover:bg-[#3d2f2a] text-[#f3e1d7] rounded-full text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                    Load More Activity
                </button>
            </div>
        </div>
    );
}