"use client";

import React from "react";
import Image from "next/image";
import dayjs from "dayjs";

interface ProfileHeaderProps {
    username: string;
    avatar: string;
    walletAddress: string;
    bio: string;
    joinedDate: string;
    balance: {
        sol: number;
        solUsd: number;
        usdc: number;
        usdcUsd: number;
    };
    stats: {
        wins: number;
        rekts: number;
        totalChallenges: number;
        winRatio: number;
    };
    twitterUsername?: string | null;
    isOwnProfile?: boolean;
    isFollowing?: boolean;
    followersCount?: number;
    followingCount?: number;
    onToggleFollow?: () => void;
    isFollowActionLoading?: boolean;
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
    isOwnProfile = false,
    isFollowing = false,
    followersCount = 0,
    followingCount = 0,
    onToggleFollow,
    isFollowActionLoading = false,
}: ProfileHeaderProps) {
    const [walletCopied, setWalletCopied] = React.useState(false);
    const [profileCopied, setProfileCopied] = React.useState(false);

    const copyToClipboard = (text: string, type: 'wallet' | 'profile') => {
        navigator.clipboard.writeText(text);
        if (type === 'wallet') {
            setWalletCopied(true);
            setTimeout(() => setWalletCopied(false), 2000);
        } else {
            setProfileCopied(true);
            setTimeout(() => setProfileCopied(false), 2000);
        }
    };

    const shareProfile = () => {
        const profileUrl = `${window.location.origin}/profile/${username}`;
        if (navigator.share) {
            navigator.share({
                title: `${username}'s Profile`,
                url: profileUrl,
            });
        } else {
            copyToClipboard(profileUrl, 'profile');
        }
    };

    const truncatedAddress = walletAddress.length > 16
        ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`
        : walletAddress;

    return (
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 bg-white/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-400 shadow-lg items-start">
            {/* Left: Avatar and Info */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 flex-1 min-w-0 items-center sm:items-start">
                {/* Avatar with glow effect */}
                <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                    <div className="absolute inset-0 rounded-full blur-xl pointer-events-none"></div>
                    {/* Image container  */}
                    <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full ring-4 ring-orange-200 ">
                        <Image
                            src={avatar}
                            alt={username}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                        />
                        {twitterUsername && (
                            <a
                                href={`https://x.com/${twitterUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${username} on Twitter/X`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://x.com/${twitterUsername}`, "_blank", "noopener,noreferrer");
                                }}
                                className="absolute bottom-0 right-0 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black text-white ring-2 ring-white hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2H21.5l-7.1 8.114L22.75 22h-6.542l-5.122-6.65L5.27 22H2l7.592-8.682L1.75 2h6.708l4.63 6.08L18.244 2zm-1.146 18.06h1.804L7.48 3.84H5.55l11.548 16.22z" />
                                </svg>
                            </a>
                        )}
                    </div>
                    <div className="mt-3 flex w-full min-w-[180px] max-w-[220px] flex-col items-center gap-2">
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
                                className={`w-full px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${isFollowing
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
                <div className="flex flex-col gap-3 justify-center min-w-0 items-center sm:items-start text-center sm:text-left">
                    {/* Username with gradient */}
                    <div className="flex items-center justify-center sm:justify-start gap-2 min-w-0">
                        <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent break-words sm:break-normal">
                            {username}
                        </h1>
                        {twitterUsername ? (
                            <span
                                className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-blue-500 text-white flex-shrink-0 shadow-sm"
                                title="Verified on X"
                                aria-label="Verified on X"
                            >
                                <svg className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                        ) : null}
                    </div>

                    {/* Wallet Address - Improved with copy feedback */}
                    <div className="group flex flex-wrap items-center justify-center sm:justify-start gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100/80 rounded-lg border border-gray-200/50 min-w-0">
                            <span className="text-sm">🌙</span>
                            <span className="text-xs sm:text-sm text-gray-600 font-mono break-all sm:break-normal sm:whitespace-nowrap">{truncatedAddress}</span>
                        </div>
                        <button
                            className="p-1.5 rounded-lg bg-gray-100/80 border border-gray-200/50 text-gray-500 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all duration-200 active:scale-95"
                            onClick={() => copyToClipboard(walletAddress, 'wallet')}
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
                    <p className="text-sm text-gray-500 max-w-md leading-relaxed break-words">
                        {bio}
                    </p>

                    {/* Action Buttons - Redesigned */}
                    <div className="flex flex-wrap items-stretch justify-center sm:justify-start gap-2 sm:gap-3 mt-1">
                        {/* Joined Badge */}
                        <div className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 rounded-xl text-xs sm:text-sm font-medium text-orange-700 border border-orange-200/50 flex items-center justify-center sm:justify-start gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Joined {dayjs(joinedDate).format("MMM YYYY")}
                        </div>

                        {/* Share Button */}
                        <button
                            className="w-full sm:w-auto cursor-pointer group px-3 sm:px-4 py-2 bg-orange-400 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
                            onClick={shareProfile}
                        >
                            {profileCopied ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share Profile
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right: Balance & Stats Card */}
            <div className="flex flex-col bg-white/20 backdrop-blur-lg rounded-2xl p-3 sm:p-5 border border-gray-200/40 shadow-lg gap-3 sm:gap-4 w-full lg:w-[480px]">
                {/* Balance Section */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch sm:items-center gap-2 sm:gap-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                    {/* SOL Balance */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Image
                            src="/scribbles/solbal.png"
                            alt="SOL"
                            width={48}
                            height={48}
                            className="w-9 h-9 sm:w-12 sm:h-12 object-contain"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">SOL</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-bold text-gray-900 break-all sm:break-normal">{balance.sol.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:block w-px h-10 bg-gray-200/60"></div>

                    {/* USDC Balance */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Image
                            src="/scribbles/dollar.png"
                            alt="USDC"
                            width={36}
                            height={36}
                            className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">USDC</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl sm:text-2xl font-bold text-gray-900 break-all sm:break-normal">{balance.usdc.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Row - Cleaner design */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-gradient-to-r from-orange-50/50 to-amber-50/50 rounded-xl border border-orange-100/30">
                    {/* Wins */}
                    <div className="flex items-center gap-2 px-2 sm:px-3 py-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-sm">
                            <span className="text-white text-sm">🏆</span>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 leading-none">{stats.wins}</p>
                            <p className="text-xs text-gray-500">Wins</p>
                        </div>
                    </div>

                    {/* Rekts */}
                    <div className="flex items-center gap-2 px-2 sm:px-3 py-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-sm">
                            <span className="text-white text-sm">💀</span>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 leading-none">{stats.rekts}</p>
                            <p className="text-xs text-gray-500">Rekts</p>
                        </div>
                    </div>

                    {/* Win Rate */}
                    <div className="flex items-center gap-2 px-2 sm:px-3 py-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                            <span className="text-white text-sm">📊</span>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 leading-none">{stats.winRatio}%</p>
                            <p className="text-xs text-gray-500">Win Rate</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
