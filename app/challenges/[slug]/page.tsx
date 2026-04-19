"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    Bookmark,
    Link2,
    Share2,
    Clock,
    ChevronRight,
    TrendingDown,
    TrendingUp,
    MoreHorizontal,
} from "lucide-react";

// Mock data for the challenge
const CHALLENGE_DATA = {
    id: "sol-160-1h",
    title: "SOL Above $160 in 1 Hour?",
    token: "SOL",
    tokenIcon: "/scribbles/sol.png",
    targetPrice: 160,
    currentPrice: 157.14,
    priceChange: -1.8,
    priceChangeValue: -2.86,
    betAmount: 100,
    potentialReward: 170,
    platformFee: 50,
    totalPool: 250,
    expiryMinutes: 59,
    expirySeconds: 12,
    shares: 27,
    marketStats: {
        volume: "$2.12B",
        volumeChange: -3.67,
        marketCap: "$70.47B",
        ath: 260.06,
    },
    participants: [
        {
            id: 1,
            name: "DegenLord",
            avatar: "/scribbles/pepe.png",
            bet: 100,
            position: "SOL > $160",
            timeAgo: "6 min",
        },
        {
            id: 2,
            name: "Player 1",
            avatar: "/scribbles/phantom (1).png",
            bet: 100,
            position: "SOL ≤ $160",
            timeAgo: "12 min",
        },
    ],
};

// Generate mock candlestick data
const generateCandleData = () => {
    const data = [];
    const basePrice = 155;
    const times = ["9:05 PM", "9:20 PM", "9:35 PM", "9:50 PM", "9:50 PM"];

    for (let i = 0; i < 40; i++) {
        const timeIndex = Math.floor(i / 8);
        const open = basePrice + Math.random() * 4 - 2 + i * 0.08;
        const close = open + Math.random() * 3 - 1.5;
        const high = Math.max(open, close) + Math.random() * 1.5;
        const low = Math.min(open, close) - Math.random() * 1.5;

        data.push({
            time: times[timeIndex] || "9:50 PM",
            open,
            close,
            high,
            low,
            isGreen: close >= open,
        });
    }
    return data;
};

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default function ChallengePage({ params }: PageProps) {
    const [timeLeft, setTimeLeft] = useState({
        minutes: CHALLENGE_DATA.expiryMinutes,
        seconds: CHALLENGE_DATA.expirySeconds,
    });
    const [candleData] = useState(generateCandleData());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) {
                    return { ...prev, seconds: prev.seconds - 1 };
                } else if (prev.minutes > 0) {
                    return { minutes: prev.minutes - 1, seconds: 59 };
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = () => {
        return `${timeLeft.minutes}m ${timeLeft.seconds.toString().padStart(2, "0")}s`;
    };

    // Calculate chart dimensions
    const chartHeight = 200;
    const chartWidth = 100;
    const padding = 10;

    const prices = candleData.flatMap((d) => [d.high, d.low]);
    const minPrice = Math.min(...prices) - 1;
    const maxPrice = Math.max(...prices) + 1;
    const priceRange = maxPrice - minPrice;

    const getY = (price: number) => {
        return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        {/* Token Icon */}
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                            <Image
                                src={CHALLENGE_DATA.tokenIcon}
                                alt={CHALLENGE_DATA.token}
                                width={48}
                                height={48}
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {CHALLENGE_DATA.title}
                            </h1>
                            <div className="flex items-center gap-2 text-gray-600 mt-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">Expires in {formatTime()}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
                            <Bookmark className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
                            <Link2 className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Challenge Card */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Main Challenge Card */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/40">
                            {/* Bet Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-500 text-xl">✦</span>
                                    <span className="text-xl font-semibold text-gray-900">
                                        ${CHALLENGE_DATA.betAmount} Bet on {CHALLENGE_DATA.token} {'>'} ${CHALLENGE_DATA.targetPrice}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-gray-900">
                                        ${CHALLENGE_DATA.currentPrice.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Price Chart */}
                            <div className="relative mb-6">
                                {/* Y-axis labels */}
                                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 pr-2">
                                    <span>${Math.ceil(maxPrice)}</span>
                                    <span>${Math.round((maxPrice + minPrice) / 2)}</span>
                                    <span>${Math.floor(minPrice)}</span>
                                </div>

                                {/* Chart Area */}
                                <div className="ml-12 relative">
                                    {/* Target price line */}
                                    <div
                                        className="absolute left-0 right-0 border-t-2 border-dashed border-green-400/60 z-10"
                                        style={{
                                            top: `${getY(CHALLENGE_DATA.targetPrice)}px`,
                                        }}
                                    />
                                    <span
                                        className="absolute right-0 text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded"
                                        style={{
                                            top: `${getY(CHALLENGE_DATA.targetPrice) - 10}px`,
                                        }}
                                    >
                                        ${CHALLENGE_DATA.targetPrice}
                                    </span>

                                    {/* Current price indicator */}
                                    <div
                                        className="absolute z-20 flex items-center gap-1"
                                        style={{
                                            top: `${getY(CHALLENGE_DATA.currentPrice) - 12}px`,
                                            left: "35%",
                                        }}
                                    >
                                        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                            <span>${CHALLENGE_DATA.currentPrice.toFixed(2)}</span>
                                            <span className="text-red-300">
                                                {CHALLENGE_DATA.priceChange}%
                                            </span>
                                        </div>
                                        <div className="w-0 h-0 border-l-4 border-l-gray-800 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                                    </div>

                                    {/* Candlesticks */}
                                    <svg
                                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                        className="w-full h-48"
                                        preserveAspectRatio="none"
                                    >
                                        <defs>
                                            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
                                                <stop offset="100%" stopColor="rgba(34, 197, 94, 0.05)" />
                                            </linearGradient>
                                            <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
                                                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.05)" />
                                            </linearGradient>
                                        </defs>

                                        {/* Area fill under price */}
                                        <path
                                            d={`M 0 ${chartHeight} ${candleData
                                                .map((d, i) => {
                                                    const x = (i / (candleData.length - 1)) * chartWidth;
                                                    const y = getY(d.close);
                                                    return `L ${x} ${y}`;
                                                })
                                                .join(" ")} L ${chartWidth} ${chartHeight} Z`}
                                            fill="url(#greenGradient)"
                                            opacity={0.5}
                                        />

                                        {/* Candlesticks */}
                                        {candleData.map((candle, i) => {
                                            const x = (i / (candleData.length - 1)) * chartWidth;
                                            const candleWidth = chartWidth / candleData.length * 0.7;
                                            const color = candle.isGreen ? "#22c55e" : "#ef4444";

                                            return (
                                                <g key={i}>
                                                    {/* Wick */}
                                                    <line
                                                        x1={x}
                                                        y1={getY(candle.high)}
                                                        x2={x}
                                                        y2={getY(candle.low)}
                                                        stroke={color}
                                                        strokeWidth="0.3"
                                                    />
                                                    {/* Body */}
                                                    <rect
                                                        x={x - candleWidth / 2}
                                                        y={getY(Math.max(candle.open, candle.close))}
                                                        width={candleWidth}
                                                        height={Math.max(
                                                            1,
                                                            Math.abs(getY(candle.open) - getY(candle.close))
                                                        )}
                                                        fill={color}
                                                        rx="0.5"
                                                    />
                                                </g>
                                            );
                                        })}
                                    </svg>

                                    {/* X-axis labels */}
                                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                                        <span>9:05 PM</span>
                                        <span>9:20 PM</span>
                                        <span>9:35 PM</span>
                                        <span>9:50 PM</span>
                                        <span>9:50 PM</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">Expires in {formatTime()}</span>
                                </div>

                                {/* REKT HIM Button */}
                                <button className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                                    <div className="relative px-8 py-3 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-600 rounded-full text-white font-bold text-lg shadow-lg border border-yellow-400/50 flex items-center gap-2">
                                        <span>REKT HIM</span>
                                        <span className="text-xl">😈</span>
                                    </div>
                                </button>

                                <div className="flex items-center gap-2 text-gray-600">
                                    <Share2 className="w-4 h-4" />
                                    <span className="text-sm">{CHALLENGE_DATA.shares} Shares</span>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Challenge Card */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/40">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-gray-900">
                                            ${CHALLENGE_DATA.betAmount} Bet on {CHALLENGE_DATA.token} {'>'} ${CHALLENGE_DATA.targetPrice}
                                        </span>
                                        <span className="text-gray-500">Potential Reward</span>
                                        <span className="font-bold text-gray-900">
                                            ${CHALLENGE_DATA.potentialReward}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">
                                        Platform Fee 25 {CHALLENGE_DATA.token}
                                    </p>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Expires in 59m 36s</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                                        $125
                                    </button>
                                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium">
                                        $50
                                    </button>
                                </div>
                            </div>

                            {/* Social Share Buttons */}
                            <div className="flex items-center justify-end gap-2 mt-4">
                                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </button>
                                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.13 5 7.59 0 2.08-.8 3.97-2.1 5.39z" />
                                    </svg>
                                </button>
                                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Stats Sidebar */}
                    <div className="space-y-4">
                        {/* Stats Card */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/40">
                            {/* Total Pool */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-600 font-medium">Total Pool</span>
                                <span className="text-xl font-bold text-gray-900">
                                    ${CHALLENGE_DATA.totalPool}
                                </span>
                            </div>

                            {/* Potential Reward */}
                            <div className="flex items-center justify-between py-4 border-t border-gray-200/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">💰</span>
                                    <div>
                                        <p className="text-sm text-gray-600">Potential Reward</p>
                                        <p className="text-xs text-gray-400">${CHALLENGE_DATA.betAmount}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-lg font-semibold text-gray-900">
                                        ${CHALLENGE_DATA.potentialReward}
                                    </span>
                                    <Bookmark className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Platform Fee */}
                            <div className="flex items-center justify-between py-4 border-t border-gray-200/50">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🪙</span>
                                    <span className="text-gray-600">Platform Fee</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-lg font-semibold text-gray-900">
                                        ${CHALLENGE_DATA.platformFee}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Participants */}
                            <div className="pt-4 border-t border-gray-200/50">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-900 font-semibold">Participants</span>
                                    <button className="text-sm text-gray-500 hover:text-gray-700">
                                        More
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {CHALLENGE_DATA.participants.map((participant) => (
                                        <div
                                            key={participant.id}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                                                    <Image
                                                        src={participant.avatar}
                                                        alt={participant.name}
                                                        width={40}
                                                        height={40}
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {participant.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {participant.position}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-green-600">
                                                    ${participant.bet}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {participant.timeAgo}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SOL Live Price */}
                            <div className="pt-4 mt-4 border-t border-gray-200/50">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-900 font-semibold">
                                        {CHALLENGE_DATA.token} Live Price
                                    </span>
                                    <div className="flex items-center gap-1 text-red-500">
                                        <span className="text-lg font-bold">
                                            ${CHALLENGE_DATA.currentPrice.toFixed(2)}
                                        </span>
                                        <TrendingDown className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Market Stats */}
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-500">Market Stats</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-900">
                                            {CHALLENGE_DATA.marketStats.volume}
                                        </span>
                                        <span className="text-red-500">
                                            {CHALLENGE_DATA.marketStats.volumeChange}%
                                        </span>
                                    </div>
                                </div>

                                {/* Market Cap */}
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-500">Market Cap</span>
                                    <span className="text-gray-900">
                                        {CHALLENGE_DATA.marketStats.marketCap}
                                    </span>
                                </div>

                                {/* All Time High */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">All-Time High</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-900">
                                            ${CHALLENGE_DATA.marketStats.ath.toFixed(2)}
                                        </span>
                                        <TrendingUp className="w-3 h-3 text-green-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mini Price Card */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/40">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-500 text-sm">
                                    {CHALLENGE_DATA.token} Live Price
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-gray-900">
                                    ${CHALLENGE_DATA.currentPrice.toFixed(2)}
                                </span>
                                <div className="flex items-center gap-1 text-red-500">
                                    <span>{CHALLENGE_DATA.priceChange}%</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
