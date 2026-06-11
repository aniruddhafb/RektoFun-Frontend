"use client";

import React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  X,
  ChevronDown,
  ChevronUp,
  Share2,
  Trophy,
  Target,
  Users,
  Activity,
  Wallet,
  User,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import { AcceptChallengeModal } from "./AcceptChallengeModal";
import { ChallengeListItem } from "@/app/lib/challenges-service/challenges";
import { useChallengeDetail } from "@/app/hooks/useChallengeDetail";

interface ChallengeDetailModalProps {
  challenge: ChallengeListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChallengeDetailModal({ challenge, isOpen, onClose }: ChallengeDetailModalProps) {
  const {
    modalRef,
    isLoading,
    isBetFormOpen,
    betInput,
    betError,
    joinSide,
    modalMinAcceptBet,
    modalMaxAcceptBet,
    escrowAddress,
    usdcBalance,
    isDescriptionExpanded,
    isTitleExpanded,
    shareFeedback,
    setBetInput,
    setBetError,
    setJoinSide,
    setIsDescriptionExpanded,
    setIsTitleExpanded,
    assetLogo,
    creatorName,
    creatorAvatar,
    hasOpponentInfo,
    opponentDisplayName,
    opponentAvatar,
    isPoolMode,
    betAmount,
    creatorWalletShort,
    canExpandTitle,
    displayedTitle,
    targetPrice,
    currentPrice,
    priceChange,
    isDirectionalBelow,
    priceBarPosition,
    progressThemeClass,
    markerThemeClass,
    markerDotThemeClass,
    priceLabelThemeClass,
    isCreator,
    hasOpponents,
    hasWon,
    hasLost,
    isFinalOutcome,
    creatorOutcomeText,
    opponentOutcomeText,
    isManualResolution,
    isResolutionPending,
    isResolutionResolved,
    hasResolveTimePassed,
    showResolvesBox,
    hideExpiresBox,
    isExpireTimeAchieved,
    timelineColumns,
    expiresInText,
    createdTimeText,
    exactCountdownDetails,
    resolvesInText,
    resolvesInSubtext,
    expiresInTextForBox,
    statusLabel,
    statusClassName,
    displayedDescriptionText,
    canToggleDescription,
    modeLabel,
    totalPoolLabel,
    primaryTitle,
    resolutionLabel,
    descriptionToShow,
    ctaState,
    handleCtaClick,
    closeBetForm,
    handleJoinChallenge,
    handleShareChallenge,
    openProfile,
    onClose: handleClose,
  } = useChallengeDetail(challenge, isOpen, onClose);

  if (!isOpen || !challenge) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10010] flex items-center justify-center overflow-hidden bg-black/55 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4">
      <div
        ref={modalRef}
        className="rekto-modal-panel relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden bg-[#fff8f4] animate-in zoom-in-95 duration-300"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          @keyframes liveSweep {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(220%); }
          }
          .price-live-sheen {
            animation: liveSweep 2.2s linear infinite;
          }
        `}</style>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-black bg-white text-gray-600 shadow-[2px_2px_0_#111] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#f5d547] hover:text-gray-900 active:scale-95 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
          aria-label="Close challenge details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Main Content */}
        <div className="relative overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-6 rounded-lg border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111] sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-black bg-[#fffaf6] p-3 shadow-[2px_2px_0_#111] sm:h-24 sm:w-24">
                  <Image
                    src={assetLogo}
                    alt={challenge.market?.name || "Market"}
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1 lg:hidden">
                  <div className="mb-2 flex flex-wrap items-center gap-2 pr-10">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] ${statusClassName}`}>
                      {statusLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-black/15 bg-[#f7efe9] px-2.5 py-1 text-xs font-bold text-[#5c4a42]">
                      {challenge.market?.name || "Market"}
                    </span>
                  </div>
                  <h2 className="break-words text-2xl font-black leading-tight text-[#201a16]">
                    {primaryTitle}
                  </h2>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 hidden flex-wrap items-center gap-2 pr-12 lg:flex">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] ${statusClassName}`}>
                    {statusLabel}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-black/15 bg-[#f7efe9] px-2.5 py-1 text-xs font-bold text-[#5c4a42]">
                    {challenge.market?.name || "Market"}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-black/15 bg-white px-2.5 py-1 text-xs font-bold text-[#5c4a42]">
                    {modeLabel}
                  </span>
                </div>
                <h2 className="hidden break-words text-3xl font-black leading-tight text-[#201a16] lg:block">
                  {primaryTitle}
                </h2>
                {canExpandTitle && (
                  <button
                    type="button"
                    onClick={() => setIsTitleExpanded((prev) => !prev)}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-[#246044] transition hover:text-[#1d6b48]"
                  >
                    {isTitleExpanded ? "Show shorter title" : "Show full title"}
                    {isTitleExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f5750] sm:text-base">
                  {descriptionToShow}
                </p>
                {canToggleDescription && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-[#246044] transition hover:text-[#1d6b48]"
                  >
                    {isDescriptionExpanded ? "Show less" : "Show more"}
                    {isDescriptionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#8b7355]">
                      <Trophy className="h-4 w-4 text-[#246044]" />
                      Total Pool
                    </div>
                    <p className="mt-1 text-xl font-black text-[#201a16]">{totalPoolLabel}</p>
                  </div>
                  <div className="rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#8b7355]">
                      <Target className="h-4 w-4 text-[#246044]" />
                      Target
                    </div>
                    <p className="mt-1 text-xl font-black text-[#201a16]">${targetPrice.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#8b7355]">
                      <Activity className="h-4 w-4 text-[#246044]" />
                      Resolution
                    </div>
                    <p className="mt-1 text-sm font-black text-[#201a16]">{resolutionLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openProfile(challenge.creator?.wallet_address)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3 text-left transition hover:border-black/30 hover:bg-white"
                  >
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#c8c1ba]">
                      <Image
                        src={creatorAvatar}
                        alt={creatorName}
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase text-[#8b7355]">Creator</span>
                      <span className="block truncate text-sm font-black text-[#201a16]">{creatorName}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#8b7355]">
                        <Wallet className="h-3 w-3" />
                        {creatorWalletShort}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Market Snapshot */}
          {!isManualResolution && (
            <div className="relative mb-6 overflow-visible rounded-lg border-2 border-black bg-[#1f4f3a] p-4 text-white shadow-[4px_4px_0_#111] sm:p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-white/70">Market Snapshot</p>
                  <h3 className="mt-1 text-2xl font-black text-white sm:text-3xl">{challenge.market?.name || "Market"}</h3>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-left sm:text-right">
                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <p className="text-sm font-medium text-white/80">Total Pool</p>
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
                  <p className="mt-1 text-3xl font-black">{totalPoolLabel}</p>
                </div>
              </div>

              {/* Price Section */}
              <div className={`mb-3 flex items-center ${isDirectionalBelow ? "justify-start" : "justify-end"}`}>
                <div className="flex items-center gap-1.5">
                  <div>
                    <p className={`text-white/70 text-xs ${isDirectionalBelow ? "text-left" : "text-right"}`}>Target</p>
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
                <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r ${progressThemeClass} ${isDirectionalBelow ? "right-0" : "left-0"}`}
                    style={{ width: `${priceBarPosition}%` }}
                  />
                  <div className="price-live-sheen absolute top-0 h-full w-14 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                </div>
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 flex items-center justify-center ${markerThemeClass}`}
                  style={isDirectionalBelow
                    ? { right: `calc(${priceBarPosition}% - 10px)` }
                    : { left: `calc(${priceBarPosition}% - 10px)` }
                  }
                >
                  <div className={`w-2 h-2 rounded-full animate-pulse ${markerDotThemeClass}`} />
                </div>
              </div>

              {/* Current Price Label */}
              <div className="mt-3 text-center">
                <p className={`text-lg font-bold ${priceLabelThemeClass}`}>
                  ${currentPrice.toLocaleString()}
                  <span className="ml-2 text-xs text-white/60">
                    ({priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%)
                  </span>
                </p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70">Live market sync</p>
              </div>
            </div>
          )}

          {/* Participants */}
          <div className="mb-6 rounded-lg border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111]">
            {isManualResolution && (
              <div className="mb-4 rounded-lg border-2 border-black bg-[#fffaf6] p-3 text-center shadow-[2px_2px_0_#111]">
                <p className="text-xs font-black uppercase tracking-wide text-[#8b7355]">Total Pool</p>
                <p className="text-2xl font-black text-[#2d1f1a]">${betAmount}</p>
              </div>
            )}
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#8b7355]">Participants</h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-black/20 bg-[#fffaf6] px-2.5 py-1 text-xs font-bold text-[#5c4a42]">
                <Users className="h-3.5 w-3.5" />
                {hasOpponents ? "Matched" : "Waiting"}
              </span>
            </div>

            <div className="flex w-full flex-row items-center justify-center gap-2.5 max-[350px]:gap-1.5 sm:gap-4">
              {/* Challenger Profile */}
              <div
                onClick={() => openProfile(challenge.creator?.wallet_address)}
                className="relative group flex cursor-pointer flex-col items-center"
              >
                <div className={`flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center rounded-xl p-2 text-center transition-all duration-300 group-hover:-translate-y-0.5 sm:h-[140px] sm:w-[120px] sm:p-3 ${hasWon
                  ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400 shadow-lg shadow-amber-200"
                  : hasLost
                    ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                    : "bg-white/80 border-2 border-[#d4a574]/30"
                  }`}>
                  {isFinalOutcome && hasWon && (
                    <div className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-amber-700 shadow-md">
                      <Trophy className="h-4 w-4" />
                    </div>
                  )}
                  <div className="relative flex flex-col items-center">
                    <div className={`h-11 w-11 overflow-hidden rounded-full border-2 sm:h-14 sm:w-14 ${hasWon ? "border-amber-400" : "border-[#d4a574]"} shadow-md`}>
                      <Image
                        src={creatorAvatar}
                        alt={creatorName}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                      {isPoolMode ? "CHALLENGERS" : "CHALLENGER"}
                    </div>
                  </div>
                  <div className="mt-2 w-full text-center">
                    <p className="break-words font-bold text-[#2d1f1a] text-xs">{creatorName}</p>
                    <p className="mt-0.5 break-all text-[10px] text-[#8b7355]">
                      {hasOpponents ? creatorOutcomeText : "Created challenge"}
                    </p>
                  </div>
                </div>
                {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleCtaClick(); }}
                    className={`absolute -bottom-3.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-[28px] font-black leading-none shadow-md transition hover:scale-105 ${hasWon
                      ? "border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-700 hover:from-amber-200 hover:to-yellow-100"
                      : hasLost
                        ? "border-red-300 bg-gradient-to-br from-red-100 to-rose-50 text-red-700 hover:from-red-200 hover:to-rose-100"
                        : "border-[#d4a574]/40 bg-white/90 text-[#2d1f1a] hover:bg-white"
                      }`}
                    aria-label="COUNTER"
                    title="COUNTER"
                  >
                    +
                  </button>
                )}
              </div>

              {/* VS Badge or Pending Badge */}
              <div className="flex flex-col items-center justify-center px-1 max-[350px]:px-0.5 sm:px-2 shrink-0">
                {hasOpponentInfo ? (
                  <>
                    <div className="w-9 h-9 max-[350px]:w-8 max-[350px]:h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] flex items-center justify-center shadow-lg">
                      {ctaState.isOngoing ? (
                        <video
                          src="/animations/Sword%20Battle.webm"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-7 h-7 max-[350px]:w-6 max-[350px]:h-6 sm:w-10 sm:h-10 object-contain"
                        />
                      ) : (
                        <span className="text-sm max-[350px]:text-xs sm:text-lg font-black text-[#f3e1d7]">VS</span>
                      )}
                    </div>
                    {isFinalOutcome && (hasWon || hasLost) ? (
                      <div className="mt-1 text-center">
                        <p className={`text-sm sm:text-lg font-black ${hasWon ? "text-amber-500" : "text-red-500"}`}>
                          {hasWon ? "+" : "-"}${betAmount}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 max-[350px]:w-8 max-[350px]:h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg animate-pulse">
                      <User className="w-5 h-5 max-[350px]:w-4 max-[350px]:h-4 sm:w-6 sm:h-6 text-white/50" />
                    </div>
                    <div className="mt-1.5 sm:mt-2 px-2 max-[350px]:px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-[#8b7355]/20 rounded-full">
                      <p className="text-[10px] max-[350px]:text-[9px] sm:text-xs font-semibold text-[#8b7355]">
                        {isExpireTimeAchieved && !hasOpponents ? "Expired" : "Seeking Opponent"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Opponent Profile */}
              {hasOpponentInfo ? (
                <div
                  onClick={() => openProfile(challenge.opponent_info?.wallet_address)}
                  className="relative group flex cursor-pointer flex-col items-center"
                >
                  <div className={`flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center rounded-xl p-2 text-center transition-all duration-300 group-hover:-translate-y-0.5 sm:h-[140px] sm:w-[120px] sm:p-3 ${hasLost
                    ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400 shadow-lg shadow-amber-200"
                    : hasWon
                      ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                      : "bg-white/80 border-2 border-[#d4a574]/30"
                    }`}>
                    {isFinalOutcome && hasLost && (
                      <div className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-amber-700 shadow-md">
                        <Trophy className="h-4 w-4" />
                      </div>
                    )}
                    <div className="relative flex flex-col items-center">
                      <div className={`h-11 w-11 overflow-hidden rounded-full border-2 sm:h-14 sm:w-14 ${hasLost ? "border-amber-400" : "border-[#d4a574]"} shadow-md`}>
                        <Image
                          src={opponentAvatar}
                          alt={opponentDisplayName}
                          width={56}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isPoolMode && (challenge.total_opponents ?? 0) > 1 && (
                        <div className="absolute -right-1 top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500">
                          <span className="text-[9px] font-bold text-white">+{(challenge.total_opponents ?? 0) - 1}</span>
                        </div>
                      )}
                      <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                        {isPoolMode ? "POOL" : "OPPONENT"}
                      </div>
                    </div>
                    <div className="mt-2 w-full text-center">
                      <p className="break-words font-bold text-[#2d1f1a] text-xs">{opponentDisplayName}</p>
                      <p className="mt-0.5 break-all text-[10px] text-[#8b7355]">
                        {hasOpponents ? opponentOutcomeText : "Opposing challenge"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <div className="relative flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d4a574]/30 bg-white/40 p-2 text-center sm:h-[140px] sm:w-[120px] sm:p-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#d4a574]/50 bg-gradient-to-br from-gray-200 to-gray-300 sm:h-14 sm:w-14">
                      <User className="h-5 w-5 text-[#8b7355]" />
                    </div>
                    <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                      OPPONENT
                    </div>
                    <div className="mt-2 text-center">
                      <p className="font-bold text-[#8b7355] text-xs">No one yet</p>
                      <p className="mt-0.5 text-[10px] text-[#a08070]">Be the first to accept</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="mb-6 rounded-lg border-2 border-black bg-white p-4 shadow-[4px_4px_0_#111]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[#8b7355]">
                Timeline
              </h3>
              <span className="rounded-full border border-black/20 bg-[#fffaf6] px-2.5 py-1 text-xs font-semibold text-[#8b7355]">Updated every minute</span>
            </div>

            <div className={`grid grid-cols-2 ${timelineColumns === 4 ? "sm:grid-cols-4" : timelineColumns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2.5 sm:gap-4 overflow-visible`}>
              <div className="relative overflow-visible rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-[2px_2px_0_#111] sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 sm:h-8 sm:w-8">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Mode</span>
                </div>
                <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">{modeLabel}</p>
              </div>

              <div className="relative overflow-visible rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-[2px_2px_0_#111] sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 sm:h-8 sm:w-8">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Created</span>
                </div>
                <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">{createdTimeText}</p>
              </div>

              {!hideExpiresBox && (
                <div className="relative z-20 overflow-visible rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3 transition-all duration-200 hover:z-50 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-[2px_2px_0_#111] sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 sm:h-8 sm:w-8">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Expires In</span>
                  </div>
                  <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">{expiresInTextForBox}</p>
                </div>
              )}

              {showResolvesBox && (
                <div>
                  {!isManualResolution ? (
                    <div className="relative z-10 overflow-visible rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-[2px_2px_0_#111] sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 sm:h-8 sm:w-8">
                          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Resolves In</span>
                      </div>
                      <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">{resolvesInText}</p>
                      {resolvesInSubtext && (
                        <p className="text-[10px] sm:text-xs text-[#8b7355] mt-1 leading-tight">{resolvesInSubtext}</p>
                      )}
                    </div>
                  ) : (
                    <div className="relative z-10 overflow-visible rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-[2px_2px_0_#111] sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 sm:h-8 sm:w-8">
                          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Resolves On</span>
                      </div>
                      <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">Match Day</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col gap-3 border-t-2 border-black bg-[#fff8f4] pt-4 sm:flex-row">
            <div className="group relative flex-1">
              <button
                type="button"
                disabled={ctaState.disabled}
                onClick={handleCtaClick}
                className={ctaState.className}
              >
                {ctaState.label}
              </button>
              {ctaState.showCreatorHint && (
                <div className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-1 -translate-x-1/2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  You created this challenge
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleShareChallenge}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-4 py-3.5 text-base font-black text-[#2d1f1a] shadow-[3px_3px_0_#111] transition-all duration-200 hover:-translate-y-1 hover:bg-[#f5d547] hover:shadow-[3px_3px_0_#111] sm:px-6"
            >
              <Share2 className="h-5 w-5" />
              {shareFeedback ?? "Share"}
            </button>
          </div>
        </div>
      </div>

      <AcceptChallengeModal
        isOpen={isBetFormOpen}
        isLoading={isLoading}
        usdcBalance={usdcBalance}
        betInput={betInput}
        betError={betError}
        betCurrency="USDC"
        minAcceptBet={modalMinAcceptBet}
        maxAcceptBet={modalMaxAcceptBet}
        escrowAddress={escrowAddress}
        resolveCountdown={exactCountdownDetails.exactCountdown}
        resolveLabel={exactCountdownDetails.dayLabel}
        resolutionSource={challenge.resolution_source ?? undefined}
        isPoolMode={isPoolMode}
        joinSide={joinSide}
        onClose={closeBetForm}
        onSubmit={handleJoinChallenge}
        onBetInputChange={(value) => {
          setBetInput(value);
          if (betError) setBetError("");
        }}
        onJoinSideChange={setJoinSide}
      />
    </div>,
    document.body
  );
}