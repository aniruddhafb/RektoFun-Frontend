"use client";

import React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Activity,
  CalendarDays,
  Clock3,
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
import { Challenge, incrementChallengeViews } from "@/app/lib/challenges-service/challenges";
import { getUserById, User as UserType } from "@/app/lib/users-service/users";
import { getPositionsByChallenge, Position } from "@/app/lib/positions-service/positions";
import { useChallengeDetail } from "@/app/hooks/useChallengeDetail";
import { useChallengeCard } from "@/app/hooks/useChallengeCard";
import { AcceptChallengeModal } from "./AcceptChallengeModal";

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

type MarketCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type ChartRange = "24H" | "7D" | "30D";

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
    modalMaxAcceptBet,
    betCurrency,
    exactCountdownDetails,
    isTeam,
    setBetInput,
    setBetError,
    setJoinSide,
    openBetForm,
    closeBetForm,
    handleJoinChallenge,
  } = useChallengeCard(challenge);

  React.useEffect(() => {
    onOpenChange(isBetFormOpen);
    return () => onOpenChange(false);
  }, [isBetFormOpen, onOpenChange]);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleJoinChallenge();
  };

  return (
    <>
      <div className="group relative flex-[2]">
        <button
          type="button"
          disabled={ctaState.disabled || isLoading}
          onClick={(event) => {
            if (!canOpen()) return;
            openBetForm(event);
          }}
          className={`${ctaState.className} detail-primary-action`}
        >
          {isLoading ? "Joining..." : cleanCtaLabel(ctaState.label)}
        </button>
        {ctaState.showCreatorHint && (
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 border border-black bg-white px-2 py-1 text-[10px] font-bold text-black opacity-0 shadow-[2px_2px_0_#111] transition-opacity group-hover:opacity-100">
            Your challenge
          </div>
        )}
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
    </>
  );
}

export default function ChallengeDetailModal({ challenge, creator, isOpen, onClose }: ChallengeDetailModalProps) {
  const [isAcceptModalOpen, setIsAcceptModalOpen] = React.useState(false);
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
    shareFeedback,
    assetLogo,
    creatorName,
    creatorAvatar,
    creatorWalletAddress,
    isTeam,
    targetPrice,
    isDirectionalBelow,
    isManualResolution,
    isExpireTimeAchieved,
    isResolutionPending,
    isResolutionResolved,
    createdTimeText,
    resolvesInText,
    expiresInTextForBox,
    statusLabel,
    statusClassName,
    modeLabel,
    primaryTitle,
    resolutionLabel,
    ctaState,
    handleCtaClick,
    handleShareChallenge,
    openProfile,
    onClose: handleClose,
  } = useChallengeDetail(challenge, resolvedCreator, isOpen && !isAcceptModalOpen, onClose);

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

  if (!isOpen || !challenge) return null;

  const teamA = participants.filter((participant) => participant.side === "TEAM_A");
  const teamB = participants.filter((participant) => participant.side === "TEAM_B");
  const teamAStake = teamA.reduce((sum, participant) => sum + participant.bet, 0);
  const teamBStake = teamB.reduce((sum, participant) => sum + participant.bet, 0);
  const recordedPool = teamAStake + teamBStake;
  const totalPool = recordedPool || challenge.total_pool || challenge.pool_size || challenge.initial_bet || 0;
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
            <div className="flex items-start gap-3 pr-11 sm:gap-4 sm:pr-12">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black bg-[#fffaf6] p-2 sm:h-16 sm:w-16 sm:p-3">
                <Image src={assetLogo} alt="" width={48} height={48} className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`border px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${statusClassName}`}>{statusLabel}</span>
                  <span className="border border-black/15 bg-[#f7efe9] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#5c4a42]">{challenge.ticker || (isSports ? "Sports" : "Market")}</span>
                  <span className="border border-black/15 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#5c4a42]">{modeLabel}</span>
                </div>
                <h2 id="challenge-detail-title" className="mt-2 break-words text-xl font-black leading-tight tracking-[-0.02em] text-[#17120f] sm:text-3xl">
                  {primaryTitle}
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

            <button
              type="button"
              onClick={() => openProfile(creatorWalletAddress)}
              className="mt-4 flex max-w-full cursor-pointer items-center gap-2.5 border-t border-black/10 pt-3 text-left"
            >
              <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-black bg-[#f5d547]">
                <Image src={creatorAvatar || FALLBACK_AVATAR} alt="" width={32} height={32} className="h-full w-full object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-black text-[#17120f]">{creatorName}</span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b7a72]">Creator · {createdTimeText}</span>
              </span>
            </button>
          </section>

          <div className="mt-3 sm:mt-4">
            {isCrypto ? (
              <CryptoMarketPanel
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
                <Users className="h-3 w-3" /> {teamB.length ? (isTeam ? `${participants.length} joined` : "Matched") : "Waiting"}
              </span>
            </div>

            {participantLoading ? (
              <div className="flex h-36 items-center justify-center text-[#8b7a72]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="flex w-full items-center justify-center gap-2.5 py-1 max-[350px]:gap-1.5 sm:gap-5">
                <ClassicParticipantCard
                  participants={teamA}
                  label={isTeam ? "Challengers" : "Challenger"}
                  emptyTitle="Creator"
                  subtitle={isTeam ? `${teamA.length} joined · ${formatMoney(teamAStake)}` : "Created challenge"}
                  onOpenProfile={openProfile}
                />

                <div className="flex w-16 shrink-0 flex-col items-center justify-center sm:w-20">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-[11px] font-black shadow-[2px_2px_0_rgba(0,0,0,.12)] sm:h-12 sm:w-12 ${teamB.length ? "border-black bg-[#2d1f1a] text-white" : "border-white bg-[#cbd0d8] text-white/70"}`}>
                    {teamB.length ? "VS" : <User className="h-5 w-5 sm:h-6 sm:w-6" />}
                  </span>
                  <span className="mt-2 rounded-full bg-[#eee7df] px-2 py-1 text-center text-[9px] font-bold text-[#8b7355] sm:text-[10px]">
                    {teamB.length ? "Live" : isExpireTimeAchieved ? "Expired" : "Seeking"}
                  </span>
                </div>

                <ClassicParticipantCard
                  participants={teamB}
                  label={isTeam ? "Opponent side" : "Opponent"}
                  emptyTitle="No one yet"
                  subtitle={teamB.length ? (isTeam ? `${teamB.length} joined · ${formatMoney(teamBStake)}` : `${formatMoney(teamBStake)} staked`) : isExpireTimeAchieved ? "No opponent joined" : "Be the first to accept"}
                  onOpenProfile={openProfile}
                  dashed={!teamB.length}
                />
              </div>
            )}
          </section>

          <div className="mt-3 flex items-center justify-between gap-3 border border-black/15 bg-[#fffaf6] px-3 py-2 text-[10px] font-bold text-[#75645c] sm:mt-4">
            <span className="inline-flex items-center gap-1.5">
              {isManualResolution ? <ShieldCheck className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
              {resolutionLabel}
            </span>
            <span>{challenge.views ?? 0} views</span>
          </div>
        </div>

        <footer className="flex shrink-0 gap-2 border-t-2 border-black bg-[#f3e1d7] p-3 sm:gap-3 sm:px-5">
          <ChallengeAcceptAction
            challenge={challenge}
            ctaState={cleanCtaState}
            canOpen={handleCtaClick}
            onOpenChange={setIsAcceptModalOpen}
          />
          <button
            type="button"
            onClick={handleShareChallenge}
            className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-3 text-xs font-black text-black transition-colors hover:bg-[#f5d547] sm:max-w-44 sm:text-sm"
          >
            <Share2 className="h-4 w-4" /> {shareFeedback ?? "Share"}
          </button>
        </footer>

        <style jsx global>{`
          .challenge-detail-scrollbar { scrollbar-width: thin; scrollbar-color: #8b7355 transparent; }
          .challenge-detail-scrollbar::-webkit-scrollbar { width: 4px; }
          .challenge-detail-scrollbar::-webkit-scrollbar-thumb { background: #8b7355; }
          .pixel-shell .challenge-detail-modal .detail-primary-action {
            height: 2.75rem !important;
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

function CryptoMarketPanel({ asset, target, direction }: {
  asset: string;
  target?: number;
  direction: "above" | "below";
}) {
  const [range, setRange] = React.useState<ChartRange>("24H");
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
  const chart = React.useMemo(() => buildChart(candles, target), [candles, target]);

  return (
    <section className="overflow-hidden border-2 border-black bg-[#163f31] text-white shadow-[3px_3px_0_#111]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/15 px-4 py-3 sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center border border-white/20 bg-white/10"><Activity className="h-4 w-4" /></span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/60">Market</p>
              <h3 className="text-lg font-black">{asset}</h3>
            </div>
          </div>
          {currentPrice > 0 && (
            <div className="mt-3 flex items-end gap-2">
              <span className="text-2xl font-black sm:text-3xl">{formatPrice(currentPrice)}</span>
              <span className={`mb-1 inline-flex items-center gap-1 text-xs font-black ${isPositive ? "text-emerald-300" : "text-red-300"}`}>
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex border border-white/20 bg-black/10 p-0.5">
          {(["24H", "7D", "30D"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`h-7 px-2.5 text-[9px] font-black ${range === option ? "bg-white text-[#163f31]" : "text-white/65 hover:text-white"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-48 p-3 sm:h-56 sm:p-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-white/60"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : state.failed || !chart ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-white/60">
            <Activity className="h-6 w-6" />
            <p className="mt-2 text-xs font-bold">Chart unavailable for this asset</p>
          </div>
        ) : (
          <>
            <svg viewBox="0 0 640 190" preserveAspectRatio="none" className="h-full w-full" aria-label={`${asset} ${range} price chart`}>
              <defs>
                <linearGradient id="market-chart-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? "#34d399" : "#fb7185"} stopOpacity="0.38" />
                  <stop offset="100%" stopColor={isPositive ? "#34d399" : "#fb7185"} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[25, 50, 75].map((y) => <line key={y} x1="0" x2="640" y1={y * 1.9} y2={y * 1.9} stroke="rgba(255,255,255,.1)" strokeWidth="1" />)}
              <path d={chart.areaPath} fill="url(#market-chart-area)" />
              {chart.targetY !== null && (
                <line x1="0" x2="640" y1={chart.targetY} y2={chart.targetY} stroke="#f5d547" strokeWidth="1.5" strokeDasharray="6 5" />
              )}
              <path d={chart.linePath} fill="none" stroke={isPositive ? "#6ee7b7" : "#fda4af"} strokeWidth="3" vectorEffect="non-scaling-stroke" />
              <circle cx={chart.lastX} cy={chart.lastY} r="5" fill="white" stroke={isPositive ? "#10b981" : "#f43f5e"} strokeWidth="3" vectorEffect="non-scaling-stroke" />
            </svg>
            {target && target > 0 && chart.targetY !== null && (
              <span className="absolute right-3 border border-[#f5d547]/40 bg-[#f5d547] px-2 py-1 text-[9px] font-black text-black" style={{ top: `calc(${(chart.targetY / 190) * 100}% - 8px)` }}>
                Target {direction} {formatPrice(target)}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-white/15 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.08em] text-white/50">
        <span>Binance market data</span><span>{range}</span>
      </div>
    </section>
  );
}

function buildChart(candles: MarketCandle[], target?: number) {
  if (candles.length < 2) return null;
  const prices = candles.map((candle) => candle.close);
  if (target && target > 0) prices.push(target);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const spread = max - min || Math.max(max * 0.01, 1);
  const paddedMin = min - spread * 0.12;
  const paddedMax = max + spread * 0.12;
  const yFor = (price: number) => 180 - ((price - paddedMin) / (paddedMax - paddedMin)) * 170;
  const points = candles.map((candle, index) => ({
    x: (index / (candles.length - 1)) * 640,
    y: yFor(candle.close),
  }));
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L640,190 L0,190 Z`;
  const last = points.at(-1)!;
  return {
    linePath,
    areaPath,
    lastX: last.x,
    lastY: last.y,
    targetY: target && target > 0 ? yFor(target) : null,
  };
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

function ClassicParticipantCard({ participants, label, emptyTitle, subtitle, onOpenProfile, dashed = false }: {
  participants: ParticipantView[];
  label: string;
  emptyTitle: string;
  subtitle: string;
  onOpenProfile: (wallet: string | null | undefined) => void;
  dashed?: boolean;
}) {
  const primary = participants[0];
  const visibleParticipants = participants.slice(0, 3);

  return (
    <button
      type="button"
      disabled={!primary?.wallet}
      onClick={() => onOpenProfile(primary?.wallet)}
      className={`flex h-[132px] w-[98px] max-w-full shrink-0 flex-col items-center justify-center rounded-xl p-2 text-center transition-transform hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0 sm:h-[140px] sm:w-[120px] sm:p-3 ${dashed ? "border-2 border-dashed border-[#ead2c4] bg-[#fffaf6]" : "border-2 border-[#d4a574]/35 bg-white shadow-[0_5px_16px_rgba(77,48,32,.05)]"}`}
    >
      {primary ? (
        <>
          <span className="relative flex h-12 w-full items-center justify-center sm:h-14">
            {visibleParticipants.map((participant, index) => (
              <span
                key={participant.key}
                className="absolute h-11 w-11 overflow-hidden rounded-full border-2 border-[#d4a574] bg-[#f5d547] shadow-sm sm:h-14 sm:w-14"
                style={{ transform: `translateX(${(index - (visibleParticipants.length - 1) / 2) * 18}px)`, zIndex: 3 - index }}
              >
                <Image src={participant.avatar || FALLBACK_AVATAR} alt="" width={56} height={56} className="h-full w-full object-cover" />
              </span>
            ))}
            {participants.length > 3 && <span className="absolute -right-1 -top-1 z-10 rounded-full border border-black bg-[#f5d547] px-1.5 py-0.5 text-[8px] font-black">+{participants.length - 3}</span>}
          </span>
          <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-[#2d1f1a] px-1.5 py-0.5 text-[8px] font-bold uppercase text-white sm:text-[9px]">
            {label}
          </span>
          <span className="mt-2 flex max-w-full items-center gap-1">
            <span className="truncate text-[10px] font-bold text-[#2d1f1a] sm:text-xs">{primary.name}</span>
            {primary.isVerified && <SmallVerifiedBadge isModerator={primary.isModerator} />}
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
    </button>
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
