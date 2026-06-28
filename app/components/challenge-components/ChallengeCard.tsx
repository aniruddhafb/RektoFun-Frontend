"use client";

import React from "react";
import Image from "next/image";
import { AcceptChallengeModal } from "./AcceptChallengeModal";
import { ChallengeListItem } from "@/app/lib/challenges-service/challenges";
import { useChallengeCard } from "@/app/hooks/useChallengeCard";

interface ChallengeCardProps {
    challenge: ChallengeListItem;
    onClick?: (challenge: ChallengeListItem) => void;
    onRekt?: (challenge: ChallengeListItem) => void;
    onToggleBookmark?: (challengeId: string) => void;
    isBookmarked?: boolean;
    ownerAddress?: string;
}

export function ChallengeCard({
    challenge,
    onClick,
    onRekt,
    onToggleBookmark,
    isBookmarked = false,
}: ChallengeCardProps) {
    const {
        isLoading,
        isBetFormOpen,
        betInput,
        betError,
        joinSide,
        setBetInput,
        setBetError,
        setJoinSide,
        handleClick: hookHandleClick,
        openBetForm,
        closeBetForm,
        openProfile,
        handleJoinChallenge,
        handleShareChallenge,
        creator,
        assetIcon,
        assetName,
        assetSymbol,
        creatorDisplayName,
        creatorProfileImage,
        opponentInfo,
        hasOpponentInfo,
        opponentProfileImage,
        opponentDisplayName,
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
        isCreator,
        isPvpMode,
        isPoolMode,
        isManualResolution,
        hasOpponents,
        isExpireTimeAchieved,
        isResolveTimeAchieved,
        ctaState,
        isBattleOnState,
        isResolvingState,
        isCompletedState,
        isExpiresInState,
        expiryStatusText,
        expiryTooltipText,
        hasWon,
        hasLost,
        usdcBalance,
        modalMinAcceptBet,
        modalMaxAcceptBet,
        escrowAddress,
    } = useChallengeCard(challenge);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onClick) {
            window.setTimeout(() => onClick(challenge), 0);
        } else if (onRekt) {
            window.setTimeout(() => onRekt(challenge), 0);
        }
    };

    const handleJoinChallengeWrapper = async (e: React.SubmitEvent<HTMLFormElement>) => {
        await handleJoinChallenge(e, onRekt);
    };

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleBookmark?.(challenge.id);
    };

    return (
        <>
            <div
                className="challenge-card-shell group/card block overflow-hidden rounded-xl border border-gray-200 bg-[#fffaf6] p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md sm:p-4"
            >
                {/* Header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Image
                            src={assetIcon}
                            alt={assetName}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
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
                                                    <svg className="w-3.5 h-3.5 text-emerald-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    </>
                                )}
                            </h3>
                        </div>
                    </div>
                    {/* Watchlist Button */}
                    <button
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
                    </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-3"></div>

                {/* Challenge Mode Info */}
                <div onClick={handleClick} className="mb-4 flex items-center justify-center">
                    <div className="group relative inline-flex cursor-pointer">
                        <h2 className="border border-black bg-[#f5d547] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black hover:shadow-[2px_2px_0_#111]">
                            {isPvpMode ? "PVP Mode" : "Pool Mode"}
                        </h2>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-center pointer-events-none">
                            {isPvpMode
                                ? "The creator has set this challenge to PVP mode, meaning it's a 1v1 challenge only."
                                : "The creator has set this challenge to pool mode, meaning multiple people can join."}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </div>


                {/* VS Section */}
                <div className="mb-5">
                    <div className="flex flex-row items-center justify-center gap-1.5 sm:gap-4">
                        {/* Challenger Profile */}
                        <div
                            onClick={(e) => openProfile(e, creator.wallet_address)}
                            className="relative group flex flex-col items-center cursor-pointer"
                        >
                            <div className={`challenge-card-profile-tile flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center rounded-xl p-2 transition-all duration-300 sm:h-[140px] sm:w-[120px] sm:p-3 ${hasWon
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
                                <div className={`h-11 w-11 overflow-hidden rounded-full border-2 sm:h-14 sm:w-14 ${hasWon ? "border-amber-400" : "border-[#d4a574]"
                                    } hover:shadow-md`}>
                                    <Image
                                        src={creatorProfileImage}
                                        alt={creatorDisplayName}
                                        width={56}
                                        height={56}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Label */}
                                <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                    {isPoolMode ? "CHALLENGERS" : "CHALLENGER"}
                                </div>

                                {/* Info */}
                                <div className="mt-2 w-full text-center">
                                    <p className="break-words font-bold text-[#2d1f1a] text-xs">{creatorDisplayName}</p>
                                    <p className="mt-0.5 break-all text-[10px] text-[#8b7355]">
                                        {hasWon ? "Won!" : hasLost ? "Lost" : ""}
                                    </p>
                                </div>
                            </div>
                            {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                <button
                                    type="button"
                                    onClick={(e) => openBetForm(e)}
                                    className={`absolute -bottom-4.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-[28px] font-black leading-none transition hover:scale-105 hover:shadow-md ${hasWon
                                        ? "border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-700 hover:from-amber-200 hover:to-yellow-100"
                                        : hasLost
                                            ? "border-red-300 bg-gradient-to-br from-red-100 to-rose-50 text-red-700 hover:from-red-200 hover:to-rose-100"
                                            : "border-[#d4a574]/40 bg-white/90 text-[#2d1f1a] hover:bg-white"
                                        }`}
                                    aria-label="counter"
                                    title="counter"
                                >
                                    +
                                </button>
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
                                onClick={(e) => openProfile(e, opponentInfo?.wallet_address)}
                                className="relative group flex flex-col items-center cursor-pointer"
                            >
                                <div className={`challenge-card-profile-tile flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center rounded-xl p-2 transition-all duration-300 sm:h-[140px] sm:w-[120px] sm:p-3 ${hasLost
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
                                    <div className={`h-11 w-11 overflow-hidden rounded-full border-2 sm:h-14 sm:w-14 ${hasLost ? "border-amber-400" : "border-[#d4a574]"
                                        } hover:shadow-md`}>
                                        <Image
                                            src={opponentProfileImage}
                                            alt={opponentDisplayName}
                                            width={56}
                                            height={56}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {/* Count Badge */}
                                    {isPoolMode && (challenge.total_opponents ?? 0) > 1 && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                                            <span className="text-[9px] font-bold text-white">+{(challenge.total_opponents ?? 0) - 1}</span>
                                        </div>
                                    )}
                                    {/* Label */}
                                    <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                        {isPoolMode ? "POOL" : "Opponent"}
                                    </div>

                                    {/* Info */}
                                    <div className="mt-2 w-full text-center">
                                        <p className="break-words font-bold text-[#2d1f1a] text-xs">{opponentDisplayName}</p>
                                        <p className="mt-0.5 break-all text-[10px] text-[#8b7355]">
                                            {hasLost ? "Won!" : hasWon ? "Lost" : ""}
                                        </p>
                                    </div>
                                </div>
                                {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                    <button
                                        type="button"
                                        onClick={(e) => openBetForm(e)}
                                        className={`absolute -bottom-4.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-[28px] font-black leading-none transition hover:scale-105 hover:shadow-md ${hasLost
                                            ? "border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-700 hover:from-amber-200 hover:to-yellow-100"
                                            : hasWon
                                                ? "border-red-300 bg-gradient-to-br from-red-100 to-rose-50 text-red-700 hover:from-red-200 hover:to-rose-100"
                                                : "border-[#d4a574]/40 bg-white/90 text-[#2d1f1a] hover:bg-white"
                                            }`}
                                        aria-label="counter"
                                        title="counter"
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Placeholder for pending state */
                            <div className="flex flex-col items-center">
                                <div className="challenge-card-profile-tile relative flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d4a574]/30 p-2 opponent-placeholder-bg sm:h-[140px] sm:w-[120px] sm:p-3">
                                    <div className="opponent-placeholder-icon flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#d4a574]/50 bg-gradient-to-br from-gray-200 to-gray-300 sm:h-14 sm:w-14">
                                        <span className="text-xl">❓</span>
                                    </div>
                                    <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                        {isPoolMode ? " OPPONENTS" : "OPPONENT"}
                                    </div>
                                    {isExpireTimeAchieved && !hasOpponents ? (
                                        <div className="mt-2 text-center">
                                            <p className="font-bold text-[#8b7355] text-xs">No one yet!</p>
                                        </div>
                                    ) :
                                        (<div className="mt-2 text-center">
                                            <p className="font-bold text-[#8b7355] text-xs">No one yet!</p>
                                        </div>)}
                                    {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                        <button
                                            type="button"
                                            onClick={(e) => openBetForm(e)}
                                            className={`absolute -bottom-4.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-[28px] font-black leading-none transition hover:scale-105 hover:shadow-md ${hasWon
                                                ? "border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-700 hover:from-amber-200 hover:to-yellow-100"
                                                : hasLost
                                                    ? "border-red-300 bg-gradient-to-br from-red-100 to-rose-50 text-red-700 hover:from-red-200 hover:to-rose-100"
                                                    : "border-[#d4a574]/40 bg-white/90 text-[#2d1f1a] hover:bg-white"
                                                }`}
                                            aria-label="counter"
                                            title="counter"
                                        >
                                            +
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* CTA Button */}
                <div className="flex gap-2">
                    <div className="group relative w-full">
                        <button
                            disabled={ctaState.disabled}
                            onClick={(e) => {
                                e.preventDefault();
                                if (ctaState.disabled) return;
                                openBetForm(e);
                            }}
                            className={ctaState.className}
                        >
                            {isLoading && isPoolMode ? "JOINING..." : ctaState.label}
                        </button>
                        {ctaState.showCreatorHint && (
                            <div className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-1 -translate-x-1/2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                You created this challenge
                            </div>
                        )}
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
                    maxAcceptBet={modalMaxAcceptBet}
                    escrowAddress={escrowAddress}
                    resolveCountdown={exactCountdownDetails.exactCountdown}
                    resolveLabel={exactCountdownDetails.dayLabel}
                    resolutionSource={challenge.resolution_source ?? undefined}
                    isPoolMode={isPoolMode}
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

                {/* Challenge Expiry */}
                {!isExpireTimeAchieved && (
                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-center text-xs text-gray-600">
                        {isExpiresInState ? (
                            <>
                                <span>{expiryStatusText}</span>
                                <span className={`font-medium ${isExpiryUnderOneHour ? "text-red-600" : "text-gray-900"}`}>
                                    {timeRemaining}
                                </span>
                            </>
                        ) : (
                            <span
                                className={`font-semibold ${isCompletedState
                                    ? "text-gray-700"
                                    : isResolvingState
                                        ? "text-amber-700"
                                        : isBattleOnState
                                            ? "text-[#008080]"
                                            : "text-red-600"
                                    }`}
                            >
                                {expiryStatusText}
                            </span>
                        )}
                        <div className="group relative">
                            <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                {expiryTooltipText}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>
                )}

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
                            <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            onClick={handleShareChallenge}
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
                            <span className="font-semibold text-gray-900">0</span>
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .opponent-placeholder-bg {
                    animation: opponent-bg-blink 1.5s ease-in-out infinite;
                }

                .opponent-placeholder-icon {
                    animation: opponent-icon-blink 1.5s ease-in-out infinite;
                }

                @keyframes opponent-bg-blink {
                    0%,
                    100% {
                        background-color: rgba(255, 255, 255, 0.4);
                    }
                    50% {
                        background-color: rgba(255, 255, 255, 0.2);
                    }
                }

                @keyframes opponent-icon-blink {
                    0%,
                    100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.65;
                    }
                }
            `}</style>
        </>
    );
}
