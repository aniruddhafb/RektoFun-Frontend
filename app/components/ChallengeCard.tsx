"use client";

import Image from "next/image";
import { Challenge } from "./challengesData";

interface ChallengeCardProps {
  challenge: Challenge;
  onClick?: (challenge: Challenge) => void;
  onRekt?: (challenge: Challenge) => void;
  variant?: "default" | "market";
}

export function ChallengeCard({
  challenge,
  onClick,
  onRekt,
  variant = "default"
}: ChallengeCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(challenge);
    } else if (onRekt) {
      onRekt(challenge);
    }
  };

  // Calculate price position for the progress bar (0-100%)
  const priceRange = Math.abs(challenge.targetPrice - challenge.startPrice);

  // Calculate progress: 50% is target, <50% is below, >50% is above
  let priceProgress = 50;
  if (priceRange > 0) {
    const targetDiff = challenge.targetPrice - challenge.startPrice;
    const normalizedProgress = (challenge.currentPrice - challenge.startPrice) / targetDiff;
    priceProgress = 50 + (normalizedProgress * 50);
  }
  const clampedProgress = Math.min(Math.max(priceProgress, 0), 100);

  const isAccepted = challenge.status === "accepted" || challenge.status === "active" || challenge.status === "won" || challenge.status === "lost";
  const hasWon = challenge.status === "won";
  const hasLost = challenge.status === "lost";

  return (
    <div
      onClick={handleClick}
      className="bg-[#f8ede7] rounded-2xl p-4 shadow-sm border border-white/50 hover:shadow-lg transition-shadow block cursor-pointer"
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
        {/* Watchlist Icon - only show in market variant */}
        {variant === "market" && (
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}
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

      {/* Price Progress Bar - only show in market variant */}
      {variant === "market" && (
        <div className="mb-5">
          {/* Price labels */}
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>${challenge.startPrice.toLocaleString()}</span>
            <span className="font-semibold text-gray-700">${challenge.targetPrice.toLocaleString()}</span>
            <span>${challenge.startPrice.toLocaleString()}</span>
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

            {/* Current price indicator */}
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
      )}

      {/* VS Section - Challenger vs Opponent UI - for default/profile variant */}
      {variant !== "market" && (
        <div className="mb-5">
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
            {/* Challenger Profile */}
            <div className="relative group flex flex-col items-center">
              <div className={`relative p-3 rounded-xl transition-all duration-300 ${hasWon
                ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400"
                : hasLost
                  ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                  : "bg-white/80 border-2 border-[#d4a574]/30"
                }`}>
                {/* Winner Crown */}
                {hasWon && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                    👑
                  </div>
                )}

                {/* Avatar */}
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${hasWon ? "border-amber-400" : "border-[#d4a574]"
                    } shadow-md`}>
                    <Image
                      src={challenge.creator.avatar}
                      alt={challenge.creator.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Label */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                    CHALLENGER
                  </div>
                </div>

                {/* Info */}
                <div className="mt-4 text-center">
                  <p className="font-bold text-[#2d1f1a] text-xs">{challenge.creator.name}</p>
                  <p className="text-[10px] text-[#8b7355] mt-0.5">
                    {hasWon ? "Won!" : hasLost ? "Lost" : "Created"}
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
                        {hasWon ? "+" : "-"}${challenge.betAmount}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-md animate-pulse">
                    <span className="text-lg text-white/50">?</span>
                  </div>
                  <div className="mt-2 px-2 py-0.5 bg-[#8b7355]/20 rounded-full">
                    <p className="text-[10px] font-semibold text-[#8b7355]">Open</p>
                  </div>
                </>
              )}
            </div>

            {/* Accepter Profile - Only show if accepted */}
            {isAccepted && challenge.accepter ? (
              <div className="relative group flex flex-col items-center">
                <div className={`relative p-3 rounded-xl transition-all duration-300 ${hasLost
                  ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400"
                  : hasWon
                    ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                    : "bg-white/80 border-2 border-[#d4a574]/30"
                  }`}>
                  {/* Winner Crown */}
                  {hasLost && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                      👑
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${hasLost ? "border-amber-400" : "border-[#d4a574]"
                      } shadow-md`}>
                      <Image
                        src={challenge.accepter.avatar}
                        alt={challenge.accepter.name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Label */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                      ACCEPTER
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-4 text-center">
                    <p className="font-bold text-[#2d1f1a] text-xs">{challenge.accepter.name}</p>
                    <p className="text-[10px] text-[#8b7355] mt-0.5">
                      {hasLost ? "Won!" : hasWon ? "Lost" : "Accepted"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Placeholder for pending state */
              <div className="relative flex flex-col items-center">
                <div className="p-3 rounded-xl bg-white/40 border-2 border-dashed border-[#d4a574]/30">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-[#d4a574]/50">
                    <span className="text-xl">❓</span>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-semibold text-[#8b7355] text-xs">No one yet</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onRekt) onRekt(challenge);
        }}
        className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${variant === "market"
          ? "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 text-gray-900 border-2 border-amber-400/50"
          : "bg-[#246044] hover:bg-[#2b7351]"
          }`}
      >
        {variant === "market" ? "REKT HIM" : "ACCEPT"}
        <span className="text-xl">{variant === "market" ? "😈" : "⚔️"}</span>
      </button>

      {/* Challenge Expiry */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mt-1.5">
        <span>Challenge expires in</span>
        <span className="font-medium text-gray-900">{challenge.timeRemaining}</span>
        <div className="group relative">
          <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            This challenge will expire in {challenge.timeRemaining}, you won't be able to join after that.
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-2"></div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">Created <span className="font-semibold text-gray-900">2h ago</span></span>
          <div className="group relative">
            <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              This challenge was created 2 hours ago and will end on September 30, 2024 at 3:00 PM UTC if accepted.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          {/* Eye Icon */}
          <div className="flex items-center gap-1">
            <span className="font-semibold text-gray-900">{challenge.likes}</span>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
