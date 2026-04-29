"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Activity types
type ActivityType = "all" | "bets" | "wins" | "follows";

// Activity item interface
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

// Mock activity data
const activityData: ActivityItem[] = [
    {
        id: "1",
        type: "bet",
        user: { name: "WhaleKing", avatar: "/scribbles/sol.png" },
        action: "bet",
        amount: "1.5 SOL",
        target: "Solana Above $170",
        details: "in 20 h",
        subAction: {
            user: "SOL",
            action: "bought",
            highlight: "🎫",
        },
        timestamp: "1hr ago",
    },
    {
        id: "2",
        type: "bet",
        user: { name: "Brenda", avatar: "/scribbles/pepe.png" },
        action: "bet",
        amount: "0.9 SOL",
        target: "Pepe Below 0.000010",
        details: "in 2 h",
        subAction: {
            user: "Brenda",
            action: "bought",
            highlight: "Down 9x",
        },
        timestamp: "9m ago",
    },
    {
        id: "3",
        type: "win",
        user: { name: "TraderX", avatar: "/scribbles/sol.png" },
        action: "hit jackpot!",
        amount: "+110 SOL",
        details: "",
        subAction: {
            user: "CryptoNinja",
            action: "bought",
            highlight: "🎫",
        },
        timestamp: "19m ago",
    },
    {
        id: "4",
        type: "bet",
        user: { name: "CryptoNinja", avatar: "/scribbles/pepe.png" },
        action: "bet",
        amount: "3.5 SOL",
        target: "Ethereum Below $3,200",
        details: "",
        subAction: {
            user: "SOL",
            action: "bought",
            highlight: "🎫 x3.5 SOL",
        },
        timestamp: "27m ago",
    },
    {
        id: "5",
        type: "follow",
        user: { name: "DegenLord", avatar: "/scribbles/doge.png" },
        action: "followed",
        target: "WhaleKing",
        details: "x1.5 SOL bet",
        subAction: {
            user: "SOL",
            action: "bought",
            highlight: "🥞",
        },
        timestamp: "35m ago",
    },
    {
        id: "6",
        type: "buy",
        user: { name: "ChadDegenerate", avatar: "/scribbles/btc.png" },
        action: "bought",
        amount: "Up x2.7 SOL",
        target: "Bitcoin Above $65,500",
        details: "",
        subAction: {
            user: "Bitcoin",
            action: "bought",
            highlight: "Up",
        },
        timestamp: "750m ago",
    },
    {
        id: "7",
        type: "bet",
        user: { name: "CryptoQueen", avatar: "/scribbles/pengu.png" },
        action: "YOLO bet",
        amount: "Up x1 SOL",
        target: "Dogewhale",
        details: "🐶",
        subAction: {
            user: "CryptoQueen",
            action: "bought",
            highlight: "Up",
        },
        timestamp: "1hr ago",
    },
];

// Filter tabs
const filterTabs: { label: string; value: ActivityType; count?: number }[] = [
    { label: "All Activity", value: "all" },
    { label: "Created", value: "bets" },
    { label: "Accepted", value: "wins" },
    { label: "Expired", value: "follows" }
];

export default function ActivityPage() {
    const [activeFilter, setActiveFilter] = useState<ActivityType>("all");

    // Filter activities based on selected filter
    const filteredActivities = activityData.filter((item) => {
        if (activeFilter === "all") return true;
        return item.type === activeFilter.slice(0, -1);
    });

    // Get highlight color based on text
    const getHighlightColor = (text?: string) => {
        if (!text) return "text-gray-500";
        if (text.includes("Up")) return "text-green-600";
        if (text.includes("Down")) return "text-red-600";
        return "text-amber-600";
    };



    return (
        <div className="min-h-screen bg-[#f3e1d7]">
            {/* Header Section */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#2d1f1a]">
                        Activity
                    </h1>
                </div>
                <p className="text-[#5c4a42] text-sm sm:text-base">
                    View the latest challenges and bets made across Rekto.fun.
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveFilter(tab.value)}
                            className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${activeFilter === tab.value
                                ? "bg-[#2d1f1a] text-[#f3e1d7] shadow-md"
                                : "bg-white/80 text-[#5c4a42] hover:bg-white hover:text-[#2d1f1a] border border-[#d4b8a8]"
                                }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeFilter === tab.value ? "bg-[#f3e1d7]/20" : "bg-[#f3e1d7]"}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity Feed */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="space-y-3">
                    {filteredActivities.map((item) => {
                        return (
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
                                            <Link
                                                href={`/profile/${item.user.name}`}
                                                className="font-bold text-[#2d1f1a] hover:text-[#5c4a42] transition-colors"
                                            >
                                                {item.user.name}
                                            </Link>
                                            <span className="text-[#5c4a42]">{item.action}</span>
                                            {item.amount && (
                                                <span className={`font-bold ${item.amount.includes("+") ? "text-green-700" : item.amount.includes("Up") ? "text-green-700" : "text-[#2d1f1a]"}`}>
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
                                    <Link
                                        href={`/activity/${item.id}`}
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
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Load More Button */}
                <div className="mt-8 text-center">
                    <button className="px-8 py-3.5 bg-white/50 border border-gray-300 hover:bg-white/80 text-black rounded-full text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                        Load More Activity
                    </button>
                </div>
            </div>

            {/* Custom scrollbar hide styles */}
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
