"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { X, Clock, User, Calendar, AlertCircle } from "lucide-react";
import { ChallengeListItem } from "@/app/lib/challenges-service/challenges";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/useUserStore";


interface ChallengeDetailModalProps {
    challenge: ChallengeListItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChallengeDetailModal({ challenge, isOpen, onClose }: ChallengeDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user } = useUserStore();
    const [currentTime, setCurrentTime] = React.useState(() => Date.now());
    const [shareFeedback, setShareFeedback] = React.useState<string | null>(null);
    const [liveSolPrice, setLiveSolPrice] = React.useState<number | null>(null);

    const formatEndsByCountdown = (timestamp: number | null, nowMs: number): string => {
        if (!timestamp) return "unknown";
        const diffMs = timestamp - nowMs;
        if (diffMs <= 0) return "ended";

        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const formatCreatedTimeAgo = (timestamp: number | null, nowMs: number): string => {
        if (!timestamp) return "recently";

        const diff = nowMs - timestamp;
        if (diff < 0) return "just now";

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;
        if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
        if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

        return "just now";
    };

    const formatExpiryCountdown = (timestamp: number | null, nowMs: number): string => {
        if (!timestamp) return "N/A";
        const diffMs = timestamp - nowMs;
        if (diffMs <= 0) return "Expired";

        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;

        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const formatExactCountdownDetails = (timestamp: number | null, nowMs: number): {
        exactCountdown: string;
        timeLeftText: string;
        dayLabel: string;
    } => {
        if (!timestamp) {
            return {
                exactCountdown: "Unknown",
                timeLeftText: "Unknown time left",
                dayLabel: "Unknown day",
            };
        }

        const diffMs = timestamp - nowMs;
        if (diffMs <= 0) {
            const endedDate = new Date(timestamp);
            const endedDay = endedDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
            return {
                exactCountdown: "0d 0h 0m",
                timeLeftText: "Challenge ended",
                dayLabel: `${endedDay} (UTC)`,
            };
        }

        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;

        const endDate = new Date(timestamp);
        const weekday = endDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
        const fullDate = endDate.toLocaleString("en-US", {
            timeZone: "UTC",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });

        return {
            exactCountdown: `${days}d ${hours}h ${minutes}m`,
            timeLeftText: `${days} day${days === 1 ? "" : "s"}, ${hours} hour${hours === 1 ? "" : "s"}, ${minutes} minute${minutes === 1 ? "" : "s"} left`,
            dayLabel: `${weekday}, ${fullDate} UTC`,
        };
    };

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

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        const fetchSolPrice = async () => {
            try {
                const response = await fetch(
                    "https://api.diadata.org/v1/assetQuotation/Solana/0x0000000000000000000000000000000000000000",
                    { cache: "no-store" },
                );
                if (!response.ok) return;

                const data = await response.json();
                const rawPrice =
                    data?.price ??
                    data?.Price ??
                    data?.quotation ??
                    data?.value ??
                    null;
                const parsedPrice =
                    typeof rawPrice === "number"
                        ? rawPrice
                        : typeof rawPrice === "string"
                            ? Number(rawPrice)
                            : NaN;

                if (isMounted && Number.isFinite(parsedPrice) && parsedPrice > 0) {
                    setLiveSolPrice(parsedPrice);
                }
            } catch {
                // Keep previous value on transient network/API errors.
            }
        };

        void fetchSolPrice();
        const interval = window.setInterval(fetchSolPrice, 180000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, [isOpen]);

    if (!isOpen || !challenge) return null;

    const hasWinnerData =
        typeof challenge.result === "object" &&
        challenge.result !== null &&
        "winner" in challenge.result;
    const winnerValue = hasWinnerData ? String((challenge.result as Record<string, unknown>).winner ?? "") : "";
    const hasWon = challenge.status === "resolved" && winnerValue === "creator";
    const hasLost = challenge.status === "resolved" && winnerValue !== "" && winnerValue !== "creator";

    const asset = challenge.market?.name || "Market";
    const assetLogo = challenge.market?.icon || "/scribbles/btc.png";
    const creatorName = challenge.creator?.username || "Creator";
    const creatorAvatar = challenge.creator?.profile_image || assetLogo;
    const hasOpponentInfo = Boolean(challenge.opponent_info?.username || challenge.opponent_info?.wallet_address);
    const isAccepted =
        challenge.status === "locked" ||
        challenge.status === "resolved" ||
        hasOpponentInfo;
    const opponentDisplayName = challenge.opponent_info?.username || "Opponent";
    const opponentAvatar = challenge.opponent_info?.profile_image || assetLogo;
    const isPoolMode = challenge.mode === "pool";
    const betAmount = challenge.initial_bet ?? 0;
    const createdTimestamp = challenge.created_at ? new Date(challenge.created_at).getTime() : null;
    const expiryTimestamp = challenge.expire_time ? new Date(challenge.expire_time).getTime() : null;
    const resolveTimestamp = challenge.resolve_time ? new Date(challenge.resolve_time).getTime() : null;
    const endsByCountdown = formatEndsByCountdown(resolveTimestamp, currentTime);
    const exactCountdownDetails = formatExactCountdownDetails(resolveTimestamp, currentTime);
    const createdTimeText = formatCreatedTimeAgo(createdTimestamp, currentTime);
    const expiresInText = formatExpiryCountdown(expiryTimestamp, currentTime);
    const hasExpired = Boolean(expiryTimestamp && expiryTimestamp <= currentTime);
    const endsInText = formatEndsByCountdown(resolveTimestamp, currentTime);
    const resolveDayDateText = resolveTimestamp
        ? new Date(resolveTimestamp).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
        })
        : "Unknown date";
    const creatorWalletAddress = challenge.creator?.wallet_address || "";
    const creatorWalletShort = creatorWalletAddress
        ? `${creatorWalletAddress.slice(0, 6)}...${creatorWalletAddress.slice(-4)}`
        : "Unknown wallet";
    const startPrice = betAmount;
    const targetPrice = challenge.target_price ?? challenge.total_pool ?? betAmount;
    const currentPrice = liveSolPrice ?? challenge.total_pool ?? 0;
    const priceChange = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;

    // Calculate price bar position (0-100%)
    const getPriceBarPosition = () => {
        const range = targetPrice - startPrice;
        if (range === 0) return 50;
        const position = ((currentPrice - startPrice) / range) * 100;
        return Math.max(0, Math.min(100, position));
    };
    const priceBarPosition = getPriceBarPosition();
    const isCreator = user?.wallet_address === creatorWalletAddress;
    const hasOpponents = Number(challenge.total_opponents ?? 0) > 0 || hasOpponentInfo;
    const isExpireTimeAchieved = Boolean(expiryTimestamp && expiryTimestamp <= currentTime);
    const isResolveTimeAchieved = Boolean(resolveTimestamp && resolveTimestamp <= currentTime);
    const challengeWithResolution = challenge as ChallengeListItem & {
        resolving_status?: string;
        resolution_status?: string;
    };
    const resolutionStatusRaw = String(
        challengeWithResolution.resolving_status ??
        challengeWithResolution.resolution_status ??
        ""
    ).toLowerCase();
    const isResolutionPending = resolutionStatusRaw === "pending";
    const isResolutionResolved = resolutionStatusRaw === "resolved";

    let ctaLabel = "";
    let ctaDisabled = false;
    let ctaClassName = "";
    const ctaBaseClassName =
        "w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2";
    const activeCtaClassName =
        `${ctaBaseClassName} cursor-pointer bg-[#246044] hover:bg-[#2b7351] text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
    const activePvpCtaClassName =
        `${ctaBaseClassName} cursor-pointer bg-[#0c9d63] hover:bg-[#0a7d4f] border border-gray-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
    const ongoingCtaClassName =
        `${ctaBaseClassName} cursor-not-allowed bg-[#09905a] border border-gray-500 text-white shadow-lg`;
    const expiredCtaClassName =
        `${ctaBaseClassName} bg-red-100 border border-red-300 text-red-700 shadow-sm cursor-not-allowed`;
    const resolvingCtaClassName =
        `${ctaBaseClassName} bg-amber-100 border border-amber-300 text-amber-700 shadow-sm cursor-not-allowed`;
    const completedCtaClassName =
        `${ctaBaseClassName} bg-gray-200 border border-gray-300 text-gray-700 shadow-sm cursor-not-allowed`;

    if (!isPoolMode) {
        if (isResolveTimeAchieved && isResolutionResolved) {
            ctaLabel = "COMPLETED ✅";
            ctaDisabled = true;
            ctaClassName = completedCtaClassName;
        } else if (isResolveTimeAchieved && isResolutionPending) {
            ctaLabel = "RESOLVING...";
            ctaDisabled = true;
            ctaClassName = resolvingCtaClassName;
        } else if (!isResolveTimeAchieved && hasOpponents) {
            ctaLabel = "ONGOING ⚔️";
            ctaDisabled = true;
            ctaClassName = ongoingCtaClassName;
        } else if (isExpireTimeAchieved && !hasOpponents) {
            ctaLabel = "EXPIRED!";
            ctaDisabled = true;
            ctaClassName = expiredCtaClassName;
        } else {
            ctaLabel = "ACCEPT CHALLENGE ⚔️";
            ctaDisabled = isCreator;
            ctaClassName = activePvpCtaClassName;
        }
    } else {
        if (isResolveTimeAchieved && isResolutionResolved) {
            ctaLabel = "COMPLETED";
            ctaDisabled = true;
            ctaClassName = completedCtaClassName;
        } else if (isResolveTimeAchieved && isResolutionPending) {
            ctaLabel = "RESOLVING...";
            ctaDisabled = true;
            ctaClassName = resolvingCtaClassName;
        } else if (isExpireTimeAchieved && !hasOpponents) {
            ctaLabel = "EXPIRED";
            ctaDisabled = true;
            ctaClassName = expiredCtaClassName;
        } else if (!isExpireTimeAchieved) {
            ctaLabel = "JOIN CHALLENGE";
            ctaDisabled = false;
            ctaClassName = activeCtaClassName;
        } else {
            ctaLabel = "ONGOING";
            ctaDisabled = true;
            ctaClassName = ongoingCtaClassName;
        }
    }
    const showCreatorCtaHoverHint = isCreator && ctaLabel === "ACCEPT CHALLENGE ⚔️";

    const handleCtaClick = () => {
        if (ctaDisabled) return;
        onClose();
        router.push(`/challenges?challengeId=${encodeURIComponent(challenge.id)}`);
    };

    const handleShareChallenge = async () => {
        if (!challenge) return;

        const shareUrl = `${window.location.origin}/challenges?challengeId=${encodeURIComponent(challenge.id)}`;
        const shareText = `Check out this challenge: ${challenge.title}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: challenge.title,
                    text: shareText,
                    url: shareUrl,
                });
                setShareFeedback("Shared");
            } else {
                await navigator.clipboard.writeText(shareUrl);
                setShareFeedback("Link copied");
            }
        } catch {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setShareFeedback("Link copied");
            } catch {
                setShareFeedback("Share failed");
            }
        }

        window.setTimeout(() => setShareFeedback(null), 1800);
    };

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
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8">
                        {/* Asset Image */}
                        <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] p-1 shadow-xl">
                                <div className="w-full h-full rounded-xl bg-[#f8ede7] flex items-center justify-center overflow-hidden">
                                    <Image
                                        src={assetLogo}
                                        alt={asset}
                                        width={80}
                                        height={80}
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Challenge Info */}
                        <div className="flex-1 text-center sm:text-left min-w-0">
                            {/* Market Tag */}
                            {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/70 backdrop-blur-sm rounded-full mb-3 border border-[#d4a574]/40 shadow-sm">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] text-[#2d1f1a] font-black">
                                        <Image
                                            src={assetLogo}
                                            alt={asset}
                                            width={80}
                                            height={80}
                                            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                                        />
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-[#2d1f1a] uppercase tracking-wide">{asset} Challenge Markets</span>
                            </div> */}

                            {/* Title */}
                            <h2 className="mt-2 text-[#2d1f1a] leading-tight mb-3">
                                <span className="block sm:hidden text-[22px] font-bold tracking-tight break-words">
                                    {challenge.title} In Next{" "}
                                    <span className="inline-flex items-center gap-1.5 align-middle">
                                        <span className="font-bold text-emerald-900 whitespace-nowrap">{endsByCountdown}</span>
                                        <span className="group relative inline-flex items-center">
                                            <svg className="w-4 h-4 text-emerald-700 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="absolute left-1/2 top-full z-10 mt-2 w-60 -translate-x-1/2 rounded-lg bg-gray-900 p-2 text-[11px] font-medium text-white opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible normal-case leading-relaxed shadow-lg">
                                                <span className="block">Exact countdown: {exactCountdownDetails.exactCountdown}</span>
                                                <span className="block">Time left: {exactCountdownDetails.timeLeftText}</span>
                                                <span className="block">Resolves on: {exactCountdownDetails.dayLabel}</span>
                                                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900"></span>
                                            </span>
                                        </span>
                                    </span>
                                </span>
                                <span className="hidden sm:flex sm:items-center sm:gap-2 sm:text-3xl sm:font-bold sm:tracking-tight sm:whitespace-nowrap">
                                    <span>{challenge.title} In Next</span>
                                    <span className="inline-flex items-center gap-1.5 align-middle">
                                        <span className="font-bold text-emerald-900 whitespace-nowrap">{endsByCountdown}</span>
                                        <span className="group relative inline-flex items-center">
                                            <svg className="w-4 h-4 text-emerald-700 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="absolute left-1/2 top-full z-10 mt-2 w-60 -translate-x-1/2 rounded-lg bg-gray-900 p-2 text-[11px] font-medium text-white opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible normal-case leading-relaxed shadow-lg">
                                                <span className="block">Exact countdown: {exactCountdownDetails.exactCountdown}</span>
                                                <span className="block">Time left: {exactCountdownDetails.timeLeftText}</span>
                                                <span className="block">Resolves on: {exactCountdownDetails.dayLabel}</span>
                                                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900"></span>
                                            </span>
                                        </span>
                                    </span>
                                </span>
                            </h2>

                            {/* Created By */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!creatorWalletAddress) return;
                                    router.push(`/profile/${creatorWalletAddress}`);
                                }}
                                className="inline-flex items-center gap-2.5 rounded-2xl border border-[#d8d2cb] bg-[#f6f3ef] px-3.5 py-2 transition-colors duration-200 hover:border-[#cbc3bb] cursor-pointer"
                            >
                                <div className="h-8 w-8 rounded-full overflow-hidden border border-[#c8c1ba] shrink-0">
                                    <Image
                                        src={creatorAvatar}
                                        alt={creatorName}
                                        width={30}
                                        height={30}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="flex flex-col leading-none text-left">
                                    <span className="text-[10px] text-[#9a9189]">Created by</span>
                                    <span className="text-[13px] text-[#756d66] mt-1">{creatorName}</span>
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Bet Amount - Highlighted */}
                    <div className="relative mb-8 p-6 bg-gradient-to-r from-[#246044] to-[#2d6f4a] rounded-2xl text-white shadow-xl overflow-visible">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full translate-x-8 -translate-y-8" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full -translate-x-6 translate-y-6" />

                        {/* Prize Pool - Top */}
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <p className="text-white/80 text-sm font-medium">Total Pool</p>
                                <div className="group relative">
                                    <svg className="w-4 h-4 text-white/70 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div
                                        className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg bg-gray-900 p-2 text-xs text-white opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible shadow-xl"
                                        style={{ pointerEvents: "none" }}
                                    >
                                        the total pool is the total money locked in the escrow smart contract which winner gets after winning
                                        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900"></span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-4xl font-black">
                                ${betAmount}
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
                                    <p className="font-bold">${startPrice.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Target Price */}
                            <div className="flex items-center gap-1.5">
                                <div>
                                    <p className="text-white/70 text-xs text-right">Target</p>
                                    <p className="font-bold text-amber-300">${targetPrice.toLocaleString()}</p>
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
                            <p className={`text-lg font-bold ${priceChange >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                                ${currentPrice.toLocaleString()}
                                <span className="text-xs ml-2 text-white/60">
                                    ({priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%)
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* VS Section */}
                    <div className="mb-8">
                        <h3 className="text-center text-sm font-bold text-[#8b7355] uppercase tracking-wider mb-4">
                            Battle Matchup
                        </h3>

                        <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
                            {/* Challenger Profile */}
                            <div className="relative group flex flex-col items-center">
                                <div className={`w-[138px] h-[168px] flex flex-col items-center justify-center text-center gap-2 p-4 rounded-xl transition-all duration-300 ${hasWon
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
                                    <div className="relative flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${hasWon ? "border-amber-400" : "border-[#d4a574]"
                                            } shadow-md`}>
                                            <Image
                                                src={creatorAvatar}
                                                alt={creatorName}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Label */}
                                        <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                            CHALLENGER
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="text-center">
                                        <p className="font-bold text-[#2d1f1a] text-xs">{creatorName}</p>
                                        <p className="text-[10px] text-[#8b7355] mt-0.5">
                                            {hasWon ? "Won the bet!" : hasLost ? "Lost the bet" : "Created challenge"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* VS Badge or Pending Badge */}
                            <div className="flex flex-col items-center justify-center px-2">
                                {isAccepted ? (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] flex items-center justify-center shadow-lg">
                                            <span className="text-lg font-black text-[#f3e1d7]">VS</span>
                                        </div>
                                        {hasWon || hasLost ? (
                                            <div className="mt-1 text-center">
                                                <p className={`text-lg font-black ${hasWon ? "text-amber-500" : "text-red-500"}`}>
                                                    {hasWon ? "+" : "-"}${betAmount}
                                                </p>
                                            </div>
                                        ) : null}
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg animate-pulse">
                                            <User className="w-6 h-6 text-white/50" />
                                        </div>
                                        <div className="mt-2 px-2.5 py-1 bg-[#8b7355]/20 rounded-full">
                                            <p className="text-xs font-semibold text-[#8b7355]">Seeking Opponent</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Opponent Profile */}
                            {hasOpponentInfo ? (
                                <div className="relative group flex flex-col items-center">
                                    <div className={`w-[138px] h-[168px] flex flex-col items-center justify-center text-center gap-2 p-4 rounded-xl transition-all duration-300 ${hasLost
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
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${hasLost ? "border-amber-400" : "border-[#d4a574]"
                                                } shadow-md`}>
                                                <Image
                                                    src={opponentAvatar}
                                                    alt={opponentDisplayName}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* Label */}
                                            <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                                {isPoolMode ? "POOL" : "OPPONENT"}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="text-center">
                                            <p className="font-bold text-[#2d1f1a] text-xs">{opponentDisplayName}</p>
                                            <p className="text-[10px] text-[#8b7355] mt-0.5">
                                                {hasLost ? "Won the bet!" : hasWon ? "Lost the bet" : "Opposing challenge"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (

                                <div className="relative">
                                    <div className="w-[138px] h-[168px] flex flex-col items-center justify-center text-center gap-2 p-4 rounded-xl bg-white/40 border-2 border-dashed border-[#d4a574]/30">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-[#d4a574]/50">
                                            <span className="text-xl">❓</span>
                                        </div>
                                        <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                            OPPONENT
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-[#8b7355] text-xs">No one yet</p>
                                            <p className="text-[10px] text-[#a08070] mt-0.5">Be the first to accept!</p>
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

                        <div className={`grid grid-cols-1 ${hasExpired ? "sm:grid-cols-3" : "sm:grid-cols-4"} gap-4 overflow-visible`}>
                            {/* Mode */}
                            <div className="relative p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-visible">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-[#8b7355] uppercase">Mode</span>
                                </div>
                                <p className="font-bold text-[#2d1f1a]">{challenge.mode === "pool" ? "Multi Mode" : "PvP Mode"}</p>
                            </div>

                            {/* Created */}
                            <div className="relative p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-visible">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-[#8b7355] uppercase">Created</span>
                                </div>
                                <p className="font-bold text-[#2d1f1a]">{createdTimeText}</p>
                            </div>

                            {/* Expires */}
                            <div className="relative z-20 hover:z-50 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-visible">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <span className="text-xs font-semibold text-[#8b7355] uppercase">Expires In</span>
                                    <div className="group relative z-[60]">
                                        <svg className="w-3.5 h-3.5 text-amber-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] text-center">
                                            {hasExpired
                                                ? "This challenge has expired. No one can join now."
                                                : `This challenge will expire in ${expiresInText}. After that, no one can join.`}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                </div>
                                <p className="font-bold text-[#2d1f1a]">{expiresInText}</p>
                            </div>

                            {/* Resolves */}
                            {!hasExpired && (
                                <div className="relative z-10 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-visible">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <AlertCircle className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-semibold text-[#8b7355] uppercase">Resolves In</span>
                                    </div>
                                    <p className="font-bold text-[#2d1f1a]">{endsInText}</p>
                                    <p className="text-xs text-[#8b7355] mt-1">({resolveDayDateText})</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <div className="group relative flex-1">
                            <button
                                type="button"
                                disabled={ctaDisabled}
                                onClick={handleCtaClick}
                                className={ctaClassName}
                            >
                                {ctaLabel}
                            </button>
                            {showCreatorCtaHoverHint && (
                                <div className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-1 -translate-x-1/2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    You created this challenge
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleShareChallenge}
                            className="flex-1 py-3.5 px-6 bg-white/80 hover:bg-white rounded-xl text-[#2d1f1a] font-semibold text-base border border-[#d4a574]/30 hover:border-[#d4a574] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {shareFeedback ?? "Share"}
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
