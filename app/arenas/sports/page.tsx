"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Users, Trophy, Sparkles, Calendar, Clock } from "lucide-react";
import Link from "next/link";

const sports = [
    {
        id: "ipl-2026",
        slug: "ipl",
        title: "IPL 2026",
        subtitle: "Indian Premier League",
        description:
            "Predict match winners, top scorers, and tournament outcomes for the biggest cricket league in the world.",
        teams: "10",
        matches: "74",
        traders: "28.5K",
        accentColor: "#d4a843",
        gradientFrom: "#1a3a6b",
        gradientTo: "#1e4a8a",
        icon: "/scribbles/coins.png",
        image: "/sports/ipl.png",
    },
    {
        id: "fifa-2026",
        slug: "fifa",
        title: "FIFA World Cup 2026",
        subtitle: "The Greatest Show on Earth",
        description:
            "Bet on group stage results, knockout predictions, and the ultimate champion of the 2026 FIFA World Cup.",
        teams: "48",
        matches: "104",
        traders: "42.1K",
        accentColor: "#e8c84a",
        gradientFrom: "#1b4d3e",
        gradientTo: "#236a54",
        icon: "/scribbles/coins.png",
        image: "/sports/fifa.png",
    },
];

export default function SportsPage() {
    return (
        <div className="min-h-screen bg-[#f3e1d7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Header */}
                <div className="text-center mb-10 sm:mb-14">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
                        Sports Arenas
                    </h1>
                    <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
                        Predict outcomes, trade with others, and earn rewards on the biggest sporting
                        events of the year.
                    </p>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
                    {sports.map((sport) => (
                        <Link
                            href={`/arenas/sports/${sport.slug}`}
                            key={sport.id}
                            className="bg-[#f8ede7] rounded-2xl p-5 shadow-sm border border-gray-400 hover:shadow-lg transition-all duration-300"
                        >

                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-full overflow-hidden"
                                    >
                                        <Image
                                            src={sport.image}
                                            alt={sport.title}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                            {sport.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            {sport.subtitle}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2b7351]/10">
                                    <Calendar className="w-3.5 h-3.5 text-[#2b7351]" />
                                    <span className="text-xs font-semibold text-[#2b7351]">
                                        Live
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 mb-4" />

                            {/* Image section */}
                            <div className="mb-5">
                                <div className="rounded-xl bg-white/80 border-2 border-[#d4a574]/30 overflow-hidden">
                                    <Image
                                        src={sport.image}
                                        alt={sport.title}
                                        width={600}
                                        height={300}
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-white/40 rounded-xl px-4 py-3 mb-4 border border-white/50">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {sport.description}
                                </p>
                            </div>

                            {/* Footer with CTA */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                    <span>
                                        <span className="font-semibold text-gray-900">2</span> markets
                                        available
                                    </span>
                                </div>
                                <button
                                    className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#246044] hover:bg-[#2b7351] text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    <span>Explore Markets</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}