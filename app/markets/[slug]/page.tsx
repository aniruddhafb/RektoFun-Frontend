"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ChevronDown, SlidersHorizontal, ChevronRight, Crown } from "lucide-react";

// Mock data for the candlestick chart
const generateChartData = () => {
    const data = [];
    let price = 6450;
    const startTime = new Date();
    startTime.setHours(8, 30, 0, 0);

    for (let i = 0; i < 30; i++) {
        const time = new Date(startTime.getTime() + i * 3 * 60 * 1000);
        const change = (Math.random() - 0.4) * 20;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 10;
        const low = Math.min(open, close) - Math.random() * 10;

        data.push({
            time: time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            open,
            high,
            low,
            close,
            isUp: close > open,
        });

        price = close;
    }

    return data;
};

const chartData = generateChartData();

// Challenge data
const challenges = [
    {
        id: 1,
        bet: 80,
        condition: "BTC > $66,500",
        timeLeft: "53m",
        prizePool: 1560,
        endsIn: "1 hr 27m",
        hasRektButton: false,
    },
    {
        id: 2,
        bet: 100,
        condition: "BTC > $67,000",
        timeLeft: "1 hr 50m",
        prizePool: 3180,
        endsIn: "1 hr 50m",
        hasRektButton: false,
    },
    {
        id: 3,
        bet: 100,
        condition: "BTC > $67,000",
        timeLeft: "1 hr 50m",
        prizePool: 3160,
        endsIn: "1 hr 50m",
        hasRektButton: true,
        rektPrizePool: 3240,
    },
    {
        id: 4,
        bet: 60,
        condition: "BTC < $66,250",
        timeLeft: "35m",
        prizePool: 1040,
        endsIn: "1 hr 09m",
        hasRektButton: true,
        rektPrizePool: 1560,
    },
];

// Top traders data
const topTraders = [
    { id: 1, name: "TraderX", wins: "6.7%", totalWins: "21k", flag: "🇺🇸", avatar: "/scribbles/btc.png" },
    { id: 2, name: "CryptoNinja", wins: "1.5K", totalWins: "1.5k", flag: "🇰🇷", avatar: "/scribbles/shiba.png" },
    { id: 3, name: "Marinade", wins: "1.5K", totalWins: "1.5k", flag: "🇺🇸", avatar: "/scribbles/pengu.png" },
];

// Related markets data
const relatedMarkets = [
    { id: 1, name: "Ethereum Challenge Markets", available: 14, participants: 43, icon: "/scribbles/coins.png", color: "#627EEA" },
    { id: 2, name: "Solana Challenge Markets", available: 10, participants: 36, icon: "/scribbles/sol.png", color: "#9945FF" },
    { id: 3, name: "Pepe Coin Challenge Markets", available: 8, participants: 27, icon: "/scribbles/pepe.png", color: "#4ADE80" },
    { id: 4, name: "Bonk Coin Challenge Markets", available: 8, participants: 31, icon: "/scribbles/shiba.png", color: "#F59E0B" },
];

export default function MarketPage({ params }: { params: { slug: string } }) {
    const currentPrice = chartData[chartData.length - 1].close;
    const priceChange = currentPrice - chartData[0].open;
    const priceChangePercent = (priceChange / chartData[0].open) * 100;

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="flex items-start gap-4 mb-8">
                    <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                            src="/scribbles/btc.png"
                            alt="Bitcoin"
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">
                            Bitcoin Challenge Markets
                        </h1>
                        <p className="text-gray-600">
                            Predict and earn by betting on Bitcoin market movements
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Filter Bar */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-700 font-medium">All Challenge Markets</span>
                                <span className="bg-gray-200 text-gray-700 text-sm px-2 py-0.5 rounded-full">
                                    12
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        className="pl-9 pr-4 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 w-40"
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm hover:bg-gray-50">
                                    Latest
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50">
                                    <SlidersHorizontal className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-gray-500 text-sm">BTC/USD</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-bold text-gray-900">
                                        + ${priceChange.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                    </span>
                                    <span className="bg-green-600 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        {priceChangePercent.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Candlestick Chart */}
                            <div className="relative h-64 w-full">
                                {/* Y-axis labels */}
                                <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-500">
                                    <span>$6600</span>
                                    <span>$6,500</span>
                                    <span>$6450</span>
                                </div>

                                {/* Chart area */}
                                <div className="absolute left-14 right-8 top-0 bottom-8">
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between">
                                        <div className="border-t border-gray-200/50" />
                                        <div className="border-t border-gray-200/50" />
                                        <div className="border-t border-gray-200/50" />
                                    </div>

                                    {/* Candlesticks */}
                                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                        {chartData.map((candle, i) => {
                                            const x = (i / (chartData.length - 1)) * 100;
                                            const minPrice = 6440;
                                            const maxPrice = 6620;
                                            const range = maxPrice - minPrice;

                                            const openY = 100 - ((candle.open - minPrice) / range) * 100;
                                            const closeY = 100 - ((candle.close - minPrice) / range) * 100;
                                            const highY = 100 - ((candle.high - minPrice) / range) * 100;
                                            const lowY = 100 - ((candle.low - minPrice) / range) * 100;

                                            const bodyTop = Math.min(openY, closeY);
                                            const bodyBottom = Math.max(openY, closeY);
                                            const bodyHeight = Math.max(bodyBottom - bodyTop, 1);

                                            return (
                                                <g key={i}>
                                                    {/* Wick */}
                                                    <line
                                                        x1={`${x}%`}
                                                        y1={`${highY}%`}
                                                        x2={`${x}%`}
                                                        y2={`${lowY}%`}
                                                        stroke={candle.isUp ? "#22c55e" : "#ef4444"}
                                                        strokeWidth={1}
                                                    />
                                                    {/* Body */}
                                                    <rect
                                                        x={`${x - 1.2}%`}
                                                        y={`${bodyTop}%`}
                                                        width="2.4%"
                                                        height={`${bodyHeight}%`}
                                                        fill={candle.isUp ? "#22c55e" : "#ef4444"}
                                                        rx={1}
                                                    />
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>

                                {/* X-axis labels */}
                                <div className="absolute left-14 right-8 bottom-0 flex justify-between text-xs text-gray-500">
                                    <span>8:30 AM</span>
                                    <span>8:45 AM</span>
                                    <span>9:00 AM</span>
                                    <span>9:15 AM</span>
                                    <span>9:35 AM</span>
                                </div>

                                {/* Right side price labels */}
                                <div className="absolute right-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-gray-500 text-right">
                                    <span>$6500</span>
                                    <span>$6000</span>
                                    <span>$6500</span>
                                    <span>$6600</span>
                                </div>
                            </div>
                        </div>

                        {/* Challenge Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {challenges.map((challenge) => (
                                <div
                                    key={challenge.id}
                                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 hover:shadow-lg transition-shadow"
                                >
                                    <div className="mb-3">
                                        <span className="text-green-700 font-semibold">${challenge.bet}</span>
                                        <span className="text-gray-700"> Bet on {challenge.condition} in {challenge.timeLeft}</span>
                                    </div>

                                    <div className="bg-white/80 rounded-xl p-3 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="font-semibold text-gray-900">${challenge.prizePool.toLocaleString()}</span>
                                            <span>Prize Pool</span>
                                            <span className="text-gray-400">•</span>
                                            <span>Ends in {challenge.endsIn}</span>
                                        </div>
                                    </div>

                                    {challenge.hasRektButton ? (
                                        <div className="space-y-3">
                                            <button className="w-full py-3 px-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-semibold rounded-xl hover:from-yellow-700 hover:to-yellow-600 transition-all flex items-center justify-center gap-2 shadow-md">
                                                REKT HIM
                                                <Image
                                                    src="/scribbles/phantom (1).png"
                                                    alt="Phantom"
                                                    width={20}
                                                    height={20}
                                                    className="object-contain"
                                                />
                                            </button>
                                            <div className="text-xs text-gray-500 text-center">
                                                ${challenge.rektPrizePool?.toLocaleString()} Prize Pool • Ends in {challenge.endsIn}
                                            </div>
                                        </div>
                                    ) : (
                                        <button className="w-full py-3 px-4 bg-[#4a5d52] text-white font-medium rounded-xl hover:bg-[#3d4d44] transition-colors flex items-center justify-center gap-2">
                                            View Challenges
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-80 space-y-6">
                        {/* Top Traders */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Top Traders</h3>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="space-y-4">
                                {topTraders.map((trader) => (
                                    <div key={trader.id} className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                                            <Image
                                                src={trader.avatar}
                                                alt={trader.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{trader.name}</span>
                                                <span className="text-lg">{trader.flag}</span>
                                            </div>
                                            <div className="text-sm text-gray-500">{trader.wins} Wins</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-semibold text-gray-900">{trader.totalWins}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* User Stats */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-yellow-600" />
                                    <span className="text-gray-600">Premamim</span>
                                </div>
                                <div className="mt-2 inline-flex items-center gap-2 bg-white/80 rounded-full px-3 py-1.5">
                                    <Crown className="w-4 h-4 text-yellow-600" />
                                    <span className="font-medium text-gray-900">$27 SOL</span>
                                </div>
                            </div>
                        </div>

                        {/* Related Markets */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5">
                            <h3 className="font-semibold text-gray-900 mb-4">Related Markets</h3>

                            <div className="space-y-4">
                                {relatedMarkets.map((market) => (
                                    <Link
                                        key={market.id}
                                        href={`/markets/${market.name.toLowerCase().replace(/\s+/g, "-")}`}
                                        className="flex items-center gap-3 group"
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: `${market.color}20` }}
                                        >
                                            <Image
                                                src={market.icon}
                                                alt={market.name}
                                                width={24}
                                                height={24}
                                                className="object-contain"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                                                {market.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {market.available} Available{" "}
                                                <span className="text-gray-400">⚡</span> {market.participants}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <Link
                                href="/markets"
                                className="mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-white/80 rounded-xl text-gray-700 font-medium hover:bg-white transition-colors"
                            >
                                View All Markets
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
