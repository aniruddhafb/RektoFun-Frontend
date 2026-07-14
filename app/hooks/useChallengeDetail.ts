import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Challenge, getChallengeCategoryImage } from "@/app/lib/challenges-service/challenges";
import { User } from "@/app/lib/users-service/users";
import { useUserStore } from "@/app/store/useUserStore";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { stripUsdcQuote } from "@/app/lib/format-market-label";

// Types
interface CTAState {
  label: string;
  disabled: boolean;
  className: string;
  isOngoing: boolean;
  showCreatorHint: boolean;
}

const parseTimestamp = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value < 1e12 ? value * 1000 : value;
  if (typeof value !== "string") return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && value.trim() !== "") return numeric < 1e12 ? numeric * 1000 : numeric;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const parseCardDateValue = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const parseCardResolutionDateValue = (value: unknown): number | null => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseCardDateValue(`${value}T23:59:59.999Z`);
  }
  return parseCardDateValue(value);
};

// Formatting utilities
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

export function useChallengeDetail(
  challenge: Challenge | null,
  creator: User | null | undefined,
  isOpen: boolean,
  onClose: () => void
) {
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useUserStore();
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  useBodyScrollLock(isOpen);

  // State
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [isTitleExpanded, setIsTitleExpanded] = useState(true);

  // Derived values
  const assetLogo = challenge ? getChallengeCategoryImage(challenge) : "/scribbles/btc.png";
  const teamAHighestBet = challenge?.bet_info?.highest_bet?.TEAM_A;
  const teamBHighestBet = challenge?.bet_info?.highest_bet?.TEAM_B;
  const creatorName = teamAHighestBet?.username || creator?.username || "Creator";
  const creatorAvatar = teamAHighestBet?.profile_image || creator?.profile_image || assetLogo;
  const creatorWalletAddress = teamAHighestBet?.pubkey || creator?.pubkey || "";
  const creatorWalletShort = creatorWalletAddress
    ? `${creatorWalletAddress.slice(0, 6)}...${creatorWalletAddress.slice(-4)}`
    : "Unknown wallet";
  const opponentName = teamBHighestBet?.username || "Opponent";
  const opponentAvatar = teamBHighestBet?.profile_image || assetLogo;
  const opponentWalletAddress = teamBHighestBet?.pubkey || "";
  const hasOpponents = Boolean(teamBHighestBet) || Number(challenge?.participants ?? 0) > 1;
  const isTeam = challenge?.mode === "TEAM";
  const betAmount = challenge?.initial_bet ?? 0;
  const composerResolvesAt = challenge?.metadata?.composer?.resolves_at;
  const createdTimestamp = parseTimestamp(challenge?.created_at);
  const expiryTimestamp = parseTimestamp(challenge?.expiry) ?? parseTimestamp(challenge?.expire_time);
  const resolveTimestamp = parseCardDateValue(composerResolvesAt)
    ?? parseCardDateValue(challenge?.resolve_time)
    ?? parseCardResolutionDateValue(challenge?.resolution_date);

  // Title expansion (backed by `statement`, the only challenge-text field available)
  const challengeStatement = stripUsdcQuote(challenge?.statement) || `Bet on ${challenge?.ticker || "this market"}`;
  const titleWords = challengeStatement.trim().split(/\s+/).filter(Boolean);
  const canExpandTitle = titleWords.length > 6;
  const displayedTitle = isTitleExpanded || !canExpandTitle
    ? challengeStatement
    : `${titleWords.slice(0, 6).join(" ")}...`;

  // Price calculations
  const startPrice = betAmount;
  const targetPrice = challenge?.target ?? challenge?.pool_size ?? betAmount;
  const currentPrice = challenge?.pool_size ?? 0;
  const priceChange = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
  const isDirectionalBelow = challenge?.direction === "DOWN";

  const priceBarPosition = (() => {
    if (targetPrice <= 0 || currentPrice <= 0) return 0;
    const ratio = isDirectionalBelow
      ? targetPrice / currentPrice
      : currentPrice / targetPrice;
    return Math.max(0, Math.min(100, ratio * 100));
  })();

  // Theme classes
  const progressThemeClass = isDirectionalBelow
    ? "from-red-500 to-red-300"
    : "from-emerald-500 to-emerald-300";
  const markerThemeClass = isDirectionalBelow ? "border-red-400" : "border-emerald-400";
  const markerDotThemeClass = isDirectionalBelow ? "bg-red-500" : "bg-emerald-500";
  const priceLabelThemeClass = isDirectionalBelow ? "text-red-300" : "text-emerald-300";

  // Challenge status
  const isCreator = Boolean(user?.id && challenge?.creator && user.id === challenge.creator);
  const isExpireTimeAchieved = Boolean(expiryTimestamp && expiryTimestamp <= currentTime);
  const isResolveTimeAchieved = Boolean(resolveTimestamp && resolveTimestamp <= currentTime);
  const challengerConditionMet = isDirectionalBelow ? currentPrice < targetPrice : currentPrice > targetPrice;
  const opponentConditionMet = isDirectionalBelow ? currentPrice > targetPrice : currentPrice < targetPrice;
  const hasWon = hasOpponents && challengerConditionMet;
  const hasLost = hasOpponents && opponentConditionMet;
  const isFinalOutcome = hasOpponents && isResolveTimeAchieved;

  const creatorOutcomeText = isFinalOutcome
    ? hasWon
      ? "Won the bet!"
      : hasLost
        ? "Lost the bet"
        : "Tie at target"
    : hasWon
      ? "Leading now"
      : hasLost
        ? "Trailing now"
        : "Neck and neck";

  const opponentOutcomeText = isFinalOutcome
    ? hasLost
      ? "Won the bet!"
      : hasWon
        ? "Lost the bet"
        : "Tie at target"
    : hasLost
      ? "Leading now"
      : hasWon
        ? "Trailing now"
        : "Neck and neck";

  const resolutionMethod = String(challenge?.resolution_method || challenge?.resolution_source || "").toUpperCase();
  const isManualResolution = resolutionMethod !== "PRICE_FEED";
  const isResolutionPending = challenge?.status === "PENDING_RESOLUTION";
  const isResolutionResolved = challenge?.status === "RESOLVED";
  const isCancelled = challenge?.status === "CANCELLED";
  const isAccepted = isResolutionPending || isResolutionResolved || hasOpponents;

  const hasResolveTimePassed = Boolean(resolveTimestamp && resolveTimestamp <= currentTime);
  const showResolvesBox = !isExpireTimeAchieved || hasOpponents;
  const hideExpiresBox = !isTeam && hasOpponents;
  const timelineColumns = (!hideExpiresBox ? 1 : 0) + 2 + (showResolvesBox ? 1 : 0);

  // Countdown texts
  const endsInText = formatEndsByCountdown(resolveTimestamp, currentTime);
  const expiresInText = formatExpiryCountdown(expiryTimestamp, currentTime);
  const createdTimeText = formatCreatedTimeAgo(createdTimestamp, currentTime);
  const resolveDateByText = resolveTimestamp
    ? new Date(resolveTimestamp).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "";
  const resolveDayDateText = resolveTimestamp
    ? new Date(resolveTimestamp).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    : "Unknown date";

  const resolvesInText = hasResolveTimePassed
    ? isResolutionResolved
      ? "Completed"
      : "Resolving"
    : endsInText;
  const resolvesInSubtext = hasResolveTimePassed ? null : `(${resolveDayDateText})`;
  const expiresInTextForBox = isExpireTimeAchieved && !hasOpponents ? "Expired" : expiresInText;

  // Status label
  const statusLabel = isCancelled
    ? "Cancelled"
    : isResolutionResolved
      ? "Resolved"
      : isResolutionPending || hasResolveTimePassed
        ? "Resolving"
        : isAccepted
          ? "Live"
          : isExpireTimeAchieved
            ? "Expired"
            : "Open";

  const statusClassName = isCancelled
    ? "border-gray-300 bg-gray-100 text-gray-700"
    : isResolutionResolved
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : isResolutionPending || hasResolveTimePassed
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : isExpireTimeAchieved && !isAccepted
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[#b9dec9] bg-[#f1fbf5] text-[#246044]";

  // Description
  const challengeTicker = challenge?.ticker?.trim().toLowerCase() || "this asset";
  const challengeDescriptionText = isManualResolution
    ? `The challenger has a conviction, ${challengeStatement}. If you don't think so you can counter it and win $${betAmount} if you are right.`
    : `The challenger thinks ${challengeTicker} will ${isDirectionalBelow ? "fall below" : "rise above"} $${targetPrice.toLocaleString()} by the resolution time. If you think opposite you can counter it and win the total pool of $${betAmount} if you're right.`;

  const challengeDescriptionWords = challengeDescriptionText.trim().split(/\s+/).filter(Boolean);
  const isDescriptionTruncatable = challengeDescriptionWords.length > 7;
  const challengeDescriptionPreviewText = isDescriptionTruncatable
    ? `${challengeDescriptionWords.slice(0, 7).join(" ")}...`
    : challengeDescriptionText;
  const displayedDescriptionText =
    isDescriptionExpanded && isDescriptionTruncatable
      ? challengeDescriptionText
      : challengeDescriptionPreviewText;

  // CTA Button state
  const ctaBaseClassName =
    "w-full py-3.5 px-6 border-2 border-black font-black text-base flex items-center justify-center gap-2 uppercase tracking-[0.06em]";
  const activeCtaClassName =
    `${ctaBaseClassName} cursor-pointer bg-[#246044] hover:bg-[#2b7351] text-white shadow-[3px_3px_0_#111] hover:-translate-y-1 hover:shadow-[3px_3px_0_#111] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
  const activePvpCtaClassName =
    `${ctaBaseClassName} cursor-pointer bg-[#0c9d63] hover:bg-[#0a7d4f] text-white shadow-[3px_3px_0_#111] hover:-translate-y-1 hover:shadow-[3px_3px_0_#111] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
  const ongoingCtaClassName =
    `${ctaBaseClassName} cursor-not-allowed bg-[#09905a] text-white shadow-[2px_2px_0_#111]`;
  const expiredCtaClassName =
    `${ctaBaseClassName} bg-red-100 text-red-700 shadow-[2px_2px_0_#111] cursor-not-allowed`;
  const resolvingCtaClassName =
    `${ctaBaseClassName} bg-amber-100 text-amber-700 shadow-[2px_2px_0_#111] cursor-not-allowed`;
  const completedCtaClassName =
    `${ctaBaseClassName} bg-gray-200 text-gray-700 shadow-[2px_2px_0_#111] cursor-not-allowed`;

  const getCTAState = (): CTAState => {
    let ctaLabel = "";
    let ctaDisabled = false;
    let ctaClassName = "";

    if (isCancelled) {
      ctaLabel = "CANCELLED";
      ctaDisabled = true;
      ctaClassName = completedCtaClassName;
    } else if (!isTeam) {
      if (isResolveTimeAchieved && isResolutionResolved) {
        ctaLabel = "COMPLETED ✅";
        ctaDisabled = true;
        ctaClassName = completedCtaClassName;
      } else if (isExpireTimeAchieved && !hasOpponents) {
        ctaLabel = "EXPIRED!";
        ctaDisabled = true;
        ctaClassName = expiredCtaClassName;
      } else if (isResolveTimeAchieved && isResolutionPending) {
        ctaLabel = "RESOLVING ⌛";
        ctaDisabled = true;
        ctaClassName = resolvingCtaClassName;
      } else if (!isResolveTimeAchieved && hasOpponents) {
        ctaLabel = "ONGOING ⚔️";
        ctaDisabled = true;
        ctaClassName = ongoingCtaClassName;
      } else {
        ctaLabel = "Join Challenge ⚔️";
        ctaDisabled = isCreator;
        ctaClassName = activePvpCtaClassName;
      }
    } else {
      if (isResolveTimeAchieved && isResolutionResolved) {
        ctaLabel = "COMPLETED";
        ctaDisabled = true;
        ctaClassName = completedCtaClassName;
      } else if (isExpireTimeAchieved && !hasOpponents) {
        ctaLabel = "EXPIRED!";
        ctaDisabled = true;
        ctaClassName = expiredCtaClassName;
      } else if (isResolveTimeAchieved && isResolutionPending) {
        ctaLabel = "RESOLVING ⌛";
        ctaDisabled = true;
        ctaClassName = resolvingCtaClassName;
      } else if (!isExpireTimeAchieved) {
        ctaLabel = "JOIN CHALLENGE ⚔️";
        ctaDisabled = false;
        ctaClassName = activeCtaClassName;
      } else {
        ctaLabel = "ONGOING ⚔️";
        ctaDisabled = true;
        ctaClassName = ongoingCtaClassName;
      }
    }

    return {
      label: ctaLabel,
      disabled: ctaDisabled,
      className: ctaClassName,
      isOngoing: ctaLabel.startsWith("ONGOING"),
      showCreatorHint: isCreator && ctaLabel === "Join Challenge ⚔️",
    };
  };

  const ctaState = getCTAState();

  // Effects
  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const resetTimer = window.setTimeout(() => {
      setIsDescriptionExpanded(true);
      setIsTitleExpanded(true);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [isOpen, challenge?.id]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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

  // Handlers
  const handleCtaClick = useCallback((): boolean => {
    if (ctaState.disabled) return false;
    if (!isConnected) {
      open();
      return false;
    }
    return true;
  }, [ctaState.disabled, isConnected, open]);

  const handleShareChallenge = useCallback(async () => {
    if (!challenge) return;

    const shareUrl = `${window.location.origin}/challenges?challengeId=${encodeURIComponent(challenge.id)}`;
    const shareText = `Check out this challenge: ${stripUsdcQuote(challenge.statement)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: stripUsdcQuote(challenge.statement),
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
  }, [challenge]);

  const openProfile = useCallback((walletAddress: string | null | undefined) => {
    if (!walletAddress) return;
    router.push(`/profile/${walletAddress}`);
  }, [router]);

  return {
    // Refs
    modalRef,

    // State
    shareFeedback,
    isDescriptionExpanded,
    isTitleExpanded,

    // Setters
    setIsDescriptionExpanded,
    setIsTitleExpanded,

    // Derived values
    assetLogo,
    creatorName,
    creatorAvatar,
    creatorWalletAddress,
    creatorWalletShort,
    opponentName,
    opponentAvatar,
    opponentWalletAddress,
    hasOpponents,
    isTeam,
    betAmount,
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
    isExpireTimeAchieved,
    isResolveTimeAchieved,
    hasWon,
    hasLost,
    isFinalOutcome,
    creatorOutcomeText,
    opponentOutcomeText,
    isManualResolution,
    isResolutionPending,
    isResolutionResolved,
    showResolvesBox,
    hideExpiresBox,
    timelineColumns,
    createdTimeText,
    endsInText,
    resolvesInText,
    resolvesInSubtext,
    expiresInTextForBox,
    statusLabel,
    statusClassName,
    canToggleDescription: isDescriptionTruncatable,
    modeLabel: isTeam ? "Multi Mode" : "PvP Mode",
    totalPoolLabel: `$${Number(betAmount || 0).toLocaleString()}`,
    primaryTitle: displayedTitle + (!isManualResolution && isResolveTimeAchieved && resolveDateByText ? ` by ${resolveDateByText}` : ""),
    resolutionLabel: isManualResolution ? "Community resolution" : "Price feed resolution",
    descriptionToShow: displayedDescriptionText,

    // CTA
    ctaState,

    // Handlers
    handleCtaClick,
    handleShareChallenge,
    openProfile,
    onClose,
  };
}
