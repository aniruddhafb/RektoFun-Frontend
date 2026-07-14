"use client";

import React from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { ShareProfileModal } from "./ShareProfileModal";

interface ProfileHeaderProps {
    username: string;
    avatar: string;
    walletAddress: string;
    bio: string;
    joinedDate: string;
    balance: {
        rekto: number;
        usdc: number;
        usdcUsd: number;
    };
    stats: {
        wins: number;
        rekts: number;
        totalChallenges: number;
        winRatio: number;
        pnl: number;
        volume: number;
    };
    twitterUsername?: string | null;
    userType?: "user" | "moderator";
    isOwnProfile?: boolean;
    isFollowing?: boolean;
    followersCount?: number;
    followingCount?: number;
    onToggleFollow?: () => void;
    isFollowActionLoading?: boolean;
    showSettingsIcon?: boolean;
    isRektoBalanceLoading?: boolean;
    isUsdcBalanceLoading?: boolean;
}

function formatTokenBalance(balance: number) {
    if (!Number.isFinite(balance)) return "0";

    if (Math.abs(balance) < 1000) {
        return balance.toLocaleString(undefined, {
            maximumFractionDigits: 4,
        });
    }

    return new Intl.NumberFormat(undefined, {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
    }).format(balance).toUpperCase();
}

export function ProfileHeader({
    username,
    avatar,
    walletAddress,
    bio,
    joinedDate,
    balance,
    stats,
    twitterUsername,
    userType = "user",
    isOwnProfile = false,
    isFollowing = false,
    followersCount = 0,
    followingCount = 0,
    onToggleFollow,
    isFollowActionLoading = false,
    showSettingsIcon = false,
    isRektoBalanceLoading = false,
    isUsdcBalanceLoading = false,
}: ProfileHeaderProps) {
    const [walletCopied, setWalletCopied] = React.useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setWalletCopied(true);
        setTimeout(() => setWalletCopied(false), 2000);
    };

    const truncatedAddress = walletAddress.length > 16
        ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`
        : walletAddress;

    const formattedRektoBalance = formatTokenBalance(balance.rekto);
    const formattedPnl = Number.isFinite(stats.pnl)
        ? `${stats.pnl > 0 ? "+" : ""}${stats.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : "0";

    return (
        <div className="profile-header-shell flex flex-col lg:flex-row lg:items-stretch gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 bg-white/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl items-center sm:items-start">
            {/* Left: Avatar and Info */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 flex-1 min-w-0 items-center sm:items-start w-full">
                {/* Avatar with glow effect */}
                <div className="relative flex w-full sm:w-auto flex-col items-center sm:items-start flex-shrink-0 mx-auto sm:mx-0">
                    <div className="absolute inset-0 rounded-full blur-xl pointer-events-none"></div>
                    {/* Image container  */}
                    <div className="profile-avatar relative z-10 w-24 h-24 sm:w-32 sm:h-32">
                        <div className="absolute inset-0 overflow-hidden rounded-full bg-white ring-4 ring-orange-200">
                            <Image
                                src={avatar}
                                alt={username}
                                fill
                                sizes="(min-width: 640px) 128px, 96px"
                                className="object-cover"
                            />
                        </div>
                        {twitterUsername ? (
                            <a
                                href={`https://x.com/${twitterUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute -bottom-1 -right-1 z-20 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-black text-white shadow-sm transition-colors hover:bg-gray-800 sm:h-9 sm:w-9"
                                title={`@${twitterUsername} on X`}
                                aria-label={`Open @${twitterUsername} on X`}
                            >
                                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18.244 2H21.5l-7.1 8.114L22.75 22h-6.542l-5.122-6.65L5.27 22H2l7.592-8.682L1.75 2h6.708l4.63 6.08L18.244 2zm-1.146 18.06h1.804L7.48 3.84H5.55l11.548 16.22z" />
                                </svg>
                            </a>
                        ) : null}
                    </div>
                    <div className="mt-3 flex w-full min-w-[180px] max-w-[280px] sm:max-w-[220px] flex-col items-center gap-2">
                        <div className="grid w-full grid-cols-2 gap-2 rounded-xl border border-orange-200/60 bg-orange-50/70 p-2 text-center">
                            <div>
                                <p className="text-sm font-bold text-gray-900">{followingCount}</p>
                                <p className="text-[11px] text-gray-600">Following</p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{followersCount}</p>
                                <p className="text-[11px] text-gray-600">Followers</p>
                            </div>
                        </div>
                        {!isOwnProfile && onToggleFollow ? (
                            <button
                                className={`cursor-pointer w-full px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-sm sm:text-sm font-semibold transition-all duration-200 border ${isFollowing
                                    ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    : "bg-gray-900 text-white border-gray-900 hover:bg-black"
                                    }`}
                                onClick={onToggleFollow}
                                disabled={isFollowActionLoading}
                            >
                                {isFollowActionLoading ? "Please wait..." : isFollowing ? "Unfollow" : "Follow"}
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* User Info */}
                <div className="flex w-full sm:w-auto sm:flex-1 flex-col gap-3 justify-center min-w-0 items-center sm:items-start text-center sm:text-left">
                    {/* Username with gradient */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0">
                        <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent break-words sm:break-normal">
                            {username}
                        </h1>
                        {(userType === "moderator" || twitterUsername) && (
                            <span
                                className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-white drop-shadow-sm sm:h-7 sm:w-7"
                                title={userType === "moderator" ? "Verified as KOL" : `Verified on X as @${twitterUsername}`}
                                aria-label={userType === "moderator" ? "Verified as KOL" : `Verified on X as @${twitterUsername}`}
                            >
                                <svg className="h-full w-full" viewBox="0 0 32 32" aria-hidden="true">
                                    <path
                                        fill={userType === "moderator" ? "#F5B800" : "#378FDB"}
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinejoin="round"
                                        d="M16 1.5l2.8 2.2 3.5-1 1.6 3.2 3.6.5.1 3.7 3 2-1.4 3.4 1.4 3.4-3 2-.1 3.7-3.6.5-1.6 3.2-3.5-1L16 30.5l-2.8-2.2-3.5 1-1.6-3.2-3.6-.5-.1-3.7-3-2 1.4-3.4-1.4-3.4 3-2 .1-3.7 3.6-.5 1.6-3.2 3.5 1L16 1.5Z"
                                    />
                                    <path
                                        d="m9.4 16.2 4.2 4.2 9-9"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="3.4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                        )}
                        {showSettingsIcon ? (
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new Event("rektofun:open-edit-profile"))}
                                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-gray-400 bg-gray-100/80 text-gray-600 transition-colors hover:bg-gray-200/80 hover:text-gray-900 flex-shrink-0"
                                aria-label="Edit profile"
                                title="Edit profile"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 3.487a2.1 2.1 0 0 1 2.97 2.97L8.25 18.04 4 19l.96-4.25L16.862 3.487Z" />
                                </svg>
                            </button>
                        ) : null}
                    </div>

                    {/* Wallet Address - Improved with copy feedback */}
                    <div className="group flex w-full sm:w-auto flex-wrap items-center justify-center sm:justify-start gap-2 min-w-0">
                        <div className="flex max-w-full items-center gap-1.5 px-3 py-1.5 bg-gray-100/80 rounded-lg border border-gray-200/50 min-w-0">
                            <span className="text-sm">🌙</span>
                            <span className="text-xs sm:text-sm text-gray-600 font-mono truncate sm:break-normal sm:whitespace-nowrap">{truncatedAddress}</span>
                        </div>
                        <button
                            className="p-1.5 rounded-lg bg-gray-100/80 border border-gray-200/50 text-gray-500 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all duration-200 active:scale-95"
                            onClick={() => copyToClipboard(walletAddress)}
                            title={walletCopied ? "Copied!" : "Copy address"}
                        >
                            {walletCopied ? (
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-gray-500 max-w-md leading-relaxed break-words px-1 sm:px-0">
                        {bio}
                    </p>

                    {/* Action Buttons - Redesigned */}
                    <div className="flex w-full flex-wrap items-stretch justify-center sm:justify-start gap-2 sm:gap-3 mt-1">
                        {/* Joined Badge */}
                        <div className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl text-xs sm:text-sm font-medium text-orange-700 border border-orange-200/50 flex items-center justify-center sm:justify-start gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Joined {dayjs(joinedDate).format("D MMMM YYYY")}
                        </div>

                        {/* Share Button */}
                        <button
                            className="w-full sm:w-auto cursor-pointer group px-3 sm:px-4 py-2.5 sm:py-2 bg-orange-400 rounded-xl text-sm sm:text-sm font-semibold text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                            onClick={() => setIsShareModalOpen(true)}
                        >
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share Profile
                                </>
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Balance & Stats Card */}
            <div className="profile-performance-panel flex w-full flex-col gap-3 rounded-2xl bg-white/55 p-3 shadow-[0_12px_35px_rgba(92,52,30,0.08)] backdrop-blur-lg sm:gap-4 sm:p-4 lg:w-[560px] lg:flex-none">
                {/* Balance Section */}
                <div className="profile-balance-panel grid grid-cols-2 gap-2 rounded-xl bg-white/75 p-2 sm:gap-3 sm:p-3">
                    {/* REKTO Balance */}
                    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-[#fff7ef] px-3 py-3 sm:gap-3 sm:px-4">
                        <Image
                            src="/fav_old.png"
                            alt="REKTO"
                            width={40}
                            height={40}
                            className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
                        />
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 sm:text-xs">$REKTO BALANCE</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="truncate text-xl font-black text-gray-950 sm:text-2xl">
                                    {isRektoBalanceLoading ? ".." : formattedRektoBalance}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* USDC Balance */}
                    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-[#f5fbff] px-3 py-3 sm:gap-3 sm:px-4">
                        <Image
                            src="/scribbles/dollar.png"
                            alt="USDC"
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
                        />
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 sm:text-xs">USDC BALANCE</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="truncate text-xl font-black text-gray-950 sm:text-2xl">
                                    {isUsdcBalanceLoading ? ".." : balance.usdc.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row - Cleaner design */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {/* Challenges Created */}
                    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/80 p-3 sm:flex-col sm:items-start sm:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-sky-500 shadow-sm">
                            <span className="text-white text-sm">⚔️</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-black leading-none text-gray-950">{stats.totalChallenges}</p>
                            <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-gray-500">Created</p>
                        </div>
                    </div>

                    {/* Wins */}
                    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3 sm:flex-col sm:items-start sm:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm">
                            <span className="text-white text-sm">🏆</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-black leading-none text-gray-950">{stats.wins}</p>
                            <p className="mt-1 text-[11px] font-bold text-gray-500">Wins</p>
                        </div>
                    </div>

                    {/* Rekts */}
                    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-red-100 bg-red-50/80 p-3 sm:flex-col sm:items-start sm:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-400 to-red-500 shadow-sm">
                            <span className="text-white text-sm">💀</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl font-black leading-none text-gray-950">{stats.rekts}</p>
                            <p className="mt-1 text-[11px] font-bold text-gray-500">Rekts</p>
                        </div>
                    </div>

                    {/* Total P&L */}
                    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/80 p-3 sm:flex-col sm:items-start sm:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-violet-500 shadow-sm">
                            <span className="text-white text-sm">💰</span>
                        </div>
                        <div className="min-w-0">
                            <p className={`truncate text-xl font-black leading-none ${stats.pnl > 0 ? "text-emerald-600" : stats.pnl < 0 ? "text-red-600" : "text-gray-950"}`} title={formattedPnl}>
                                {formattedPnl}
                            </p>
                            <p className="mt-1 whitespace-nowrap text-[11px] font-bold text-gray-500">Total P&amp;L</p>
                        </div>
                    </div>
                </div>
            </div>
            <ShareProfileModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} username={username} avatar={avatar} verified={!!twitterUsername} isModerator={userType === "moderator"} stats={stats} />
        </div>
    );
}
