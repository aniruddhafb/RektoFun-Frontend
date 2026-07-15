"use client";

import React from "react";
import Image from "next/image";
import { AcceptChallengeModal } from "./AcceptChallengeModal";
import { useChallengeCard } from "@/app/hooks/useChallengeCard";
import { Challenge } from "@/app/lib/challenges-service/challenges";
import { ShareChallengeModal } from "./ShareChallengeModal";
import { ProfileHoverPreview } from "./ProfileHoverPreview";
import { WinningsShareModal } from "./WinningsShareModal";
import { ChallengeActionModal } from "./ChallengeActionModal";
import { getPositionsByChallenge, type Position } from "@/app/lib/positions-service/positions";
import { getUserById, type User as UserType } from "@/app/lib/users-service/users";
import { CHALLENGE_UPDATED_EVENT, type ChallengeUpdatedDetail } from "@/app/lib/realtime-events";

type TeamCardParticipant = {
    key: string;
    name: string;
    avatar: string;
    wallet: string;
    side: "TEAM_A" | "TEAM_B";
};

const cardParticipantRequests = new Map<number, Promise<Array<{ position: Position; user: UserType | null }>>>();

function loadCardParticipants(challengeId: number, refresh = false) {
    if (refresh) cardParticipantRequests.delete(challengeId);
    const cached = cardParticipantRequests.get(challengeId);
    if (cached) return cached;
    const request = getPositionsByChallenge(challengeId).then(async (positions) => {
        const userIds = [...new Set(positions.map((position) => position.creator).filter(Boolean))];
        const users = await Promise.allSettled(userIds.map((id) => getUserById(id)));
        const usersById = new Map<number, UserType>();
        users.forEach((result) => {
            if (result.status === "fulfilled") usersById.set(result.value.id, result.value);
        });
        return positions.map((position) => ({ position, user: usersById.get(position.creator) ?? null }));
    }).catch((error) => {
        cardParticipantRequests.delete(challengeId);
        throw error;
    });
    cardParticipantRequests.set(challengeId, request);
    return request;
}

function CompactProfileStack({
    participants,
    fallback,
    onOpenProfile,
}: {
    participants: TeamCardParticipant[];
    fallback: TeamCardParticipant;
    onOpenProfile: (event: React.MouseEvent, wallet: string) => void;
}) {
    const profiles = participants.length ? participants : [fallback];
    const visible = profiles.slice(0, 3);
    return (
        <div className="relative flex h-14 w-full items-center justify-center">
            {visible.map((participant, index) => (
                <button
                    key={participant.key}
                    type="button"
                    disabled={!participant.wallet}
                    onClick={(event) => onOpenProfile(event, participant.wallet)}
                    className="challenge-card-avatar absolute h-11 w-11 overflow-hidden rounded-full border-2 border-[#d4a574] bg-[#f5d547] shadow-sm transition-transform hover:-translate-y-0.5 disabled:cursor-default sm:h-12 sm:w-12"
                    style={{
                        transform: `translateX(${(index - (visible.length - 1) / 2) * 17}px)`,
                        zIndex: visible.length - index,
                    }}
                    aria-label={`Open ${participant.name}'s profile`}
                    title={participant.name}
                >
                    <Image src={participant.avatar} alt={participant.name} width={48} height={48} className="h-full w-full rounded-full object-cover" />
                </button>
            ))}
            {profiles.length > 3 && (
                <span className="absolute -right-1 -top-1 z-10 rounded-full border-2 border-white bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black text-white">
                    +{profiles.length - 3}
                </span>
            )}
        </div>
    );
}

interface ChallengeCardProps {
    challenge: Challenge;
    onClick?: (challenge: Challenge) => void;
    onRekt?: (challenge: Challenge) => void;
    onToggleBookmark?: (challengeId: string) => void;
    isBookmarked?: boolean;
    ownerAddress?: string;
    showPin?: boolean;
}

export function ChallengeCard({
    challenge,
    onClick,
    onRekt,
    onToggleBookmark,
    isBookmarked = false,
    showPin = true,
}: ChallengeCardProps) {
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
    const [activeProfilePreview, setActiveProfilePreview] = React.useState<"creator" | "opponent" | null>(null);
    const [viewOverrides, setViewOverrides] = React.useState<Record<number, number>>({});
    const [teamParticipants, setTeamParticipants] = React.useState<{ challengeId: number; rows: TeamCardParticipant[] } | null>(null);
    const viewCount = Math.max(challenge.views ?? 0, viewOverrides[challenge.id] ?? 0);
    const {
        isLoading,
        isBetFormOpen,
        betInput,
        betError,
        joinSide,
        setBetInput,
        setBetError,
        setJoinSide,
        openBetForm,
        openProfile,
        closeBetForm,
        handleJoinChallenge,
        assetIcon,
        assetName,
        creatorDisplayName,
        creatorProfileImage,
        creatorWalletAddress,
        creatorIsVerified,
        creatorIsModerator,
        opponentInfo,
        hasOpponentInfo,
        opponentProfileImage,
        opponentDisplayName,
        opponentIsVerified,
        opponentIsModerator,
        teamATotalBets,
        teamATotalAmount,
        teamBTotalBets,
        teamBTotalAmount,
        title,
        betCurrency,
        poolDisplay,
        timeRemaining,
        isExpiryUnderOneHour,
        createdTimeText,
        challengeEndTimeText,
        resolveDateByText,
        endsByCountdown,
        exactCountdownDetails,
        isPvpMode,
        isTeam,
        isManualResolution,
        hasOpponents,
        isExpireTimeAchieved,
        isResolveTimeAchieved,
        ctaState,
        challengeAction,
        actionError,
        handleChallengeAction,
        pendingChallengeAction,
        confirmChallengeAction,
        closeChallengeActionConfirmation,
        claimedWinnings,
        closeWinningsShare,
        isBattleOnState,
        isCancelledState,
        isResolvingState,
        isCompletedState,
        isExpiresInState,
        expiryStatusText,
        expiryTooltipText,
        hasWon,
        hasLost,
        usdcBalance,
        modalMinAcceptBet,
        requiresCreatorStakeMatch,
        modalMaxAcceptBet,
        escrowAddress,
    } = useChallengeCard(challenge);

    React.useEffect(() => {
        const handleChallengeViewed = (event: Event) => {
            const { challengeId, views } = (event as CustomEvent<{
                challengeId: number;
                views: number;
            }>).detail;

            if (challengeId === challenge.id) {
                setViewOverrides((currentOverrides) => ({
                    ...currentOverrides,
                    [challengeId]: Math.max(currentOverrides[challengeId] ?? 0, views),
                }));
            }
        };

        window.addEventListener("rektofun:challenge-viewed", handleChallengeViewed);
        return () => window.removeEventListener("rektofun:challenge-viewed", handleChallengeViewed);
    }, [challenge.id]);

    React.useEffect(() => {
        if (!isTeam) return;
        let cancelled = false;

        const load = (refresh = false) => {
            loadCardParticipants(challenge.id, refresh)
                .then((records) => {
                    if (cancelled) return;
                    const grouped = new Map<string, TeamCardParticipant>();
                    records.forEach(({ position, user }) => {
                        const side = position.side === "TEAM_B" ? "TEAM_B" : "TEAM_A";
                        const key = `${side}:${position.creator}`;
                        if (grouped.has(key)) return;
                        grouped.set(key, {
                            key,
                            name: user?.username || `Player ${position.creator}`,
                            avatar: user?.profile_image || "/scribbles/btc.png",
                            wallet: user?.pubkey || user?.wallet_address || "",
                            side,
                        });
                    });
                    const creatorId = Number(challenge.creator_id ?? challenge.creator ?? 0);
                    if (![...grouped.values()].some((participant) => participant.side === "TEAM_A" && participant.key.endsWith(`:${creatorId}`))) {
                        grouped.set(`TEAM_A:${creatorId}`, {
                            key: `TEAM_A:${creatorId}`,
                            name: creatorDisplayName,
                            avatar: creatorProfileImage,
                            wallet: creatorWalletAddress,
                            side: "TEAM_A",
                        });
                    }
                    setTeamParticipants({ challengeId: challenge.id, rows: [...grouped.values()] });
                })
                .catch((error) => console.error("Failed to load card participants:", error));
        };

        load();
        const handleUpdated = (event: Event) => {
            const detail = (event as CustomEvent<ChallengeUpdatedDetail>).detail;
            if (detail.challengeId === challenge.id && detail.action === "joined") load(true);
        };
        window.addEventListener(CHALLENGE_UPDATED_EVENT, handleUpdated);
        return () => {
            cancelled = true;
            window.removeEventListener(CHALLENGE_UPDATED_EVENT, handleUpdated);
        };
    }, [challenge.creator, challenge.creator_id, challenge.id, creatorDisplayName, creatorProfileImage, creatorWalletAddress, isTeam]);

    const currentTeamParticipants = teamParticipants?.challengeId === challenge.id ? teamParticipants.rows : [];
    const challengerProfiles = isTeam
        ? currentTeamParticipants.filter((participant) => participant.side === "TEAM_A")
        : [];
    const opponentProfiles = isTeam
        ? currentTeamParticipants.filter((participant) => participant.side === "TEAM_B")
        : [];

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        const target = e.target as HTMLElement;
        if (target.closest("button, a, input, [role='button'], [data-card-action='true']")) {
            return;
        }

        if (onClick) {
            window.setTimeout(() => onClick(challenge), 0);
        } else if (onRekt) {
            window.setTimeout(() => onRekt(challenge), 0);
        }
    };

    const openShareModal = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsShareModalOpen(true);
    };

    const handleJoinChallengeWrapper = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        await handleJoinChallenge();
    };

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleBookmark?.(String(challenge.id));
    };

    return (
        <>
            <div onClick={handleClick}
                className="challenge-card-shell group/card relative block cursor-pointer overflow-visible rounded-xl border border-gray-200 bg-[#fffaf6] p-3 transition-all duration-300 hover:z-30 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus-within:z-30 sm:p-4"
            >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Image
                            src={assetIcon}
                            alt={assetName}
                            width={64}
                            height={64}
                            unoptimized
                            className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
                        />
                        <div className="min-w-0">
                            <h3 className="break-words text-gray-900 leading-tight">
                                {isManualResolution ? (
                                    <span
                                        onClick={handleClick}
                                        className="block cursor-pointer break-words text-[15px] font-black tracking-tight text-black transition-colors  sm:text-[16px]"
                                        style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {title}
                                    </span>
                                ) : isResolveTimeAchieved ? (
                                    <span
                                        onClick={handleClick}
                                        className="block cursor-pointer break-words text-[15px] font-black tracking-tight text-black transition-colors sm:text-[16px]"
                                        style={{
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {title} by {resolveDateByText}
                                    </span>
                                ) : (
                                    <>
                                        <span
                                            onClick={handleClick}
                                            className="block cursor-pointer break-words text-[15px] font-black tracking-tight text-black transition-colors sm:text-[16px]"
                                            style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {title} In
                                        </span>
                                        <span
                                            onClick={handleClick}
                                            className="block cursor-pointer break-words text-[15px] font-black tracking-tight text-black transition-colors sm:text-[16px]"
                                        >
                                            Next
                                            <span className="ml-1 inline-flex items-center gap-1 sm:ml-2 sm:gap-1.5">
                                                <span className="text-sm font-bold text-emerald-900">{endsByCountdown}</span>
                                                <span className="group relative inline-flex items-center">
                                                    <svg className="h-3.5 w-3.5 cursor-help text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="invisible absolute left-1/2 top-full z-10 mt-2 w-60 -translate-x-1/2 rounded-lg bg-gray-900 p-2 text-[11px] font-medium normal-case leading-relaxed text-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
                                                        <span className="block">Exact countdown: {exactCountdownDetails.exactCountdown}</span>
                                                        <span className="block">Time left: {exactCountdownDetails.timeLeftText}</span>
                                                        <span className="block">Resolves on: {exactCountdownDetails.dayLabel}</span>
                                                        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900"></span>
                                                    </span>
                                                </span>
                                            </span>
                                        </span>
                                    </>
                                )}
                            </h3>
                        </div>
                    </div>
                    {/* Watchlist Button */}
                    {showPin && <button
                        type="button"
                        onClick={handleBookmarkClick}
                        aria-label={isBookmarked ? "Remove Pin" : "Pin this"}
                        title={isBookmarked ? "Remove pin" : "Pin this"}
                        className="shrink-0 cursor-pointer border-2 border-black bg-white p-2 transition-all hover:-translate-y-0.5 hover:bg-[#f5d547] hover:text-black hover:shadow-[2px_2px_0_#111]"
                    >
                        <svg className="w-5 h-5 text-black rotate-45" stroke="currentColor" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17v4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3h8l-1 6 3 3H6l3-3-1-6z" />
                        </svg>
                    </button>}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-3"></div>

                {/* Challenge Mode Info */}
                <div className="mb-4 flex items-center justify-center">
                    <div className="group relative inline-flex cursor-pointer">
                        <h2 className={`border border-black px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black hover:shadow-[2px_2px_0_#111] ${isTeam ? "bg-[#67d5c4]" : "bg-[#f5d547]"}`}>
                            {isPvpMode ? "PVP Mode" : "Team Mode"}
                        </h2>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-center pointer-events-none">
                            {isPvpMode
                                ? "The creator has set this challenge to PVP mode, meaning it's a 1v1 challenge only."
                                : "The creator has set this challenge to team mode, meaning multiple people can join."}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </div>


                {/* VS Section */}
                <div className="mb-5">
                    <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-4">
                        {/* Challenger Profile */}
                        <div
                            onMouseEnter={() => setActiveProfilePreview("creator")}
                            onMouseLeave={() => setActiveProfilePreview(null)}
                            onFocusCapture={() => setActiveProfilePreview("creator")}
                            onBlurCapture={(event) => {
                                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                                    setActiveProfilePreview(null);
                                }
                            }}
                            className={`relative group flex flex-col items-center ${activeProfilePreview === "creator" ? "z-30" : ""}`}
                        >
                            <div className={`challenge-card-profile-tile relative flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center p-2 transition-all duration-300 sm:h-[140px] sm:w-[120px] sm:p-3 ${isPvpMode ? "rounded-none" : "rounded-xl"} ${hasWon
                                ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400"
                                : hasLost
                                    ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                    : "bg-white/80 border-2 border-[#d4a574]/30"
                                }`}>
                                {/* Winner Crown */}
                                {hasWon && (
                                    <div className="text-2xl">
                                        👑
                                    </div>
                                )}

                                {/* Avatar */}
                                {isTeam ? (
                                    <CompactProfileStack
                                        participants={challengerProfiles}
                                        fallback={{ key: "creator", name: creatorDisplayName, avatar: creatorProfileImage, wallet: creatorWalletAddress, side: "TEAM_A" }}
                                        onOpenProfile={openProfile}
                                    />
                                ) : <div className="relative">
                                    <div className={`h-11 w-11 overflow-hidden rounded-full border-2 sm:h-14 sm:w-14 ${hasWon ? "border-amber-400" : "border-[#d4a574]"}`}>
                                        <Image
                                            src={creatorProfileImage}
                                            alt={creatorDisplayName}
                                            width={56}
                                            height={56}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {creatorIsVerified && <AvatarVerifiedBadge isModerator={creatorIsModerator} name={creatorDisplayName} />}
                                </div>}
                                {/* Label */}
                                <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                    {isTeam ? "CHALLENGERS" : "CHALLENGER"}
                                </div>

                                {/* Info */}
                                <div className="mt-2 w-full min-w-0 text-center">
                                    <p className="w-full truncate px-0.5 text-xs font-bold text-[#2d1f1a]" title={creatorDisplayName}>
                                        {creatorDisplayName}
                                    </p>
                                    {teamATotalAmount > 0 ? (
                                        <p className="mt-0.5 truncate px-0.5 text-[10px] font-bold text-emerald-600">
                                            {isTeam
                                                ? `${teamATotalBets} ${teamATotalBets === 1 ? "bet" : "bets"}`
                                                : `Has bet $${teamATotalAmount}`}
                                        </p>
                                    ) : (
                                        <p className="mt-0.5 break-all text-[10px] text-[#8b7355]">
                                            {hasWon ? "Won!" : hasLost ? "Lost" : ""}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {activeProfilePreview === "creator" && (
                                <ProfileHoverPreview
                                    walletAddress={creatorWalletAddress}
                                    fallbackAvatar={creatorProfileImage}
                                    fallbackName={creatorDisplayName}
                                    align="left"
                                />
                            )}

                        </div>

                        {/* VS Badge or Pending Badge */}
                        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
                            <>
                                {/* VS BADGE  */}
                                <div
                                    className={`flex h-10 w-10 items-center sm:h-12 sm:w-12 justify-center ${ctaState.isOngoing ? "rounded-full bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] hover:shadow-lg" : ""}`}
                                >
                                    {ctaState.isOngoing ? (
                                        <video
                                            src="/animations/Sword%20Battle.webm"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                                        />
                                    ) : (
                                        <Image
                                            src="/animations/versus.png"
                                            alt="Versus"
                                            width={60}
                                            height={60}
                                            className="h-14 w-14 object-contain sm:h-14 sm:w-14"
                                        />
                                    )}
                                </div>

                                {/* Pool Display */}
                                <div className="mt-2 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="group relative">
                                            <span className="inline-flex rounded-full border border-emerald-300 bg-white/70 px-2 py-0.5 text-[9px] text-emerald-600 font-medium cursor-help">
                                                Total Pool
                                            </span>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-center">
                                                the total money locked in the escrow contract
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[14px] font-extrabold text-emerald-600 sm:text-[20px]">{poolDisplay}</p>
                                </div>
                            </>
                        </div>

                        {/* opponent Profile */}
                        {hasOpponentInfo ? (
                            <div
                                onMouseEnter={() => setActiveProfilePreview("opponent")}
                                onMouseLeave={() => setActiveProfilePreview(null)}
                                onFocusCapture={() => setActiveProfilePreview("opponent")}
                                onBlurCapture={(event) => {
                                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                                        setActiveProfilePreview(null);
                                    }
                                }}
                                className={`relative group flex flex-col items-center ${activeProfilePreview === "opponent" ? "z-30" : ""}`}
                            >
                                <div className={`challenge-card-profile-tile relative flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center p-2 transition-all duration-300 sm:h-[140px] sm:w-[120px] sm:p-3 ${isPvpMode ? "rounded-none" : "rounded-xl"} ${hasLost
                                    ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400"
                                    : hasWon
                                        ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                        : "bg-white/80 border-2 border-[#d4a574]/30"
                                    }`}>
                                    {/* Winner Crown */}
                                    {hasLost && (
                                        <div className="text-2xl">
                                            👑
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    {isTeam ? (
                                        <CompactProfileStack
                                            participants={opponentProfiles}
                                            fallback={{ key: "opponent", name: opponentDisplayName, avatar: opponentProfileImage, wallet: opponentInfo?.wallet_address || "", side: "TEAM_B" }}
                                            onOpenProfile={openProfile}
                                        />
                                    ) : <div className="relative">
                                        <div className={`h-11 w-11 overflow-hidden rounded-full border-2 sm:h-14 sm:w-14 ${hasLost ? "border-amber-400" : "border-[#d4a574]"}`}>
                                            <Image
                                                src={opponentProfileImage}
                                                alt={opponentDisplayName}
                                                width={56}
                                                height={56}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {opponentIsVerified && <AvatarVerifiedBadge isModerator={opponentIsModerator} name={opponentDisplayName} />}
                                    </div>}
                                    {/* Label */}
                                    <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                        {isTeam ? "OPPONENTS" : "Opponent"}
                                    </div>

                                    {/* Info */}
                                    <div className="mt-2 w-full min-w-0 text-center">
                                        <p className="w-full truncate px-0.5 text-xs font-bold text-[#2d1f1a]" title={opponentDisplayName}>
                                            {opponentDisplayName}
                                        </p>
                                        {teamBTotalAmount > 0 ? (
                                            <p className="mt-0.5 truncate px-0.5 text-[10px] font-bold text-emerald-600">
                                                {isTeam
                                                    ? `${teamBTotalBets} ${teamBTotalBets === 1 ? "bet" : "bets"}`
                                                    : `Has bet $${teamBTotalAmount}`}
                                            </p>
                                        ) : (
                                            <p className="mt-0.5 break-all text-[10px] text-[#8b7355]">
                                                {hasLost ? "Won!" : hasWon ? "Lost" : ""}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {activeProfilePreview === "opponent" && (
                                    <ProfileHoverPreview
                                        walletAddress={opponentInfo?.wallet_address}
                                        fallbackAvatar={opponentProfileImage}
                                        fallbackName={opponentDisplayName}
                                        align="right"
                                    />
                                )}
                            </div>
                        ) : (
                            /* Placeholder for pending state */
                            <div className="flex flex-col items-center">
                                <div className={`challenge-card-profile-tile relative flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center border-2 border-dashed border-[#d4a574]/30 p-2 transition-colors hover:border-[#e85a2d] hover:bg-[#fff1e8] hover:!shadow-none sm:h-[140px] sm:w-[120px] sm:p-3 ${isPvpMode ? "rounded-none" : "rounded-xl"}`}>
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#d4a574]/50 bg-gradient-to-br from-gray-200 to-gray-300 sm:h-14 sm:w-14"
                                        aria-label={isExpireTimeAchieved ? "No opponent joined" : "Searching for an opponent"}
                                    >
                                        <span className="inline-flex animate-pulse [animation-duration:1800ms]">
                                            <Image
                                                src="/Icons/search.png"
                                                alt=""
                                                width={40}
                                                height={40}
                                                className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                                            />
                                        </span>
                                    </div>
                                    <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                        {isTeam ? " OPPONENTS" : "OPPONENT"}
                                    </div>
                                    {isExpireTimeAchieved && !hasOpponents ? (
                                        <div className="mt-2 text-center">
                                            <p className="font-bold text-[#8b7355] text-xs">No one yet!</p>
                                        </div>
                                    ) :
                                        (<div className="mt-2 text-center">
                                            <p className="font-bold text-[#8b7355] text-xs">No one yet!</p>
                                        </div>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* CTA Button */}
                <div>
                    <div className="group relative w-full">
                        <button
                            type="button"
                            disabled={ctaState.disabled}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (ctaState.disabled) return;
                                if (challengeAction) {
                                    void handleChallengeAction(e);
                                } else {
                                    openBetForm(e);
                                }
                            }}
                            className={ctaState.className}
                        >
                            {isLoading ? (challengeAction ? "PROCESSING..." : isTeam ? "JOINING..." : ctaState.label) : ctaState.label}
                        </button>
                        {ctaState.showCreatorHint && (
                            <div className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-1 -translate-x-1/2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                You created this challenge
                            </div>
                        )}
                    </div>
                    {actionError ? <p className="mt-2 text-center text-xs font-bold text-red-600">{actionError}</p> : null}
                </div>

                {/* Challenge Expiry */}
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-center text-xs text-gray-600">
                        {isExpiresInState || isBattleOnState ? (
                            <>
                                <span>{expiryStatusText}</span>
                                <span className={`font-medium ${isExpiresInState && isExpiryUnderOneHour ? "text-gray-700" : isBattleOnState ? "text-[#008080]" : "text-gray-900"}`}>
                                    {isBattleOnState ? endsByCountdown : timeRemaining}
                                </span>
                            </>
                        ) : (
                            <span
                                className={`font-semibold ${isCompletedState
                                    ? "text-gray-700"
                                    : isCancelledState
                                        ? "text-gray-600"
                                        : isResolvingState
                                        ? "text-amber-700"
                                        : isBattleOnState
                                            ? "text-[#008080]"
                                            : "text-gray-600"
                                    }`}
                            >
                                {expiryStatusText}
                            </span>
                        )}
                        <div className="group relative">
                            <svg className="h-3.5 w-3.5 cursor-help !text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                {expiryTooltipText}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-2"></div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 text-gray-600 sm:gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="min-w-0 break-words text-xs sm:text-sm"><span className="font-semibold text-gray-900">{createdTimeText}</span></span>
                        <div className="group relative">
                            <svg className="h-3.5 w-3.5 cursor-help !text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                This challenge was created {createdTimeText} and will end on {challengeEndTimeText} if accepted.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
                        <div
                            onClick={openShareModal}
                            className="flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer"
                            title="Share challenge link"
                            aria-label="Share challenge link"
                        >
                            <svg className="w-5 h-5 text-gray-500 hover:text-gray-900 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </div>
                        {/* Eye Icon */}
                        <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-900">{viewCount}</span>
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <AcceptChallengeModal
                isOpen={isBetFormOpen}
                isLoading={isLoading}
                usdcBalance={usdcBalance}
                betInput={betInput}
                betError={betError}
                betCurrency={betCurrency}
                minAcceptBet={modalMinAcceptBet}
                requiresCreatorStakeMatch={requiresCreatorStakeMatch}
                maxAcceptBet={modalMaxAcceptBet}
                escrowAddress={escrowAddress}
                resolveCountdown={exactCountdownDetails.exactCountdown}
                resolveLabel={exactCountdownDetails.dayLabel}
                joinCountdown={timeRemaining}
                joinLabel={challengeEndTimeText}
                currentPoolAmount={Math.max(teamATotalAmount + teamBTotalAmount, Number(challenge.initial_bet) || 0)}
                selectedSidePoolAmount={joinSide === "TEAM_A" ? Math.max(teamATotalAmount, Number(challenge.initial_bet) || 0) : teamBTotalAmount}
                isTeam={isTeam}
                joinSide={joinSide}
                onClose={() => closeBetForm()}
                onSubmit={(e) => handleJoinChallengeWrapper(e)}
                onBetInputChange={(value) => {
                    setBetInput(value);
                    if (betError) {
                        setBetError("");
                    }
                }}
                onJoinSideChange={(side) => setJoinSide(side)}
            />
            <ChallengeActionModal
                action={pendingChallengeAction}
                isExpired={isExpireTimeAchieved}
                isLoading={isLoading}
                error={actionError}
                onClose={closeChallengeActionConfirmation}
                onConfirm={() => void confirmChallengeAction()}
            />
            <ShareChallengeModal challenge={challenge} isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
            <WinningsShareModal
                challenge={challenge}
                amount={claimedWinnings ?? 0}
                isOpen={claimedWinnings !== null}
                onClose={closeWinningsShare}
            />
        </>
    );
}

function AvatarVerifiedBadge({ isModerator, name }: { isModerator: boolean; name: string }) {
    const label = isModerator ? `${name} is a verified KOL` : `${name} is verified on X`;

    return (
        <span
            className="absolute -bottom-1 -right-1 z-10 flex h-4 w-4 items-center justify-center drop-shadow-sm sm:h-5 sm:w-5"
            title={label}
            aria-label={label}
        >
            <svg className="h-full w-full" viewBox="0 0 32 32" aria-hidden="true">
                <path
                    fill={isModerator ? "#F5B800" : "#378FDB"}
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
    );
}
