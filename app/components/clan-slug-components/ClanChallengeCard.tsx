import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ClanChallenge } from "./types";
import { ClockIcon, InfoIcon, ShareIcon } from "./icons";
import { Challenge, ChallengeListItem, getChallengeById } from "@/app/lib/challenges-service/challenges";

interface ClanChallengeCardProps {
    challenge: ClanChallenge;
    sourceChallenge?: ChallengeListItem;
    sourceChallengeId?: string;
    onChallengeOpen?: (challenge: ChallengeListItem) => void;
}

const ChallengeCard = ({ challenge, sourceChallenge, sourceChallengeId, onChallengeOpen }: ClanChallengeCardProps) => {
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        const interval = window.setInterval(() => setCurrentTime(Date.now()), 60000);
        return () => window.clearInterval(interval);
    }, []);

    const toListItem = (full: Challenge): ChallengeListItem => {
        const candidate = full as unknown as Partial<ChallengeListItem>;
        return {
            id: full.id,
            title: full.title,
            mode: full.mode,
            resolution_source: full.resolution_source,
            initial_bet: full.initial_bet,
            target_price: typeof candidate.target_price === "number" ? candidate.target_price : undefined,
            min_accept_bet: full.min_accept_bet,
            max_accept_bet: full.max_accept_bet,
            min_bet: full.min_bet,
            total_pool: full.total_pool,
            status: full.status,
            resolution_status: full.resolution_status,
            expire_time: full.expire_time,
            resolve_time: full.resolve_time,
            resolved_at: full.resolved_at,
            result: full.result,
            created_at: full.created_at,
            total_challengers: typeof candidate.total_challengers === "number" ? candidate.total_challengers : 0,
            total_opponents: typeof candidate.total_opponents === "number" ? candidate.total_opponents : 0,
            market: candidate.market ?? {
                name: full.category,
                image: "",
                icon: "",
                description: null,
                parent_id: null,
            },
            creator: candidate.creator ?? {
                username: "",
                profile_image: "",
                wallet_address: "",
            },
            opponent_info: candidate.opponent_info ?? null,
        };
    };

    const handleCardClick = async () => {
        if (!onChallengeOpen) return;

        if (sourceChallenge) {
            onChallengeOpen(sourceChallenge);
        }

        if (!sourceChallengeId) return;

        try {
            const detailedChallenge = await getChallengeById(sourceChallengeId);
            onChallengeOpen(toListItem(detailedChallenge));
        } catch (error) {
            console.error("Failed to fetch challenge details:", error);
        }
    };

    const computed = useMemo(() => {
        const liveChallenge = sourceChallenge;
        const liveChallengeWithMeta = liveChallenge as ChallengeListItem & {
            metadata?: {
                ui?: {
                    title?: string;
                };
            };
        };
        const uiTitle = liveChallengeWithMeta.metadata?.ui?.title;
        const assetSymbol = liveChallenge?.market?.name || challenge.asset || "BTC";
        const assetIcon = liveChallenge?.market?.icon || "/scribbles/btc.png";
        const title = uiTitle || liveChallenge?.title || challenge.title || `Bet on ${assetSymbol}`;
        const isPoolMode = liveChallenge?.mode === "pool";
        const expiryTimestamp = liveChallenge?.expire_time ? new Date(liveChallenge.expire_time).getTime() : null;
        const resolveTimestamp = liveChallenge?.resolve_time ? new Date(liveChallenge.resolve_time).getTime() : null;
        const resolveDateByText = resolveTimestamp
            ? new Date(resolveTimestamp).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
            })
            : "";
        const hasOpponents =
            Number(liveChallenge?.total_opponents ?? 0) > 0 ||
            Boolean(liveChallenge?.opponent_info?.username || liveChallenge?.opponent_info?.wallet_address);
        const isExpireTimeAchieved = Boolean(expiryTimestamp && expiryTimestamp <= currentTime);
        const isResolveTimeAchieved = Boolean(resolveTimestamp && resolveTimestamp <= currentTime);
        const isManualResolution = String(liveChallenge?.resolution_source ?? "").toLowerCase() === "manual";
        const resolutionStatusRaw = String(liveChallenge?.resolution_status ?? "").toLowerCase();
        const isResolutionPending = resolutionStatusRaw === "pending";
        const isResolutionResolved = resolutionStatusRaw === "resolved";

        const formatExpiryCountdown = (timestamp: number | null): string => {
            if (!timestamp) return "N/A";
            const diffMs = timestamp - currentTime;
            if (diffMs <= 0) return "Expired";
            const totalMinutes = Math.floor(diffMs / 60000);
            const days = Math.floor(totalMinutes / (24 * 60));
            const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
            const minutes = totalMinutes % 60;
            if (days > 0) return `${days}d ${hours}h ${minutes}m`;
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
        };

        const expiresIn = hasOpponents && isExpireTimeAchieved
            ? isResolveTimeAchieved
                ? isResolutionResolved
                    ? "Completed"
                    : "Resolving"
                : "Battle On"
            : formatExpiryCountdown(expiryTimestamp);
        const endsByCountdown = formatExpiryCountdown(resolveTimestamp);
        const displayTitle = isManualResolution
            ? title
            : isResolveTimeAchieved
                ? `${title} by ${resolveDateByText}`
                : `${title} In Next ${endsByCountdown}`;

        let ctaLabel = "";
        let ctaToneClass = "bg-gradient-to-r from-green-700 to-green-600";
        const activeCtaClassName = "bg-gradient-to-r from-green-700 to-green-600";
        const activePvpCtaClassName = "bg-gradient-to-r from-green-600 to-green-500";
        const ongoingCtaClassName = "bg-gradient-to-r from-green-700 to-green-600";
        const expiredCtaClassName = "bg-gradient-to-r from-red-600 to-red-500";
        const resolvingCtaClassName = "bg-gradient-to-r from-amber-600 to-amber-500";
        const completedCtaClassName = "bg-gradient-to-r from-gray-600 to-gray-500";

        if (!isPoolMode) {
            if (isResolveTimeAchieved && isResolutionResolved) {
                ctaLabel = "COMPLETED ✅";
                ctaToneClass = completedCtaClassName;
            } else if (isResolveTimeAchieved && isResolutionPending) {
                ctaLabel = "RESOLVING ⌛";
                ctaToneClass = resolvingCtaClassName;
            } else if (!isResolveTimeAchieved && hasOpponents) {
                ctaLabel = "ONGOING ⚔️";
                ctaToneClass = ongoingCtaClassName;
            } else if (isExpireTimeAchieved && !hasOpponents) {
                ctaLabel = "EXPIRED!";
                ctaToneClass = expiredCtaClassName;
            } else {
                ctaLabel = "COUNTER ⚔️";
                ctaToneClass = activePvpCtaClassName;
            }
        } else if (isResolveTimeAchieved && isResolutionResolved) {
            ctaLabel = "COMPLETED ✅";
            ctaToneClass = completedCtaClassName;
        } else if (isResolveTimeAchieved && isResolutionPending) {
            ctaLabel = "RESOLVING ⌛";
            ctaToneClass = resolvingCtaClassName;
        } else if (isExpireTimeAchieved && !hasOpponents) {
            ctaLabel = "EXPIRED";
            ctaToneClass = expiredCtaClassName;
        } else if (!isExpireTimeAchieved) {
            ctaLabel = "JOIN ⚔️";
            ctaToneClass = activeCtaClassName;
        } else {
            ctaLabel = "ONGOING ⚔️";
            ctaToneClass = ongoingCtaClassName;
        }

        return { assetIcon, displayTitle, ctaLabel, ctaToneClass, expiresIn };
    }, [sourceChallenge, challenge.asset, challenge.title, currentTime]);

    return (
        <div
            onClick={handleCardClick}
            className="cursor-pointer bg-white/50 rounded-xl border border-gray-300 p-3 sm:p-4 hover:bg-white/80 transition-all"
        >
            {/* Top row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white shadow-sm bg-white flex-shrink-0">
                        <Image
                            src={computed.assetIcon}
                            alt={challenge.asset}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2">{computed.displayTitle}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs text-gray-500">{challenge.creator}</span>
                        </div>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-500 font-medium">{challenge.mode}</span>
                    <InfoIcon className="w-3.5 h-3.5 text-gray-400" />
                </div>
            </div>

            {/* Participants + Action */}
            <div className="flex items-center justify-center gap-12 sm:gap-3">
                {/* Challenger */}
                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <span className="text-[8px] sm:text-[10px] font-bold bg-gray-800 text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                        {challenge.challenger.label}
                    </span>
                    <div className="relative">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                            <Image
                                src={challenge.challenger.avatar}
                                alt={challenge.challenger.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {challenge.challenger.pool && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
                                <span>💰</span>
                                <span>{challenge.challenger.pool}</span>
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-800 mt-0.5 sm:mt-1 truncate max-w-[60px] sm:max-w-none">{challenge.challenger.name}</span>
                    <span className="hidden sm:inline text-[10px] text-gray-400">{challenge.challenger.sublabel}</span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-[10px] sm:text-xs font-black">VS</span>
                    </div>
                </div>

                {/* opponent */}
                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <span className="text-[8px] sm:text-[10px] font-bold bg-gray-700 text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                        {challenge.opponent ? challenge.opponent.label : "OPPONENT"}
                    </span>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center">
                        {challenge.opponent ? (
                            <Image
                                src={challenge.opponent.avatar}
                                alt={challenge.opponent.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-gray-400 text-lg sm:text-xl font-bold">?</span>
                        )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-800 mt-0.5 sm:mt-1 truncate max-w-[60px] sm:max-w-none">
                        {challenge.opponent ? challenge.opponent.name : "No one yet!"}
                    </span>
                    <span className="hidden sm:inline text-[10px] text-gray-400">
                        {challenge.opponent ? challenge.opponent.sublabel : ""}
                    </span>
                </div>


                {/* Spacer */}
                <div className="flex-1 hidden sm:block" />

                {/* Action + Timer */}
                <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                        className={`px-5 py-2.5 rounded-lg font-bold text-sm text-white transition-all shadow-sm hover:opacity-90 active:scale-95 ${computed.ctaToneClass}`}
                    >
                        {computed.ctaLabel}
                    </button>
                    <span className="text-[10px] text-gray-400">Expires in</span>
                    <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-700">{computed.expiresIn}</span>
                    </div>
                </div>

            </div>
            {/* Mobile Timer */}
            <div className="flex sm:hidden flex-col items-center gap-0.5 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                    <span className="text-[10px] font-semibold text-gray-700">Expires In</span>
                </div>
                <div className="flex items-center gap-0.5">
                    <ClockIcon className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-700">{computed.expiresIn}</span>
                </div>
            </div>

            {/* challenge btn  */}
            <div className="flex items-center justify-center gap-1 flex-shrink-0 sm:hidden mt-6 mb-6">
                <button
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs text-white transition-all shadow-sm hover:opacity-90 active:scale-95 ${computed.ctaToneClass}`}
                >
                    {computed.ctaLabel}
                </button>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                    <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{challenge.createdAgo}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                    <ShareIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{challenge.shares}</span>
                </div>
                {challenge.views > 0 && (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                        <span>👁</span>
                        <span>{challenge.views}</span>
                    </div>
                )}
                <span className="ml-auto text-[10px] sm:text-xs text-gray-500 font-medium sm:hidden">{challenge.mode}</span>
            </div>
        </div>
    );
};

export default ChallengeCard;
