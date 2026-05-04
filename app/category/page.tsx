"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";

// SVG Icons
const TrendingUpIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const TrophyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
);

const BarChartIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
);

const UsersIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const CoinsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="8" cy="8" r="6" />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
        <path d="M7 6h1v4" />
        <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
);

const FlameIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const BoltIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
);

export default function CategoryPage() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [sortBy, setSortBy] = useState("Trending");
    const dropdownRef = useRef(null);

    const sortOptions = [
        { label: "Trending", icon: <TrendingUpIcon /> },
        { label: "Top Rated", icon: <TrophyIcon /> },
        { label: "Volume", icon: <BarChartIcon /> },
        { label: "Newest", icon: <BoltIcon /> },
    ];

    return (
        <div className="min-h-screen bg-[#f3e1d7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Challenge Markets</h1>
                        <p className="text-gray-600 text-base sm:text-lg">Predict trends and earn big on top challenge markets</p>
                    </div>
                </div>

                {/* Filter Tabs and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                    {/* Search and Sort */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="pl-10 pr-4 py-2.5 bg-white/50 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 w-full sm:w-48 lg:w-88"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="cursor-pointer flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white/50 rounded-full text-sm text-gray-700 hover:bg-white/70 transition-colors whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">{sortBy}</span>
                                <span className="sm:hidden">{sortOptions.find(o => o.label === sortBy)?.icon}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.label}
                                            onClick={() => {
                                                setSortBy(option.label);
                                                setIsDropdownOpen(false);
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

                {/* Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-6xl">

                    {/* ── Crypto Markets Card ── */}
                    <div
                        className="group relative rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl"
                        style={{
                            background: "linear-gradient(145deg, #fff8f3 0%, #fdecd8 60%, #fad9b8 100%)",
                            boxShadow: "0 8px 32px -8px rgba(249,115,22,0.18), 0 2px 8px rgba(0,0,0,0.06)",
                            border: "1.5px solid rgba(249,115,22,0.15)",
                        }}
                    >
                        {/* Decorative top stripe */}
                        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #f97316, #fb923c, #fbbf24)" }} />

                        {/* Top visual area */}
                        <div className="relative h-60 sm:h-68 overflow-hidden flex-shrink-0 px-6 pt-6">

                            {/* Subtle dot-grid background */}
                            <div
                                className="absolute inset-0 opacity-[0.07]"
                                style={{
                                    backgroundImage: "radial-gradient(circle, #f97316 1px, transparent 1px)",
                                    backgroundSize: "20px 20px",
                                }}
                            />

                            {/* Warm glow blob */}
                            <div
                                className="absolute -right-8 -top-8 w-56 h-56 rounded-full opacity-30 blur-3xl"
                                style={{ background: "radial-gradient(circle, #fb923c, #fbbf24)" }}
                            />

                            {/* Icon badge + label */}
                            <div className="relative z-10 flex items-center gap-3 mb-4">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-orange-500 shadow-md transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                                    style={{ background: "rgba(255,255,255,0.9)" }}
                                >
                                    <TrendingUpIcon />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Category</p>
                                    <h2 className="text-xl sm:text-2xl font-black text-[#1a1a1a] leading-tight">
                                        Crypto <span className="text-orange-500">Markets</span>
                                    </h2>
                                </div>
                            </div>

                            <p className="relative z-10 text-[#666] text-xs sm:text-sm font-medium leading-relaxed max-w-[220px] mb-4">
                                Predict price movements, market trends and major crypto events.
                            </p>

                            {/* Scribble coin images — scattered layout */}
                            <div className="absolute right-0 bottom-0 w-[55%] h-full pointer-events-none select-none">
                                {/* BTC — large, center-right */}
                                <Image
                                    src="/scribbles/btc.png"
                                    alt="Bitcoin"
                                    width={110}
                                    height={110}
                                    className="scribble-btc absolute"
                                    style={{ right: "18%", bottom: "8%", zIndex: 4 }}
                                />
                                {/* SOL — top right */}
                                <Image
                                    src="/scribbles/sol.png"
                                    alt="Solana"
                                    width={72}
                                    height={72}
                                    className="scribble-sol absolute"
                                    style={{ right: "4%", top: "10%", zIndex: 3 }}
                                />
                                {/* DOGE — bottom left of cluster */}
                                <Image
                                    src="/scribbles/doge.png"
                                    alt="Dogecoin"
                                    width={68}
                                    height={68}
                                    className="scribble-doge absolute"
                                    style={{ right: "52%", bottom: "12%", zIndex: 3 }}
                                />
                                {/* SHIBA — top left of cluster */}
                                <Image
                                    src="/scribbles/shiba.png"
                                    alt="Shiba Inu"
                                    width={60}
                                    height={60}
                                    className="scribble-shiba absolute"
                                    style={{ right: "38%", top: "8%", zIndex: 2 }}
                                />
                                {/* PEPE — small accent */}
                                <Image
                                    src="/scribbles/pepe.png"
                                    alt="Pepe"
                                    width={48}
                                    height={48}
                                    className="scribble-pepe absolute"
                                    style={{ right: "2%", bottom: "14%", zIndex: 2 }}
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />

                        {/* Stats row */}
                        <div className="mx-5 my-4 rounded-2xl px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-orange-100/60">
                            <div className="grid grid-cols-4 divide-x divide-orange-100/60">
                                <div className="flex flex-col items-center gap-1 px-1">
                                    <span className="text-orange-400"><BarChartIcon /></span>
                                    <span className="text-base sm:text-lg font-black text-[#1a1a1a]">124</span>
                                    <span className="text-[10px] text-[#999] font-semibold uppercase tracking-wide">Markets</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 px-1">
                                    <span className="text-orange-400"><UsersIcon /></span>
                                    <span className="text-base sm:text-lg font-black text-[#1a1a1a]">12.5K</span>
                                    <span className="text-[10px] text-[#999] font-semibold uppercase tracking-wide">Traders</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 px-1">
                                    <span className="text-orange-400"><CoinsIcon /></span>
                                    <span className="text-base sm:text-lg font-black text-[#1a1a1a]">$12.4M</span>
                                    <span className="text-[10px] text-[#999] font-semibold uppercase tracking-wide">24H Vol</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 px-1">
                                    <span className="text-orange-400"><FlameIcon /></span>
                                    <span className="text-base sm:text-lg font-black text-orange-500">Hot 🔥</span>
                                    <span className="text-[10px] text-[#999] font-semibold uppercase tracking-wide">Trend</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="px-5 pb-5">
                            <Link
                                href="/markets?category=crypto&id=80d3e1b7-4c64-4c45-9507-372b726ff061"
                                className="group/btn flex items-center justify-between w-full px-5 py-4 rounded-2xl text-white font-bold text-sm sm:text-base transition-all duration-300 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                                    boxShadow: "0 4px 20px rgba(249,115,22,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                                }}
                            >
                                <span>Explore Crypto Markets</span>
                                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/20 transition-transform duration-300 group-hover/btn:translate-x-1">
                                    <ArrowRightIcon />
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* ── Sports Markets Card ── */}
                    <div
                        className="group relative rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl"
                        style={{
                            background: "linear-gradient(145deg, #fdf8ff 0%, #f0e8ff 60%, #e4d4ff 100%)",
                            boxShadow: "0 8px 32px -8px rgba(124,58,237,0.18), 0 2px 8px rgba(0,0,0,0.06)",
                            border: "1.5px solid rgba(124,58,237,0.15)",
                        }}
                    >
                        {/* Decorative top stripe */}
                        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)" }} />

                        {/* Top visual area */}
                        <div className="relative h-60 sm:h-68 overflow-hidden flex-shrink-0 px-6 pt-6">

                            {/* Subtle dot-grid background */}
                            <div
                                className="absolute inset-0 opacity-[0.07]"
                                style={{
                                    backgroundImage: "radial-gradient(circle, #7c3aed 1px, transparent 1px)",
                                    backgroundSize: "20px 20px",
                                }}
                            />

                            {/* Purple glow blob */}
                            <div
                                className="absolute -right-8 -top-8 w-56 h-56 rounded-full opacity-25 blur-3xl"
                                style={{ background: "radial-gradient(circle, #a855f7, #7c3aed)" }}
                            />

                            {/* Icon badge + label */}
                            <div className="relative z-10 flex items-center gap-3 mb-4">
                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 shadow-md transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                                    style={{ background: "rgba(255,255,255,0.9)" }}
                                >
                                    <TrophyIcon />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Category</p>
                                    <h2 className="text-xl sm:text-2xl font-black text-[#1a1a1a] leading-tight">
                                        Sports <span className="text-purple-600">Markets</span>
                                    </h2>
                                </div>
                            </div>

                            <p className="relative z-10 text-[#666] text-xs sm:text-sm font-medium leading-relaxed max-w-[220px] mb-4">
                                Predict match outcomes, player performances and sports events.
                            </p>

                            {/* Sports visuals — scattered balls */}
                            <div className="absolute right-0 bottom-0 w-[55%] h-full pointer-events-none select-none flex items-end justify-center pb-4">
                                <div className="relative w-48 h-48">

                                    {/* Cricket player silhouette */}
                                    <div className="absolute top-0 right-6 w-20 h-36 flex items-center justify-center z-10">
                                        <div className="relative" style={{ transform: "scale(0.8)" }}>
                                            <div className="w-8 h-8 rounded-full absolute -top-8 left-1/2 -translate-x-1/2"
                                                style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }} />
                                            <div className="w-9 h-5 rounded-t-full absolute -top-10 left-1/2 -translate-x-1/2"
                                                style={{ background: "#5b21b6" }} />
                                            <div className="w-10 h-20 rounded-t-full mx-auto"
                                                style={{ background: "linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)" }} />
                                            <div className="absolute -top-4 -right-8 w-16 h-2 rounded-full"
                                                style={{ background: "#c8a060", transform: "rotate(-45deg)", transformOrigin: "left center" }} />
                                            <div className="flex gap-1 mt-1">
                                                <div className="w-4 h-12 rounded-b-full" style={{ background: "#7c3aed" }} />
                                                <div className="w-4 h-12 rounded-b-full" style={{ background: "#7c3aed", transform: "rotate(10deg)" }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Soccer ball */}
                                    <div
                                        className="absolute bottom-4 left-0 w-16 h-16 rounded-full animate-float-gentle"
                                        style={{
                                            background: "radial-gradient(circle at 35% 35%, #ede9fe, #a78bfa 60%, #6d28d9 100%)",
                                            boxShadow: "0 8px 24px rgba(109,40,217,0.35), inset 0 -4px 8px rgba(0,0,0,0.15)",
                                        }}
                                    >
                                        <div className="absolute inset-0 rounded-full overflow-hidden opacity-40">
                                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#4c1d95]" />
                                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#4c1d95]" />
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#4c1d95] rounded-sm rotate-45" />
                                        </div>
                                    </div>

                                    {/* Basketball */}
                                    <div
                                        className="absolute bottom-0 right-2 w-16 h-16 rounded-full animate-float-updown"
                                        style={{
                                            background: "radial-gradient(circle at 35% 35%, #fed7aa, #f97316 60%, #c2410c 100%)",
                                            boxShadow: "0 6px 20px rgba(194,65,12,0.35), inset 0 -4px 8px rgba(0,0,0,0.15)",
                                            animationDelay: "0.8s",
                                        }}
                                    >
                                        <div className="absolute inset-0 rounded-full overflow-hidden opacity-50">
                                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#7c2d12]" />
                                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-[#7c2d12]" />
                                            <div className="absolute top-1/4 left-1/4 right-1/4 h-0.5 bg-[#7c2d12] rounded-full" style={{ transform: "rotate(-20deg)" }} />
                                            <div className="absolute bottom-1/4 left-1/4 right-1/4 h-0.5 bg-[#7c2d12] rounded-full" style={{ transform: "rotate(20deg)" }} />
                                        </div>
                                    </div>

                                    {/* Trophy accent */}
                                    <div
                                        className="absolute top-2 left-2 w-10 h-10 rounded-xl flex items-center justify-center animate-float-wavy"
                                        style={{
                                            background: "rgba(255,255,255,0.85)",
                                            boxShadow: "0 4px 12px rgba(124,58,237,0.2)",
                                            animationDelay: "1.2s",
                                        }}
                                    >
                                        <span className="text-xl">🏆</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />

                        {/* Stats row */}
                        <div className="mx-5 my-4 rounded-2xl px-4 py-3.5 bg-white/60 backdrop-blur-sm border border-purple-100/60">
                            <div className="grid grid-cols-4 divide-x divide-purple-100/60">
                                <div className="flex flex-col items-center gap-1 px-1">
                                    <span className="text-purple-500"><TrophyIcon /></span>
                                    <span className="text-base sm:text-lg font-black text-[#1a1a1a]">98</span>
                                    <span className="text-[10px] text-[#999] font-semibold uppercase tracking-wide">Markets</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 px-1">
                                    <span className="text-purple-500"><UsersIcon /></span>
                                    <span className="text-base sm:text-lg font-black text-[#1a1a1a]">8.7K</span>
                                    <span className="text-[10px] text-[#999] font-semibold uppercase tracking-wide">Traders</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 px-1">
                                    <span className="text-purple-500"><CoinsIcon /></span>
                                    <span className="text-base sm:text-lg font-black text-[#1a1a1a]">$8.3M</span>
                                    <span className="text-[10px] text-[#999] font-semibold uppercase tracking-wide">24H Vol</span>
                                </div>
                                <div className="flex flex-col items-center gap-1 px-1">
                                    <span className="text-purple-500"><FlameIcon /></span>
                                    <span className="text-base sm:text-lg font-black text-purple-600">Hot 🔥</span>
                                    <span className="text-[10px] text-[#999] font-semibold uppercase tracking-wide">Trend</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="px-5 pb-5">
                            <Link
                                href="/markets?category=sports"
                                className="group/btn flex items-center justify-between w-full px-5 py-4 rounded-2xl text-white font-bold text-sm sm:text-base transition-all duration-300 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98]"
                                style={{
                                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                                    boxShadow: "0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                                }}
                            >
                                <span>Explore Sports Markets</span>
                                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/20 transition-transform duration-300 group-hover/btn:translate-x-1">
                                    <ArrowRightIcon />
                                </span>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
