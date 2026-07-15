"use client";

import React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  Crosshair,
  ExternalLink,
  Loader2,
  Share2,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";
import { Challenge, incrementChallengeViews } from "@/app/lib/challenges-service/challenges";
import { getUserById, User as UserType } from "@/app/lib/users-service/users";
import { getPositionsByChallenge, Position } from "@/app/lib/positions-service/positions";
import { useChallengeDetail } from "@/app/hooks/useChallengeDetail";
import { useChallengeCard } from "@/app/hooks/useChallengeCard";
import { getSolscanClusterQuery } from "@/app/lib/solana-config";
import { AcceptChallengeModal } from "./AcceptChallengeModal";
import { ChallengeActionModal } from "./ChallengeActionModal";
import { ProfileHoverPreview } from "./ProfileHoverPreview";
import { ShareChallengeModal } from "./ShareChallengeModal";
import { WinningsShareModal } from "./WinningsShareModal";

interface ChallengeDetailModalProps {
  challenge: Challenge | null;
  creator?: UserType | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ChallengeAcceptActionProps {
  challenge: Challenge;
  ctaState: {
    label: string;
    disabled: boolean;
    className: string;
    showCreatorHint: boolean;
  };
  canOpen: () => boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type ParticipantRecord = { position: Position; user: UserType | null };
type ParticipantView = {
  key: string;
  id: number;
  name: string;
  avatar: string;
  wallet: string;
  side: "TEAM_A" | "TEAM_B";
  bet: number;
  isCreator: boolean;
  isVerified: boolean;
  isModerator: boolean;
};

type BetActivityView = {
  key: string;
  name: string;
  avatar: string;
  wallet: string;
  side: "TEAM_A" | "TEAM_B";
  bet: number;
  createdAt: string;
  isCreator: boolean;
};

type MarketCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type ChartRange = "24H" | "7D" | "30D" | "3M";

const FALLBACK_AVATAR = "/scribbles/btc.png";

function cleanCtaLabel(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("join")) return "Join challenge";
  if (normalized.includes("ongoing") || normalized.includes("battle")) return "Battle live";
  if (normalized.includes("resolving")) return "Resolving";
  if (normalized.includes("complete")) return "Completed";
  if (normalized.includes("expired")) return "Expired";
  return label.replace(/[⚔️✅⌛!]/gu, "").trim();
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatBetPlacedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return date.toLocaleString("en-IN", sameDay
    ? { hour: "numeric", minute: "2-digit" }
    : { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function ChallengeAcceptAction({ challenge, ctaState, canOpen, onOpenChange }: ChallengeAcceptActionProps) {
  const {
    isLoading,
    isBetFormOpen,
    betInput,
    betError,
    joinSide,
    usdcBalance,
    escrowAddress,
    modalMinAcceptBet,
    requiresCreatorStakeMatch,
    modalMaxAcceptBet,
    betCurrency,
    exactCountdownDetails,
    timeRemaining,
    challengeEndTimeText,
    teamATotalAmount,
    teamBTotalAmount,
    isTeam,
    isExpireTimeAchieved,
    hasJoinedChallenge,
    setBetInput,
    setBetError,
    setJoinSide,
    openBetForm,
    closeBetForm,
    handleJoinChallenge,
    challengeAction,
    actionError,
    handleChallengeAction,
    pendingChallengeAction,
    confirmChallengeAction,
    closeChallengeActionConfirmation,
    ctaState: actionCtaState,
    claimedWinnings,
    closeWinningsShare,
  } = useChallengeCard(challenge);

  React.useEffect(() => {
    onOpenChange(isBetFormOpen);
    return () => onOpenChange(false);
  }, [isBetFormOpen, onOpenChange]);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleJoinChallenge();
  };
  const displayedCtaState = challengeAction || hasJoinedChallenge ? actionCtaState : ctaState;

  return (
    <>
      <div className="group relative flex-[2]">
        <button
          type="button"
          disabled={displayedCtaState.disabled || isLoading}
          onClick={(event) => {
            if (challengeAction) {
              void handleChallengeAction(event);
            } else {
              if (!canOpen()) return;
              openBetForm(event);
            }
          }}
          className={`${displayedCtaState.className} detail-primary-action`}
        >
          <span>{isLoading ? "Processing..." : cleanCtaLabel(displayedCtaState.label)}</span>
          {!displayedCtaState.disabled && !isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={3} />}
        </button>
        {displayedCtaState.showCreatorHint && (
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 border border-black bg-white px-2 py-1 text-[10px] font-bold text-black opacity-0 shadow-[2px_2px_0_#111] transition-opacity group-hover:opacity-100">
            Your challenge
          </div>
        )}
        {actionError ? <p className="mt-1 text-center text-xs font-bold text-red-700">{actionError}</p> : null}
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
        onSubmit={handleSubmit}
        onBetInputChange={(value) => {
          setBetInput(value);
          if (betError) setBetError("");
        }}
        onJoinSideChange={setJoinSide}
      />
      <ChallengeActionModal
        action={pendingChallengeAction}
        isExpired={isExpireTimeAchieved}
        isLoading={isLoading}
        error={actionError}
        onClose={closeChallengeActionConfirmation}
        onConfirm={() => void confirmChallengeAction()}
      />
      <WinningsShareModal
        challenge={challenge}
        amount={claimedWinnings ?? 0}
        isOpen={claimedWinnings !== null}
        onClose={closeWinningsShare}
      />
    </>
  );
}

export default function ChallengeDetailModal({ challenge, creator, isOpen, onClose }: ChallengeDetailModalProps) {
  const [isAcceptModalOpen, setIsAcceptModalOpen] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [participantState, setParticipantState] = React.useState<{
    key: string;
    rows: ParticipantRecord[];
    failed: boolean;
  }>({ key: "", rows: [], failed: false });
  const lastCountedChallengeIdRef = React.useRef<number | null>(null);
  const challengeId = challenge?.id;
  const resolvedCreator = creator ?? challenge?.creator_details ?? null;

  const {
    modalRef,
    assetLogo,
    creatorName,
    creatorAvatar,
    creatorWalletAddress,
    isTeam,
    targetPrice,
    isDirectionalBelow,
    isManualResolution,
    isExpireTimeAchieved,
    isResolveTimeAchieved,
    isResolutionPending,
    isResolutionResolved,
    endsInText,
    resolvesInText,
    expiresInTextForBox,
    statusLabel,
    statusClassName,
    modeLabel,
    primaryTitle,
    resolutionLabel,
    ctaState,
    handleCtaClick,
    openProfile,
    onClose: handleClose,
  } = useChallengeDetail(challenge, resolvedCreator, isOpen && !isAcceptModalOpen && !isShareModalOpen, onClose);

  React.useEffect(() => {
    if (!isOpen || challengeId === undefined) {
      lastCountedChallengeIdRef.current = null;
      return;
    }
    if (lastCountedChallengeIdRef.current === challengeId) return;
    lastCountedChallengeIdRef.current = challengeId;

    incrementChallengeViews(challengeId)
      .then((views) => {
        window.dispatchEvent(new CustomEvent("rektofun:challenge-viewed", {
          detail: { challengeId, views },
        }));
      })
      .catch((error) => console.error("Failed to record challenge view:", error));
  }, [isOpen, challengeId]);

  React.useEffect(() => {
    if (!isOpen || challengeId === undefined) return;
    let cancelled = false;
    const key = String(challengeId);

    getPositionsByChallenge(challengeId)
      .then(async (positions) => {
        const userIds = [...new Set(positions.map((position) => position.creator).filter(Boolean))];
        const settledUsers = await Promise.allSettled(userIds.map((id) => getUserById(id)));
        const usersById = new Map<number, UserType>();
        settledUsers.forEach((result) => {
          if (result.status === "fulfilled") usersById.set(result.value.id, result.value);
        });
        return positions.map((position) => ({ position, user: usersById.get(position.creator) ?? null }));
      })
      .then((rows) => {
        if (!cancelled) setParticipantState({ key, rows, failed: false });
      })
      .catch((error) => {
        console.error("Failed to load challenge participants:", error);
        if (!cancelled) setParticipantState({ key, rows: [], failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [challengeId, isOpen]);

  const participants = React.useMemo<ParticipantView[]>(() => {
    if (!challenge) return [];
    const creatorId = Number(challenge.creator_id ?? challenge.creator ?? 0);
    const currentRows = participantState.key === String(challenge.id) ? participantState.rows : [];
    const grouped = new Map<string, ParticipantView>();

    currentRows.forEach(({ position, user }) => {
      const resolvedUser = user ?? (position.creator === creatorId ? resolvedCreator : null);
      const side = position.side === "TEAM_B" ? "TEAM_B" : "TEAM_A";
      const key = `${side}:${position.creator}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.bet += Number(position.bet || 0);
        return;
      }
      grouped.set(key, {
        key,
        id: position.creator,
        name: resolvedUser?.username || (position.creator === creatorId ? creatorName : `Player ${position.creator}`),
        avatar: resolvedUser?.profile_image || (position.creator === creatorId ? creatorAvatar : FALLBACK_AVATAR),
        wallet: resolvedUser?.pubkey || resolvedUser?.wallet_address || (position.creator === creatorId ? creatorWalletAddress : ""),
        side,
        bet: Number(position.bet || 0),
        isCreator: position.creator === creatorId,
        isVerified: Boolean(resolvedUser?.twitter_username || resolvedUser?.user_type === "moderator"),
        isModerator: resolvedUser?.user_type === "moderator",
      });
    });

    if (![...grouped.values()].some((participant) => participant.isCreator)) {
      grouped.set(`TEAM_A:${creatorId}`, {
        key: `TEAM_A:${creatorId}`,
        id: creatorId,
        name: creatorName,
        avatar: creatorAvatar || FALLBACK_AVATAR,
        wallet: creatorWalletAddress,
        side: "TEAM_A",
        bet: Number(challenge.initial_bet || 0),
        isCreator: true,
        isVerified: Boolean(resolvedCreator?.twitter_username || resolvedCreator?.user_type === "moderator"),
        isModerator: resolvedCreator?.user_type === "moderator",
      });
    }

    const highestOpponent = challenge.bet_info?.highest_bet?.TEAM_B;
    if (highestOpponent && ![...grouped.values()].some((participant) => participant.side === "TEAM_B")) {
      grouped.set(`TEAM_B:${highestOpponent.id}`, {
        key: `TEAM_B:${highestOpponent.id}`,
        id: highestOpponent.id,
        name: highestOpponent.username || "Opponent",
        avatar: highestOpponent.profile_image || FALLBACK_AVATAR,
        wallet: highestOpponent.pubkey || "",
        side: "TEAM_B",
        bet: Number(highestOpponent.bet || 0),
        isCreator: false,
        isVerified: false,
        isModerator: false,
      });
    }

    return [...grouped.values()].sort((a, b) => Number(b.isCreator) - Number(a.isCreator) || b.bet - a.bet);
  }, [challenge, creatorAvatar, creatorName, creatorWalletAddress, participantState, resolvedCreator]);

  const betActivity = React.useMemo<BetActivityView[]>(() => {
    if (!challenge) return [];
    const creatorId = Number(challenge.creator_id ?? challenge.creator ?? 0);
    const currentRows = participantState.key === String(challenge.id) ? participantState.rows : [];
    const rows = currentRows.map(({ position, user }) => {
      const isCreator = position.creator === creatorId;
      const resolvedUser = user ?? (isCreator ? resolvedCreator : null);
      return {
        key: String(position.id),
        name: resolvedUser?.username || (isCreator ? creatorName : `Player ${position.creator}`),
        avatar: resolvedUser?.profile_image || (isCreator ? creatorAvatar : FALLBACK_AVATAR),
        wallet: resolvedUser?.pubkey || resolvedUser?.wallet_address || (isCreator ? creatorWalletAddress : ""),
        side: position.side === "TEAM_B" ? "TEAM_B" as const : "TEAM_A" as const,
        bet: Number(position.bet || 0),
        createdAt: position.created_at,
        isCreator,
      };
    });

    if (!rows.some((row) => row.isCreator) && Number(challenge.initial_bet || 0) > 0) {
      rows.push({
        key: `initial:${challenge.id}`,
        name: creatorName,
        avatar: creatorAvatar || FALLBACK_AVATAR,
        wallet: creatorWalletAddress,
        side: "TEAM_A",
        bet: Number(challenge.initial_bet || 0),
        createdAt: challenge.created_at,
        isCreator: true,
      });
    }

    return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [challenge, creatorAvatar, creatorName, creatorWalletAddress, participantState, resolvedCreator]);

  if (!isOpen || !challenge) return null;

  const teamA = participants.filter((participant) => participant.side === "TEAM_A");
  const teamB = participants.filter((participant) => participant.side === "TEAM_B");
  const teamAStake = teamA.reduce((sum, participant) => sum + participant.bet, 0);
  const teamBStake = teamB.reduce((sum, participant) => sum + participant.bet, 0);
  const recordedPool = teamAStake + teamBStake;
  const totalPool = recordedPool || challenge.total_pool || challenge.pool_size || challenge.initial_bet || 0;
  const escrowAddress = typeof challenge.metadata?.onchain?.challenge_pda === "string"
    ? challenge.metadata.onchain.challenge_pda
    : "";
  const escrowDisplay = escrowAddress ? `${escrowAddress.slice(0, 5)}…${escrowAddress.slice(-5)}` : "";
  const escrowHref = escrowAddress
    ? `https://solscan.io/account/${encodeURIComponent(escrowAddress)}${getSolscanClusterQuery()}`
    : "";
  const participantLoading = participantState.key !== String(challenge.id) && !participantState.failed;
  const composerMarket = challenge.metadata?.composer?.market;
  const isSports = challenge.category?.toLowerCase() === "sports" || composerMarket === "sports" || challenge.ticker === "SPORTS";
  const isCrypto = !isSports && Boolean(challenge.ticker);
  const cleanCtaState = { ...ctaState, label: cleanCtaLabel(ctaState.label) };

  return createPortal(
    <div className="fixed inset-0 z-[10010] flex items-center justify-center overflow-hidden bg-black/55 p-2 backdrop-blur-sm sm:p-4">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="challenge-detail-title"
        className="challenge-detail-modal relative flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden border-2 border-black bg-[#f3e1d7] sm:max-h-[94vh]"
        style={{ animation: "none" }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-30 flex h-9 w-9 cursor-pointer items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-[#f5d547] sm:right-4 sm:top-4 sm:h-10 sm:w-10"
          aria-label="Close challenge details"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        <div className="challenge-detail-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 pb-4 sm:p-5 sm:pb-5">
          <section className="border-2 border-black bg-white p-4 shadow-[3px_3px_0_#111] sm:p-5">
            <div className="flex flex-wrap items-center gap-1.5 pr-11 sm:pr-12">
              <span className={`border px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${statusClassName}`}>{statusLabel}</span>
              <span className="border border-black/15 bg-[#f7efe9] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#5c4a42]">{challenge.ticker || (isSports ? "Sports" : "Market")}</span>
              <span className="border border-black/15 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#5c4a42]">{modeLabel}</span>
            </div>

            <div className="mt-3 flex items-center gap-3 pr-11 sm:gap-4 sm:pr-12">
              <Image src={assetLogo} alt={challenge.ticker || "Challenge asset"} width={48} height={48} unoptimized className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12" />
              <div className="min-w-0 flex-1">
                <h2 id="challenge-detail-title" className="max-w-full break-words text-base font-black leading-snug tracking-tight text-gray-900 [overflow-wrap:anywhere] sm:text-xl sm:leading-tight">
                  {isManualResolution || isResolveTimeAchieved ? (
                    <span className="text-black">
                      {primaryTitle}
                    </span>
                  ) : (
                    <>
                      <span className="text-black">
                        {primaryTitle} In
                      </span>
                      <span className="ml-1 text-black">
                        Next
                        <span className="ml-1 inline-flex items-center gap-1 sm:ml-2 sm:gap-1.5">
                          <span className="text-base font-bold text-emerald-900 sm:text-lg">{endsInText}</span>
                          <span className="group relative inline-flex items-center">
                            <svg className="h-3.5 w-3.5 cursor-help text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label={`Challenge resolves in ${endsInText}`}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="invisible absolute left-1/2 top-full z-40 mt-2 w-44 -translate-x-1/2 bg-gray-900 p-2 text-[10px] font-medium normal-case leading-relaxed text-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                              Resolves in {endsInText}
                            </span>
                          </span>
                        </span>
                      </span>
                    </>
                  )}
                </h2>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-black/10 pt-4 sm:grid-cols-4">
              <SummaryStat icon={Trophy} label="Pool" value={formatMoney(totalPool)} />
              {isCrypto && !isManualResolution ? (
                <SummaryStat icon={Target} label="Target" value={formatPrice(targetPrice)} accent />
              ) : (
                <SummaryStat icon={ShieldCheck} label="Resolution" value={isSports ? "Community" : resolutionLabel.replace(" resolution", "")} />
              )}
              <SummaryStat icon={Clock3} label="Joins close" value={expiresInTextForBox} />
              <SummaryStat icon={CalendarDays} label="Resolves" value={resolvesInText || "On result"} />
            </div>

          </section>

          <div className="mt-3 sm:mt-4">
            {isCrypto ? (
              <LazyCryptoMarketPanel
                key={challenge.id}
                asset={challenge.ticker}
                target={isManualResolution ? undefined : targetPrice}
                direction={isDirectionalBelow ? "below" : "above"}
              />
            ) : (
              <SportsOutcomePanel
                statusLabel={statusLabel}
                resolvesIn={resolvesInText || "After the event"}
                isResolved={isResolutionResolved}
                isResolving={isResolutionPending}
              />
            )}
          </div>

          <section className="mt-3 border-2 border-black bg-white p-3 shadow-[3px_3px_0_#111] sm:mt-4 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase tracking-[0.12em] text-[#8b7355] sm:text-sm">Participants</h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-black/20 bg-[#fffaf6] px-2.5 py-1 text-[9px] font-bold text-[#5c4a42] sm:text-xs">
                <Users className="h-3 w-3" /> {participants.length} {participants.length === 1 ? "player" : "players"}
              </span>
            </div>

            {participantLoading ? (
              <div className="flex h-36 items-center justify-center text-[#8b7a72]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-center">
                  <span className="border border-black bg-[#f5d547] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-black shadow-[2px_2px_0_#111]">
                    {modeLabel}
                  </span>
                </div>

                <div className="flex w-full items-end justify-center gap-2.5 py-1 max-[350px]:gap-1.5 sm:gap-5">
                  <div className="flex min-w-0 flex-col items-center">
                    <div className="mb-2 text-center">
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#8b7355] sm:text-[9px]">Challenger stake</p>
                      <p className="mt-0.5 text-sm font-black text-emerald-700 sm:text-base">{formatMoney(teamAStake)}</p>
                    </div>
                    <ClassicParticipantCard
                      participants={teamA}
                      label={isTeam ? "Challengers" : "Challenger"}
                      emptyTitle={isTeam ? "Creator" : "Challenger"}
                      subtitle={`${teamA.length} ${teamA.length === 1 ? "bet" : "bets"}`}
                      onOpenProfile={openProfile}
                      align="left"
                    />
                  </div>

                  <div className="flex w-16 shrink-0 items-center justify-center pb-10 sm:w-20 sm:pb-11">
                    {teamB.length ? (
                      <video
                        src="/animations/Sword%20Battle.webm"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] object-contain p-1 sm:h-12 sm:w-12"
                      />
                    ) : (
                      <Image src="/animations/versus.png" alt="Versus" width={60} height={60} className="h-14 w-14 object-contain" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col items-center">
                    <div className="mb-2 text-center">
                      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#8b7355] sm:text-[9px]">Opponent stake</p>
                      <p className="mt-0.5 text-sm font-black text-emerald-700 sm:text-base">{formatMoney(teamBStake)}</p>
                    </div>
                    <ClassicParticipantCard
                      participants={teamB}
                      label={isTeam ? "Opponents" : "Opponent"}
                      emptyTitle="No one yet"
                      subtitle={teamB.length ? `${teamB.length} ${teamB.length === 1 ? "bet" : "bets"}` : isExpireTimeAchieved ? "No opponent joined" : "Open side"}
                      onOpenProfile={openProfile}
                      dashed={!teamB.length}
                      align="right"
                    />
                  </div>
                </div>

                {escrowHref && (
                  <div className="mt-3 flex justify-center border-t border-black/10 pt-2.5">
                    <a
                      href={escrowHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.08em] text-[#8b7a72] transition-colors hover:text-[#246044] sm:text-[9px]"
                      title={escrowAddress}
                    >
                      <ShieldCheck className="h-3 w-3 text-[#246044]" /> Escrow {escrowDisplay} <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}

                <BetActivityList activity={betActivity} onOpenProfile={openProfile} creatorLabel={isTeam ? "Creator" : "Challenger"} />
              </>
            )}
          </section>
        </div>

        <footer className="flex shrink-0 items-stretch gap-2 border-t-2 border-black bg-[#f3e1d7] p-3 sm:gap-3 sm:px-5">
          <ChallengeAcceptAction
            challenge={challenge}
            ctaState={cleanCtaState}
            canOpen={handleCtaClick}
            onOpenChange={setIsAcceptModalOpen}
          />
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="group inline-flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-3 text-xs font-black uppercase tracking-[0.06em] text-black shadow-[2px_2px_0_#111] transition-all hover:-translate-y-0.5 hover:bg-[#f5d547] sm:max-w-48 sm:text-sm"
          >
            <Share2 className="h-4 w-4 transition-transform group-hover:rotate-[-8deg]" strokeWidth={2.5} /> Share
          </button>
        </footer>

        <ShareChallengeModal
          challenge={challenge}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />

        <style jsx global>{`
          .challenge-detail-scrollbar { scrollbar-width: thin; scrollbar-color: #8b7355 transparent; }
          .challenge-detail-scrollbar::-webkit-scrollbar { width: 4px; }
          .challenge-detail-scrollbar::-webkit-scrollbar-thumb { background: #8b7355; }
          .challenge-detail-modal .detail-primary-action {
            height: 3.5rem !important;
            padding: 0 0.75rem !important;
            font-size: 0.875rem !important;
          }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}

function SummaryStat({ icon: Icon, label, value, accent = false }: {
  icon: typeof Trophy;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0 border border-black/10 bg-[#fffaf6] p-2.5 sm:p-3">
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#8b7a72]">
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-[#e85a2d]" : "text-[#246044]"}`} /> {label}
      </div>
      <p className={`mt-1 truncate text-sm font-black sm:text-base ${accent ? "text-[#d64d26]" : "text-[#17120f]"}`} title={value}>{value}</p>
    </div>
  );
}

function LazyCryptoMarketPanel({ asset, target, direction }: {
  asset: string;
  target?: number;
  direction: "above" | "below";
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <section className="border-2 border-black bg-white shadow-[3px_3px_0_#111]">
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        aria-controls="challenge-market-analysis"
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f5d547]/25 sm:px-5 sm:py-4"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-[#163f31] text-white">
            <Activity className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7a72]">Analyze market</span>
            <span className="block break-words text-sm font-black text-[#17120f] [overflow-wrap:anywhere]">View the {asset} price chart</span>
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      {isExpanded && (
        <div id="challenge-market-analysis" className="border-t-2 border-black">
          <CryptoMarketPanel asset={asset} target={target} direction={direction} />
        </div>
      )}
    </section>
  );
}

function CryptoMarketPanel({ asset, target, direction }: {
  asset: string;
  target?: number;
  direction: "above" | "below";
}) {
  const [range, setRange] = React.useState<ChartRange>("3M");
  const [state, setState] = React.useState<{
    key: string;
    candles: MarketCandle[];
    failed: boolean;
  }>({ key: "", candles: [], failed: false });
  const requestKey = `${asset}:${range}`;

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/market-chart?asset=${encodeURIComponent(asset)}&range=${range}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Chart unavailable");
        return response.json() as Promise<{ candles: MarketCandle[] }>;
      })
      .then((data) => {
        if (!cancelled) setState({ key: requestKey, candles: data.candles, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ key: requestKey, candles: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [asset, range, requestKey]);

  const candles = React.useMemo(
    () => state.key === requestKey ? state.candles : [],
    [requestKey, state.candles, state.key],
  );
  const isLoading = state.key !== requestKey;
  const firstPrice = candles[0]?.close ?? 0;
  const currentPrice = candles.at(-1)?.close ?? 0;
  const priceChange = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <section className="overflow-hidden bg-[#163f31] text-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/15 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center border border-white/20 bg-white/10"><Crosshair className="h-4 w-4" /></span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/60">Analyze market</p>
              <h3 className="text-lg font-black">{asset}</h3>
            </div>
          </div>
          {currentPrice > 0 && (
            <div className="mt-3 flex items-end gap-2">
              <span className="break-all text-xl font-black sm:text-3xl">{formatPrice(currentPrice)}</span>
              <span className={`mb-1 inline-flex items-center gap-1 text-xs font-black ${isPositive ? "text-emerald-300" : "text-red-300"}`}>
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        <div className="grid w-full grid-cols-4 border border-white/20 bg-black/10 p-0.5 min-[430px]:w-auto">
          {(["24H", "7D", "30D", "3M"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`h-8 min-w-0 px-2 text-[9px] font-black ${range === option ? "bg-white text-[#163f31]" : "text-white/65 hover:text-white"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-56 min-w-0 sm:h-72">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-white/60"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : state.failed || candles.length < 2 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-white/60">
            <Activity className="h-6 w-6" />
            <p className="mt-2 text-xs font-bold">Chart unavailable for this asset</p>
          </div>
        ) : (
          <MarketCandlestickChart key={requestKey} candles={candles} asset={asset} target={target} direction={direction} />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-1 border-t border-white/15 px-3 py-2 text-[8px] font-bold uppercase tracking-[0.06em] text-white/50 sm:px-4 sm:text-[9px]">
        <span>Pan, zoom and hover</span><span>{range}</span>
      </div>
    </section>
  );
}

function MarketCandlestickChart({ candles, asset, target, direction }: {
  candles: MarketCandle[];
  asset: string;
  target?: number;
  direction: "above" | "below";
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const chartApiRef = React.useRef<ReturnType<typeof createChart> | null>(null);
  const [inspected, setInspected] = React.useState<MarketCandle>(() => candles.at(-1)!);

  React.useEffect(() => {
    const container = containerRef.current;
    const validCandles = candles
      .filter((candle) => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite))
      .map((candle) => ({
        time: Math.floor(candle.time / 1000) as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));
    if (!container || validCandles.length < 2) return;

    const chartApi = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#163f31" },
        textColor: "rgba(255,255,255,.58)",
        fontFamily: "inherit",
        attributionLogo: true,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.07)" },
        horzLines: { color: "rgba(255,255,255,.09)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,.35)", labelBackgroundColor: "#246044" },
        horzLine: { color: "rgba(255,255,255,.35)", labelBackgroundColor: "#246044" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,.15)" },
      timeScale: {
        borderColor: "rgba(255,255,255,.15)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 1,
        barSpacing: 10,
        minBarSpacing: 1,
      },
      handleScroll: true,
      handleScale: true,
      localization: { priceFormatter: formatPrice },
    });
    chartApiRef.current = chartApi;
    const series = chartApi.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#fb7185",
      borderUpColor: "#a7f3d0",
      borderDownColor: "#fecdd3",
      wickUpColor: "#6ee7b7",
      wickDownColor: "#fda4af",
      priceLineVisible: false,
      lastValueVisible: true,
    });
    series.setData(validCandles);
    series.createPriceLine({
      price: validCandles.at(-1)!.close,
      color: "rgba(255,255,255,.48)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "CURRENT",
    });
    if (target && target > 0) {
      series.createPriceLine({
        price: target,
        color: "#f5d547",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `${direction.toUpperCase()} TARGET`,
      });
    }

    chartApi.subscribeCrosshairMove((param) => {
      const point = param.seriesData.get(series) as { time?: number; open?: number; high?: number; low?: number; close?: number } | undefined;
      if (!point || ![point.open, point.high, point.low, point.close].every((value) => typeof value === "number")) return;
      setInspected({
        time: Number(point.time || validCandles.at(-1)!.time) * 1000,
        open: point.open!,
        high: point.high!,
        low: point.low!,
        close: point.close!,
      });
    });
    chartApi.timeScale().fitContent();

    return () => {
      chartApiRef.current = null;
      chartApi.remove();
    };
  }, [candles, direction, target]);

  const zoomChart = (factor: number) => {
    const timeScale = chartApiRef.current?.timeScale();
    const range = timeScale?.getVisibleLogicalRange();
    if (!timeScale || !range) return;
    const center = (range.from + range.to) / 2;
    const halfRange = ((range.to - range.from) * factor) / 2;
    timeScale.setVisibleLogicalRange({ from: center - halfRange, to: center + halfRange });
  };

  const inspectedTime = new Date(inspected.time).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="relative h-full w-full select-none" aria-label={`${asset} interactive candlestick chart`}>
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] border border-white/20 bg-[#163f31]/90 px-2 py-1.5 text-[8px] font-bold text-white/65 shadow-sm sm:max-w-[calc(100%-8rem)] sm:text-[9px]">
        <span className="mr-2 text-white/90">{inspectedTime}</span>
        <span className="hidden min-[430px]:inline">O {formatPrice(inspected.open)} · H {formatPrice(inspected.high)} · L {formatPrice(inspected.low)} · C {formatPrice(inspected.close)}</span>
        <span className="min-[430px]:hidden">C {formatPrice(inspected.close)}</span>
      </div>
      <div className="absolute bottom-2 right-2 z-20 flex border border-white/20 bg-[#163f31]/90 p-0.5 shadow-sm sm:bottom-auto sm:right-14 sm:top-2" aria-label="Chart zoom controls">
        <button type="button" onClick={() => zoomChart(1.35)} className="flex h-7 w-7 items-center justify-center text-sm font-black text-white/70 hover:bg-white/10 hover:text-white" aria-label="Zoom out">−</button>
        <button type="button" onClick={() => zoomChart(0.72)} className="flex h-7 w-7 items-center justify-center border-x border-white/15 text-sm font-black text-white/70 hover:bg-white/10 hover:text-white" aria-label="Zoom in">+</button>
        <button type="button" onClick={() => chartApiRef.current?.timeScale().fitContent()} className="flex h-7 items-center justify-center px-2 text-[8px] font-black uppercase text-white/70 hover:bg-white/10 hover:text-white" aria-label="Fit all candles">Fit</button>
      </div>
    </div>
  );
}

function SportsOutcomePanel({ statusLabel, resolvesIn, isResolved, isResolving }: {
  statusLabel: string;
  resolvesIn: string;
  isResolved: boolean;
  isResolving: boolean;
}) {
  return (
    <section className="border-2 border-black bg-[#201a16] p-4 text-white shadow-[3px_3px_0_#e85a2d] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-white/25 bg-[#f5d547] text-black"><Trophy className="h-5 w-5" /></span>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/55">Event outcome</p>
          <h3 className="mt-1 text-lg font-black">{isResolved ? "Result confirmed" : isResolving ? "Checking result" : statusLabel}</h3>
          <p className="mt-1 text-xs font-bold text-white/65">Community verified · {resolvesIn}</p>
        </div>
      </div>
    </section>
  );
}

function ClassicParticipantCard({ participants, label, emptyTitle, subtitle, onOpenProfile, align, dashed = false }: {
  participants: ParticipantView[];
  label: string;
  emptyTitle: string;
  subtitle: string;
  onOpenProfile: (wallet: string | null | undefined) => void;
  align: "left" | "right";
  dashed?: boolean;
}) {
  const primary = participants[0];
  const visibleParticipants = participants.slice(0, 3);
  const [activeParticipantKey, setActiveParticipantKey] = React.useState<string | null>(null);
  const activeParticipant = participants.find((participant) => participant.key === activeParticipantKey);

  return (
    <div
      onMouseLeave={() => setActiveParticipantKey(null)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActiveParticipantKey(null);
      }}
      className={`relative flex h-[132px] w-[98px] max-w-full shrink-0 flex-col items-center justify-center rounded-xl p-2 text-center transition-transform hover:-translate-y-0.5 sm:h-[140px] sm:w-[120px] sm:p-3 ${activeParticipant ? "z-[70]" : ""} ${dashed ? "border-2 border-dashed border-[#ead2c4] bg-[#fffaf6]" : "border-2 border-[#d4a574]/35 bg-white shadow-[0_5px_16px_rgba(77,48,32,.05)]"}`}
    >
      {primary ? (
        <>
          <span className="relative flex h-12 w-full items-center justify-center sm:h-14">
            {visibleParticipants.map((participant, index) => (
              <button
                key={participant.key}
                type="button"
                disabled={!participant.wallet}
                onClick={() => onOpenProfile(participant.wallet)}
                onMouseEnter={() => participant.wallet && setActiveParticipantKey(participant.key)}
                onFocus={() => participant.wallet && setActiveParticipantKey(participant.key)}
                aria-label={`Open ${participant.name}'s profile`}
                className="absolute h-11 w-11 cursor-pointer rounded-full border-2 border-[#d4a574] bg-[#f5d547] shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-default sm:h-14 sm:w-14"
                style={{ transform: `translateX(${(index - (visibleParticipants.length - 1) / 2) * 18}px)`, zIndex: activeParticipantKey === participant.key ? 20 : 3 - index }}
              >
                <span className="block h-full w-full overflow-hidden rounded-full">
                  <Image src={participant.avatar || FALLBACK_AVATAR} alt={participant.name} width={56} height={56} className="h-full w-full object-cover" />
                </span>
                {participant.isVerified && (
                  <span className="absolute -bottom-1 -right-1 z-10"><SmallVerifiedBadge isModerator={participant.isModerator} /></span>
                )}
              </button>
            ))}
            {participants.length > 3 && <span className="pointer-events-none absolute -right-1 -top-1 z-30 rounded-full border border-black bg-[#f5d547] px-1.5 py-0.5 text-[8px] font-black">+{participants.length - 3}</span>}
          </span>
          <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-[#2d1f1a] px-1.5 py-0.5 text-[8px] font-bold uppercase text-white sm:text-[9px]">
            {label}
          </span>
          <span className="mt-2 flex max-w-full items-center gap-1">
            <span className="truncate text-[10px] font-bold text-[#2d1f1a] sm:text-xs">{primary.name}</span>
          </span>
        </>
      ) : (
        <>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#d4a574]/55 bg-[#eee9e4] text-[#8b7355] sm:h-14 sm:w-14"><User className="h-5 w-5" /></span>
          <span className="mt-1 rounded-full bg-[#2d1f1a] px-1.5 py-0.5 text-[8px] font-bold uppercase text-white sm:text-[9px]">{label}</span>
          <span className="mt-2 text-[10px] font-bold text-[#2d1f1a] sm:text-xs">{emptyTitle}</span>
        </>
      )}
      <span className="mt-0.5 line-clamp-2 text-[8px] leading-tight text-[#8b7355] sm:text-[9px]">{subtitle}</span>
      {activeParticipant && (
        <ProfileHoverPreview
          walletAddress={activeParticipant.wallet}
          fallbackAvatar={activeParticipant.avatar || FALLBACK_AVATAR}
          fallbackName={activeParticipant.name}
          align={align}
        />
      )}
    </div>
  );
}

function BetActivityList({ activity, onOpenProfile, creatorLabel }: {
  activity: BetActivityView[];
  onOpenProfile: (wallet: string | null | undefined) => void;
  creatorLabel: "Creator" | "Challenger";
}) {
  return (
    <div className="mt-4 border-t border-black/10 pt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.12em] text-[#5c4a42] sm:text-xs">Bet activity</h4>
          <p className="mt-0.5 text-[9px] font-bold text-[#9a887f]">Who backed each side and when</p>
        </div>
        <span className="border border-black/15 bg-[#fffaf6] px-2 py-1 text-[9px] font-black text-[#75645c]">
          {activity.length} {activity.length === 1 ? "bet" : "bets"}
        </span>
      </div>

      {activity.length ? (
        <div className="max-h-56 divide-y divide-black/10 overflow-y-auto border border-black/10 bg-[#fffaf6]">
          {activity.map((bet) => (
            <button
              key={bet.key}
              type="button"
              disabled={!bet.wallet}
              onClick={() => onOpenProfile(bet.wallet)}
              className="flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left transition-colors hover:bg-[#fdf1e9] disabled:cursor-default sm:gap-3 sm:px-3"
            >
              <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-[#d4a574] bg-[#f5d547]">
                <Image src={bet.avatar || FALLBACK_AVATAR} alt="" width={32} height={32} className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-[11px] font-black text-[#2d1f1a] sm:text-xs">{bet.name}</span>
                  {bet.isCreator && <span className="shrink-0 bg-[#2d1f1a] px-1.5 py-0.5 text-[7px] font-black uppercase text-white">{creatorLabel}</span>}
                </span>
                <span className="mt-0.5 block text-[9px] font-bold text-[#8b7355]">
                  Backed {bet.side === "TEAM_A" ? "challenger" : "opponent"}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[11px] font-black text-emerald-700 sm:text-xs">{formatMoney(bet.bet)}</span>
                <span className="mt-0.5 flex items-center justify-end gap-1 text-[8px] font-bold text-[#8b7a72] sm:text-[9px]">
                  <Clock3 className="h-2.5 w-2.5" /> {formatBetPlacedAt(bet.createdAt)}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-black/20 bg-[#fffaf6] px-3 py-5 text-center text-[10px] font-bold text-[#8b7a72]">
          Bet activity will appear here when players join.
        </div>
      )}
    </div>
  );
}

function SmallVerifiedBadge({ isModerator }: { isModerator: boolean }) {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 32 32" aria-label="Verified user">
      <path fill={isModerator ? "#F5B800" : "#378FDB"} d="M16 1.5l2.8 2.2 3.5-1 1.6 3.2 3.6.5.1 3.7 3 2-1.4 3.4 1.4 3.4-3 2-.1 3.7-3.6.5-1.6 3.2-3.5-1L16 30.5l-2.8-2.2-3.5 1-1.6-3.2-3.6-.5-.1-3.7-3-2 1.4-3.4-1.4-3.4 3-2 .1-3.7 3.6-.5 1.6-3.2 3.5 1L16 1.5Z" />
      <path d="m9.4 16.2 4.2 4.2 9-9" fill="none" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
