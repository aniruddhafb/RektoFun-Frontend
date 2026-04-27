"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { X, Clock, Trophy, Skull, TrendingUp, TrendingDown, User, Calendar, AlertCircle, CheckCircle } from "lucide-react";

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
    status: "active" | "expired" | "won" | "lost" | "created" | "accepted";
    accepter?: {
        name: string;
        avatar: string;
    };
    createdAt?: string;
    expiresAt?: string;
    endsAt?: string;
}

interface ChallengeDetailModalProps {
    challenge: Challenge | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChallengeDetailModal({ challenge, isOpen, onClose }: ChallengeDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen || !challenge) return null;

    const isAccepted = challenge.status === "accepted" || challenge.status === "active" || challenge.status === "won" || challenge.status === "lost";
    const hasWon = challenge.status === "won";
    const hasLost = challenge.status === "lost";

    // Calculate price bar position (0-100%)
    const getPriceBarPosition = () => {
        const range = challenge.targetPrice - challenge.startPrice;
        if (range === 0) return 50;
        const position = ((challenge.currentPrice - challenge.startPrice) / range) * 100;
        return Math.max(0, Math.min(100, position));
    };
    const priceBarPosition = getPriceBarPosition();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
            <div
                ref={modalRef}
                className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-gradient-to-br from-[#f8ede7] via-[#f3e1d7] to-[#e8d5c4] rounded-3xl shadow-2xl border border-[#d4a574]/30 animate-in zoom-in-95 duration-300"
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                {/* Hide scrollbar CSS for WebKit browsers */}
                <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#d4a574]/20 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-[#246044]/20 to-transparent rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Main Content */}
                <div className="relative p-6 sm:p-8">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row gap-6 mb-8">
                        {/* Asset Image */}
                        <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] p-1 shadow-xl">
                                <div className="w-full h-full rounded-xl bg-[#f8ede7] flex items-center justify-center overflow-hidden">
                                    <Image
                                        src={challenge.assetLogo}
                                        alt={challenge.asset}
                                        width={80}
                                        height={80}
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Challenge Info */}
                        <div className="flex-1 text-center sm:text-left">
                            {/* Market Tag */}
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2d1f1a]/10 rounded-full mb-3">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                    <span className="text-[10px]">₿</span>
                                </div>
                                <span className="text-xs font-semibold text-[#2d1f1a] uppercase tracking-wide">{challenge.asset} Market</span>
                            </div>

                            {/* Title */}
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#2d1f1a] mb-3 leading-tight">
                                {challenge.title}
                            </h2>

                            {/* Created By */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-[#d4a574]/30">
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-[#d4a574]">
                                    <Image
                                        src={challenge.creator.avatar}
                                        alt={challenge.creator.name}
                                        width={24}
                                        height={24}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="font-semibold text-[#5c4a42]">Created by {challenge.creator.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bet Amount - Highlighted */}
                    <div className="relative mb-8 p-6 bg-gradient-to-r from-[#246044] to-[#2d6f4a] rounded-2xl text-white shadow-xl overflow-visible">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full translate-x-8 -translate-y-8" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full -translate-x-6 translate-y-6" />

                        {/* Prize Pool - Top */}
                        <div className="text-center mb-6">
                            <p className="text-white/80 text-sm font-medium mb-1">Prize Pool</p>
                            <p className="text-4xl font-black">
                                ${challenge.betAmount}
                                <span className="text-xl ml-1 text-white/70">SOL</span>
                            </p>
                        </div>

                        {/* Price Section */}
                        <div className="flex items-center justify-between mb-3">
                            {/* Start Price */}
                            <div className="flex items-center gap-1.5">
                                <div className="group relative">
                                    <svg className="w-4 h-4 text-white/60 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="fixed p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] whitespace-nowrap shadow-xl"
                                        style={{ pointerEvents: "none" }}>
                                        Price when challenger posted the challenge
                                    </div>
                                </div>
                                <div>
                                    <p className="text-white/70 text-xs">Start</p>
                                    <p className="font-bold">${challenge.startPrice.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Target Price */}
                            <div className="flex items-center gap-1.5">
                                <div>
                                    <p className="text-white/70 text-xs text-right">Target</p>
                                    <p className="font-bold text-amber-300">${challenge.targetPrice.toLocaleString()}</p>
                                </div>
                                <div className="group relative">
                                    <svg className="w-4 h-4 text-white/60 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="fixed p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] whitespace-nowrap shadow-xl"
                                        style={{ pointerEvents: "none" }}>
                                        Hit price set by challenger
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Price Progress Bar */}
                        <div className="relative">
                            {/* Track */}
                            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                                {/* Progress fill */}
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-500"
                                    style={{ width: `${priceBarPosition}%` }}
                                />
                            </div>

                            {/* Current Price Marker */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-emerald-400 flex items-center justify-center"
                                style={{ left: `calc(${priceBarPosition}% - 10px)` }}
                            >
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            </div>
                        </div>

                        {/* Current Price Label */}
                        <div className="mt-3 text-center">
                            <p className={`text-lg font-bold ${challenge.priceChange >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                                ${challenge.currentPrice.toLocaleString()}
                                <span className="text-xs ml-2 text-white/60">
                                    ({challenge.priceChange >= 0 ? "+" : ""}{challenge.priceChange}%)
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* VS Section */}
                    <div className="mb-8">
                        <h3 className="text-center text-sm font-bold text-[#8b7355] uppercase tracking-wider mb-4">
                            {isAccepted ? "Battle Matchup" : "Waiting for Challenger"}
                        </h3>

                        <div className={`flex flex-row items-center justify-center gap-4`}>
                            {/* Challenger Profile */}
                            <div className="relative group">
                                <div className={`relative p-4 rounded-2xl transition-all duration-300 ${hasWon
                                    ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400 shadow-lg shadow-amber-200"
                                    : hasLost
                                        ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                        : "bg-white/80 border-2 border-[#d4a574]/30"
                                    }`}>
                                    {/* Winner Crown */}
                                    {hasWon && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                                            👑
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className={`w-20 h-20 rounded-full overflow-hidden border-3 ${hasWon ? "border-amber-400" : "border-[#d4a574]"
                                            } shadow-lg`}>
                                            <Image
                                                src={challenge.creator.avatar}
                                                alt={challenge.creator.name}
                                                width={80}
                                                height={80}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Label */}
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#2d1f1a] text-white text-[10px] font-bold rounded-full">
                                            CHALLENGER
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="mt-6 text-center">
                                        <p className="font-bold text-[#2d1f1a] text-sm">{challenge.creator.name}</p>
                                        <p className="text-xs text-[#8b7355] mt-1">
                                            {hasWon ? "Won the bet!" : hasLost ? "Lost the bet" : "Created challenge"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* VS Badge or Pending Badge */}
                            <div className="flex flex-col items-center justify-center">
                                {isAccepted ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] flex items-center justify-center shadow-xl">
                                            <span className="text-2xl font-black text-[#f3e1d7]">VS</span>
                                        </div>
                                        {hasWon || hasLost ? (
                                            <div className="mt-2 text-center">
                                                <p className={`text-2xl font-black ${hasWon ? "text-amber-500" : "text-red-500"}`}>
                                                    {hasWon ? "+" : "-"}${challenge.betAmount}
                                                </p>
                                                <p className="text-[10px] text-[#8b7355]">SOL</p>
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg animate-pulse">
                                            <User className="w-8 h-8 text-white/50" />
                                        </div>
                                        <div className="mt-3 px-4 py-1.5 bg-[#8b7355]/20 rounded-full">
                                            <p className="text-xs font-semibold text-[#8b7355]">Seeking Opponent</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Accepter Profile - Only show if accepted */}
                            {isAccepted && challenge.accepter && (
                                <div className="relative group">
                                    <div className={`relative p-4 rounded-2xl transition-all duration-300 ${hasLost
                                        ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400 shadow-lg shadow-amber-200"
                                        : hasWon
                                            ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                            : "bg-white/80 border-2 border-[#d4a574]/30"
                                        }`}>
                                        {/* Winner Crown */}
                                        {hasLost && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                                                👑
                                            </div>
                                        )}

                                        {/* Avatar */}
                                        <div className="relative">
                                            <div className={`w-20 h-20 rounded-full overflow-hidden border-3 ${hasLost ? "border-amber-400" : "border-[#d4a574]"
                                                } shadow-lg`}>
                                                <Image
                                                    src={challenge.accepter.avatar}
                                                    alt={challenge.accepter.name}
                                                    width={80}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* Label */}
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#2d1f1a] text-white text-[10px] font-bold rounded-full">
                                                ACCEPTER
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="mt-6 text-center">
                                            <p className="font-bold text-[#2d1f1a] text-sm">{challenge.accepter.name}</p>
                                            <p className="text-xs text-[#8b7355] mt-1">
                                                {hasLost ? "Won the bet!" : hasWon ? "Lost the bet" : "Accepted challenge"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Placeholder for pending state */}
                            {!isAccepted && (
                                <div className="relative">
                                    <div className="p-4 rounded-2xl bg-white/40 border-2 border-dashed border-[#d4a574]/30">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-3 border-[#d4a574]/50">
                                            <span className="text-3xl">❓</span>
                                        </div>
                                        <div className="mt-6 text-center">
                                            <p className="font-semibold text-[#8b7355] text-sm">No one yet</p>
                                            <p className="text-xs text-[#a08070] mt-1">Be the first to accept!</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline Section */}
                    <div className="mb-6">
                        <h3 className="text-center text-sm font-bold text-[#8b7355] uppercase tracking-wider mb-4">
                            Challenge Timeline
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Created */}
                            <div className="relative p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-[#8b7355] uppercase">Created</span>
                                </div>
                                <p className="font-bold text-[#2d1f1a]">{challenge.createdAt || "2 hours ago"}</p>
                            </div>

                            {/* Expires */}
                            <div className="relative p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-[#8b7355] uppercase">Expires</span>
                                </div>
                                <p className="font-bold text-[#2d1f1a]">{challenge.expiresAt || challenge.timeRemaining}</p>
                            </div>

                            {/* Ends */}
                            <div className="relative p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <AlertCircle className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-[#8b7355] uppercase">Ends</span>
                                </div>
                                <p className="font-bold text-[#2d1f1a]">{challenge.endsAt || challenge.timeRemaining}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <button className="flex-1 py-3.5 px-6 bg-[#246044] hover:bg-[#2d6f4a] rounded-xl text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
                            Accept Challenge
                            <span className="text-xl">⚔️</span>
                        </button>
                        <button className="flex-1 py-3.5 px-6 bg-white/80 hover:bg-white rounded-xl text-[#2d1f1a] font-semibold text-base border border-[#d4a574]/30 hover:border-[#d4a574] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer">
                            Share
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
