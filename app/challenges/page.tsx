"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// Types
interface Challenge {
    id: string;
    asset: string;
    assetLogo: string;
    title: string;
    creator: {
        name: string;
        avatar: string;
    };
    betAmount: number;
    prediction: string;
    currentPrice: number;
    priceChange: number;
    targetPrice: number;
    startPrice: number;
    timeRemaining: string;
    likes: number;
    status: "active" | "expired" | "won" | "lost";
}

// Coin options
interface Coin {
    symbol: string;
    name: string;
    logo: string;
}

const coins: Coin[] = [
    { symbol: "BTC", name: "Bitcoin", logo: "/scribbles/btc.png" },
    { symbol: "ETH", name: "Ethereum", logo: "/scribbles/coins.png" },
    { symbol: "SOL", name: "Solana", logo: "/scribbles/sol.png" },
    { symbol: "PEPE", name: "Pepe", logo: "/scribbles/pepe.png" },
    { symbol: "BONK", name: "Bonk", logo: "/scribbles/doge.png" },
];

// Existing challenges for the modal
const existingChallenges = [
    {
        id: "1",
        asset: "BTC",
        assetLogo: "/scribbles/btc.png",
        betAmount: 80,
        prediction: "BTC > $66,500",
        timeRemaining: "53m",
        prizePool: 1560,
        potentialWin: 100,
        isPositive: true,
    },
    {
        id: "2",
        asset: "BTC",
        assetLogo: "/scribbles/btc.png",
        betAmount: 100,
        prediction: "BTC > $67,000",
        timeRemaining: "1 hr 50m",
        prizePool: 3180,
        potentialWin: 120,
        isPositive: true,
    },
    {
        id: "3",
        asset: "PEPE",
        assetLogo: "/scribbles/pepe.png",
        betAmount: 60,
        prediction: "BTC < $66,250",
        timeRemaining: "35m",
        prizePool: 1040,
        potentialWin: 74,
        isPositive: false,
    },
];

// Dummy data
const challenges: Challenge[] = [
    {
        id: "1",
        asset: "SOL",
        assetLogo: "/scribbles/sol.png",
        title: "SOL Above $160 in 1 Hour?",
        creator: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        betAmount: 100,
        prediction: "SOL > $160",
        currentPrice: 157.4,
        priceChange: -1.8,
        targetPrice: 160,
        startPrice: 168,
        timeRemaining: "59m 12s",
        likes: 5,
        status: "active",
    },
    {
        id: "2",
        asset: "BTC",
        assetLogo: "/scribbles/btc.png",
        title: "BTC Above $95K in 2 Hours?",
        creator: { name: "CryptoKing", avatar: "/scribbles/doge.png" },
        betAmount: 250,
        prediction: "BTC > $95,000",
        currentPrice: 94300,
        priceChange: 2.3,
        targetPrice: 95000,
        startPrice: 92000,
        timeRemaining: "1h 45m",
        likes: 12,
        status: "active",
    },
    {
        id: "3",
        asset: "ETH",
        assetLogo: "/scribbles/coins.png",
        title: "ETH Below $3,200 in 30 mins?",
        creator: { name: "BearWhale", avatar: "/scribbles/shiba.png" },
        betAmount: 500,
        prediction: "ETH < $3,200",
        currentPrice: 3250,
        priceChange: -0.5,
        targetPrice: 3200,
        startPrice: 3300,
        timeRemaining: "28m 45s",
        likes: 8,
        status: "active",
    },
    {
        id: "4",
        asset: "DOGE",
        assetLogo: "/scribbles/doge.png",
        title: "DOGE Above $0.18 in 1 Hour?",
        creator: { name: "MoonBoy", avatar: "/scribbles/pepe.png" },
        betAmount: 50,
        prediction: "DOGE > $0.18",
        currentPrice: 0.175,
        priceChange: 3.2,
        targetPrice: 0.18,
        startPrice: 0.165,
        timeRemaining: "52m 30s",
        likes: 3,
        status: "active",
    },
    {
        id: "5",
        asset: "PEPE",
        assetLogo: "/scribbles/pepe.png",
        title: "PEPE Above $0.000015 in 3 Hours?",
        creator: { name: "FrogLord", avatar: "/scribbles/pengu.png" },
        betAmount: 150,
        prediction: "PEPE > $0.000015",
        currentPrice: 0.0000142,
        priceChange: -2.1,
        targetPrice: 0.000015,
        startPrice: 0.0000145,
        timeRemaining: "2h 15m",
        likes: 7,
        status: "active",
    },
    {
        id: "6",
        asset: "SHIB",
        assetLogo: "/scribbles/shiba.png",
        title: "SHIB Above $0.000025 in 1 Hour?",
        creator: { name: "ShibArmy", avatar: "/scribbles/doge.png" },
        betAmount: 75,
        prediction: "SHIB > $0.000025",
        currentPrice: 0.0000245,
        priceChange: 1.5,
        targetPrice: 0.000025,
        startPrice: 0.000024,
        timeRemaining: "48m 20s",
        likes: 4,
        status: "active",
    },
];

// Filter types
const filterOptions = ["All", "Active", "Ending Soon", "High Stakes", "My Bets"];
const assetOptions = ["All Assets", "SOL", "BTC", "ETH", "DOGE", "PEPE", "SHIB"];

// Date Picker Modal
function DatePickerModal({
    isOpen,
    onClose,
    selectedDate,
    onSelectDate,
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
    const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

    if (!isOpen) return null;

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const isSelected = (day: number) => {
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth &&
            selectedDate.getFullYear() === currentYear
        );
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="relative bg-[#f3e1d7] rounded-2xl p-6 shadow-2xl w-full max-w-sm">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => {
                            if (currentMonth === 0) {
                                setCurrentMonth(11);
                                setCurrentYear(currentYear - 1);
                            } else {
                                setCurrentMonth(currentMonth - 1);
                            }
                        }}
                        className="p-2 hover:bg-[#e8d5c8] rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="font-semibold text-gray-900">
                        {months[currentMonth]} {currentYear}
                    </span>
                    <button
                        onClick={() => {
                            if (currentMonth === 11) {
                                setCurrentMonth(0);
                                setCurrentYear(currentYear + 1);
                            } else {
                                setCurrentMonth(currentMonth + 1);
                            }
                        }}
                        className="p-2 hover:bg-[#e8d5c8] rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Days of week */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                        <div key={day} className="text-center text-xs text-gray-500 font-medium py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => (
                        <div key={index} className="aspect-square">
                            {day && (
                                <button
                                    onClick={() => {
                                        onSelectDate(new Date(currentYear, currentMonth, day));
                                        onClose();
                                    }}
                                    className={`w-full h-full rounded-lg text-sm font-medium transition-colors ${isSelected(day)
                                        ? "bg-emerald-500 text-white"
                                        : isToday(day)
                                            ? "bg-amber-300 text-gray-900"
                                            : "hover:bg-[#e8d5c8] text-gray-700"
                                        }`}
                                >
                                    {day}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex justify-between mt-4 pt-4 border-t border-[#e8d5c8]">
                    <button
                        onClick={() => {
                            onSelectDate(new Date());
                            onClose();
                        }}
                        className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
                    >
                        Today
                    </button>
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-600 font-medium hover:text-gray-800"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Duration Picker Modal
function DurationPickerModal({
    isOpen,
    onClose,
    selectedDuration,
    onSelectDuration,
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedDuration: { hours: number; minutes: number };
    onSelectDuration: (duration: { hours: number; minutes: number }) => void;
}) {
    const [hours, setHours] = useState(selectedDuration.hours);
    const [minutes, setMinutes] = useState(selectedDuration.minutes);

    if (!isOpen) return null;

    const maxDays = 7;
    const maxHours = maxDays * 24;

    const handleHoursChange = (value: number) => {
        if (value >= 0 && value <= maxHours) {
            setHours(value);
        }
    };

    const handleMinutesChange = (value: number) => {
        if (value >= 0 && value < 60) {
            setMinutes(value);
        }
    };

    const formatDuration = () => {
        if (hours === 0 && minutes === 0) return "Select duration";
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        let result = "";
        if (days > 0) result += `${days}d `;
        if (remainingHours > 0) result += `${remainingHours}h `;
        if (minutes > 0) result += `${minutes}m`;
        return result.trim();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div className="relative bg-[#f3e1d7] rounded-2xl p-6 shadow-2xl w-full max-w-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Challenge Duration</h3>
                <p className="text-sm text-gray-600 text-center mb-6">Max duration: 7 days</p>

                {/* Duration Display */}
                <div className="bg-[#faf0eb] rounded-xl p-4 mb-6 text-center">
                    <span className="text-2xl font-bold text-gray-900">{formatDuration()}</span>
                </div>

                {/* Hours Input */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Hours</label>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleHoursChange(hours - 1)}
                            className="w-10 h-10 rounded-lg bg-[#e8d5c8] hover:bg-[#dcc9bc] flex items-center justify-center text-gray-700 font-bold"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            value={hours}
                            onChange={(e) => handleHoursChange(Number(e.target.value))}
                            className="flex-1 text-center py-2 bg-[#faf0eb] border border-[#e8d5c8] rounded-lg text-lg font-semibold"
                            min={0}
                            max={maxHours}
                        />
                        <button
                            onClick={() => handleHoursChange(hours + 1)}
                            className="w-10 h-10 rounded-lg bg-[#e8d5c8] hover:bg-[#dcc9bc] flex items-center justify-center text-gray-700 font-bold"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Minutes Input */}
                <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Minutes</label>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleMinutesChange(minutes - 5)}
                            className="w-10 h-10 rounded-lg bg-[#e8d5c8] hover:bg-[#dcc9bc] flex items-center justify-center text-gray-700 font-bold"
                        >
                            -
                        </button>
                        <input
                            type="number"
                            value={minutes}
                            onChange={(e) => handleMinutesChange(Number(e.target.value))}
                            className="flex-1 text-center py-2 bg-[#faf0eb] border border-[#e8d5c8] rounded-lg text-lg font-semibold"
                            min={0}
                            max={59}
                            step={5}
                        />
                        <button
                            onClick={() => handleMinutesChange(minutes + 5)}
                            className="w-10 h-10 rounded-lg bg-[#e8d5c8] hover:bg-[#dcc9bc] flex items-center justify-center text-gray-700 font-bold"
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {[15, 30, 60, 120, 240, 480].map((mins) => (
                        <button
                            key={mins}
                            onClick={() => {
                                setHours(Math.floor(mins / 60));
                                setMinutes(mins % 60);
                            }}
                            className="py-2 px-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-lg text-sm font-medium text-gray-700 hover:bg-[#e8d5c8] transition-colors"
                        >
                            {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`}
                        </button>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-[#e8d5c8] rounded-xl text-gray-700 font-medium hover:bg-[#dcc9bc] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSelectDuration({ hours, minutes });
                            onClose();
                        }}
                        className="flex-1 py-3 bg-emerald-500 rounded-xl text-white font-medium hover:bg-emerald-600 transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

// Create Challenge Modal Component
function CreateChallengeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [selectedCoin, setSelectedCoin] = useState<Coin>(coins[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [betAmount, setBetAmount] = useState(100);
    const [predictionDirection, setPredictionDirection] = useState("Above");
    const [predictionPrice, setPredictionPrice] = useState("66500");
    const [isDirectionDropdownOpen, setIsDirectionDropdownOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [duration, setDuration] = useState({ hours: 4, minutes: 0 });
    const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
    const [boostChallenge, setBoostChallenge] = useState(false);
    const [allowTies, setAllowTies] = useState(false);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const totalPool = betAmount * 2;
    const yourProfit = betAmount * 0.7;

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatDuration = (dur: { hours: number; minutes: number }) => {
        if (dur.hours === 0 && dur.minutes === 0) return "Select duration";
        const days = Math.floor(dur.hours / 24);
        const remainingHours = dur.hours % 24;
        let result = "";
        if (days > 0) result += `${days}d `;
        if (remainingHours > 0) result += `${remainingHours}h `;
        if (dur.minutes > 0) result += `${dur.minutes}m`;
        return result.trim();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#f3e1d7] rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-[#f3e1d7] rounded-t-3xl px-6 pt-6 pb-4 border-b border-[#e8d5c8]">
                    <div className="flex items-center justify-between">
                        <div className="flex-1" />
                        <h2 className="text-2xl font-bold text-gray-900 flex-1 text-center">
                            Create Challenge
                        </h2>
                        <div className="flex-1 flex justify-end">
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e8d5c8] hover:bg-[#dcc9bc] transition-colors"
                            >
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-gray-600 text-sm mt-1">
                        Set your terms and invite degenerates to challenge you.
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-4">
                    {/* Select Coin */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Select Coin</label>
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden">
                                        <Image
                                            src={selectedCoin.logo}
                                            alt={selectedCoin.symbol}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 object-contain"
                                        />
                                    </div>
                                    <span className="font-semibold text-gray-900">{selectedCoin.symbol}</span>
                                </div>
                                <svg
                                    className={`w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden">
                                    {coins.map((coin) => (
                                        <button
                                            key={coin.symbol}
                                            onClick={() => {
                                                setSelectedCoin(coin);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f3e1d7] transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden">
                                                <Image
                                                    src={coin.logo}
                                                    alt={coin.symbol}
                                                    width={24}
                                                    height={24}
                                                    className="w-6 h-6 object-contain"
                                                />
                                            </div>
                                            <span className="font-medium text-gray-900">{coin.symbol}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bet Amount */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Bet Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                className="w-full pl-8 pr-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:border-[#d4b8a8]"
                            />
                        </div>
                    </div>

                    {/* Predict Price */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Predict Price</label>
                        <div className="flex gap-2">
                            {/* Direction Dropdown */}
                            <div className="relative flex-1">
                                <button
                                    onClick={() => setIsDirectionDropdownOpen(!isDirectionDropdownOpen)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors"
                                >
                                    <span className="font-semibold text-gray-900">{selectedCoin.name} {predictionDirection}</span>
                                    <svg
                                        className={`w-5 h-5 text-gray-500 transition-transform ${isDirectionDropdownOpen ? "rotate-180" : ""}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Direction Dropdown Options */}
                                {isDirectionDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                setPredictionDirection("Above");
                                                setIsDirectionDropdownOpen(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-[#f3e1d7] transition-colors font-medium text-gray-900"
                                        >
                                            {selectedCoin.name} Above
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPredictionDirection("Below");
                                                setIsDirectionDropdownOpen(false);
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-[#f3e1d7] transition-colors font-medium text-gray-900"
                                        >
                                            {selectedCoin.name} Below
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Price Input */}
                            <div className="relative w-32">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                                <input
                                    type="number"
                                    value={predictionPrice}
                                    onChange={(e) => setPredictionPrice(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:border-[#d4b8a8]"
                                    placeholder="66500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <label className="text-sm font-medium text-gray-700">End Date</label>
                        </div>
                        <button
                            onClick={() => setIsDatePickerOpen(true)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Challenge Expiry */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <label className="text-sm font-medium text-gray-700">Challenge Expiry</label>
                        </div>
                        <button
                            onClick={() => setIsDurationPickerOpen(true)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium text-gray-900">{formatDuration(duration)}</span>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Win Summary */}
                    <div className="text-center py-2">
                        <p className="text-gray-700">
                            You win <span className="font-bold text-gray-900">${Math.round(betAmount * 1.7)}</span> if {selectedCoin.symbol} closes {predictionDirection.toLowerCase()} ${Number(predictionPrice).toLocaleString()} in {formatDuration(duration)}
                        </p>
                    </div>

                    {/* Create Button */}
                    <button className="w-full py-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-full text-gray-900 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-amber-400/50">
                        CREATE CHALLENGE
                    </button>

                    {/* Disclaimer */}
                    <p className="text-center text-sm text-gray-600">
                        You can't cancel your challenge once it's created, so bet wisely!
                    </p>
                </div>
            </div>

            {/* Date Picker Modal */}
            <DatePickerModal
                isOpen={isDatePickerOpen}
                onClose={() => setIsDatePickerOpen(false)}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            {/* Duration Picker Modal */}
            <DurationPickerModal
                isOpen={isDurationPickerOpen}
                onClose={() => setIsDurationPickerOpen(false)}
                selectedDuration={duration}
                onSelectDuration={setDuration}
            />
        </div>
    );
}

export default function ChallengesPage() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [activeAsset, setActiveAsset] = useState("All Assets");
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="min-h-full">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
                        <p className="text-gray-600 mt-1">Battle other traders in PvP prediction markets</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center px-6 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Challenge
                    </button>
                </div>
            </div>

            {/* Filters Section */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Main Filters */}
                    <div className="flex flex-wrap gap-2">
                        {filterOptions.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === filter
                                    ? "bg-black text-white"
                                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Asset Filter */}
                    <div className="flex flex-wrap gap-2 lg:ml-auto">
                        {assetOptions.map((asset) => (
                            <button
                                key={asset}
                                onClick={() => setActiveAsset(asset)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeAsset === asset
                                    ? "bg-gray-800 text-white"
                                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                                    }`}
                            >
                                {asset}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Challenges Grid */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {challenges.map((challenge) => {
                        // Calculate price position for the progress bar (0-100%)
                        // Center (50%) is the target price
                        const isAbovePrediction = challenge.prediction.includes(">");
                        const priceRange = Math.abs(challenge.targetPrice - challenge.startPrice);
                        const currentDiff = challenge.currentPrice - challenge.startPrice;
                        const targetDiff = challenge.targetPrice - challenge.startPrice;

                        // Calculate progress: 50% is target, <50% is below, >50% is above
                        let priceProgress = 50;
                        if (priceRange > 0) {
                            const normalizedProgress = (challenge.currentPrice - challenge.startPrice) / targetDiff;
                            priceProgress = 50 + (normalizedProgress * 50);
                        }
                        const clampedProgress = Math.min(Math.max(priceProgress, 0), 100);

                        return (
                            <Link
                                key={challenge.id}
                                href={`/challenges/${challenge.id}`}
                                className="bg-[#f8ede7] rounded-2xl p-4 shadow-sm border border-white/50 hover:shadow-lg transition-shadow block"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                                            <Image
                                                src={challenge.assetLogo}
                                                alt={challenge.asset}
                                                width={32}
                                                height={32}
                                                className="w-8 h-8 object-contain"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                                {challenge.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden">
                                                    <Image
                                                        src={challenge.creator.avatar}
                                                        alt={challenge.creator.name}
                                                        width={16}
                                                        height={16}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="text-sm text-gray-600">{challenge.creator.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Watchlist Icon (replaced edit icon) */}
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200 my-3"></div>

                                {/* Bet Info */}
                                <div className="text-center mb-3">
                                    <p className="text-xl font-bold text-gray-900">
                                        <span className="text-emerald-600">${challenge.betAmount}</span>{" "}
                                        <span className="text-gray-700">Bet on {challenge.prediction}</span>
                                    </p>
                                </div>

                                {/* Price Progress Bar - Red to Left, Bet Price Center, Green to Right */}
                                <div className="mb-5">
                                    {/* Price labels */}
                                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                                        <span>${challenge.startPrice.toLocaleString()}</span>
                                        <span className="font-semibold text-gray-700">Target: ${challenge.targetPrice.toLocaleString()}</span>
                                    </div>

                                    {/* Progress bar container */}
                                    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                                        {/* Left side - Red (below target) */}
                                        <div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-400"
                                            style={{ width: '50%' }}
                                        />
                                        {/* Right side - Green (above target) */}
                                        <div
                                            className="absolute inset-y-0 right-0 bg-gradient-to-r from-emerald-400 to-emerald-500"
                                            style={{ width: '50%' }}
                                        />

                                        {/* Center marker for target price */}
                                        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/50" />

                                        {/* Current price indicator - moves based on actual price */}
                                        <div
                                            className="absolute top-0 bottom-0 flex items-center justify-center"
                                            style={{ left: `${clampedProgress}%`, transform: 'translateX(-50%)' }}
                                        >
                                            <div className="w-4 h-4 bg-white border-2 border-amber-600 rounded-full shadow-lg z-10" />
                                        </div>
                                    </div>

                                    {/* Moving price tag */}
                                    <div className="relative mt-2 h-7">
                                        <div
                                            className="absolute -translate-x-1/2 bg-gradient-to-r from-amber-800 to-amber-700 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-md whitespace-nowrap"
                                            style={{ left: `${clampedProgress}%` }}
                                        >
                                            ${challenge.currentPrice.toLocaleString()}{" "}
                                            <span className={challenge.priceChange >= 0 ? "text-emerald-200" : "text-red-200"}>
                                                {challenge.priceChange >= 0 ? "+" : ""}{challenge.priceChange}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-xl text-gray-900 font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-amber-400/50 flex items-center justify-center gap-2">
                                    REKT HIM
                                    <span className="text-xl">😈</span>
                                </button>

                                {/* Challenge Expiry */}
                                <p className="text-center text-xs text-gray-600 mt-1.5">
                                    Challenge expires in <span className="font-medium text-gray-900">{challenge.timeRemaining}</span>
                                </p>

                                {/* Divider */}
                                <div className="border-t border-gray-200 my-2"></div>

                                {/* Footer */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm">Created <span className="font-semibold text-gray-900">2h ago</span></span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                        </button>
                                        {/* Eye Icon (replaced fire icon) */}
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-gray-900">{challenge.likes}</span>
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Create Challenge Modal */}
            <CreateChallengeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}

