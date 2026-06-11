import React, { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
  ChallengeListItem,
  getChallengeById,
  joinChallenge,
} from "@/app/lib/challenges-service/challenges";
import { useUserStore } from "@/app/store/useUserStore";
import {
  buildAcceptChallengeTx,
  fetchChallenge,
  USDC_MINT,
  getReadonlyConnection,
} from "@/app/lib/rektofun-program";

// Helper types for metadata structure
interface AssetMetadata {
  symbol?: string;
  name?: string;
  icon?: string;
}

interface ModeMetadata {
  type?: "pvp" | "multi";
  display?: string;
}

interface LabelsMetadata {
  creator?: string;
  opponent?: string;
  yes?: string;
  no?: string;
}

interface ExactCountdownDetails {
  exactCountdown: string;
  timeLeftText: string;
  dayLabel: string;
}

interface CTAButtonState {
  label: string;
  disabled: boolean;
  className: string;
  isOngoing: boolean;
  showCreatorHint: boolean;
}

// Helper functions for date parsing and formatting
function parseDateValue(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (!value) return null;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function formatCreatedTimeAgo(timestamp: number | null): string {
  if (!timestamp) return "recently";

  const diff = Date.now() - timestamp;
  if (diff < 0) return "just now";

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (minutes > 0) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  return "just now";
}

function formatUtcDateTime(timestamp: number | null): string {
  if (!timestamp) return "an unknown time";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp)) + " UTC";
}

function formatEndsByCountdown(timestamp: number | null, nowMs: number): string {
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
}

function formatExpiryCountdown(timestamp: number | null, nowMs: number): string {
  if (!timestamp) return "N/A";
  const diffMs = timestamp - nowMs;
  if (diffMs <= 0) return "0m";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function truncateProfileName(name: string | null | undefined, maxLen = 6): string {
  const safeName = (name || "").trim();
  if (!safeName) return "User";
  if (safeName.length <= maxLen) return safeName;
  return `${safeName.slice(0, maxLen)}..`;
}

function formatWalletAddress(address: string | null | undefined): string {
  const safeAddress = (address || "").trim();
  if (!safeAddress) return "";
  if (safeAddress.length <= 12) return safeAddress;
  return `${safeAddress.slice(0, 4)}...${safeAddress.slice(-4)}`;
}

function formatExactCountdownDetails(
  timestamp: number | null,
  nowMs: number
): ExactCountdownDetails {
  if (!timestamp) {
    return {
      exactCountdown: "Unknown",
      timeLeftText: "Unknown time left",
      dayLabel: "Unknown day",
    };
  }

  const diffMs = timestamp - nowMs;
  if (diffMs <= 0) {
    const endedDate = new Date(timestamp);
    const endedDay = endedDate.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
    return {
      exactCountdown: "0d 0h 0m",
      timeLeftText: "Challenge ended",
      dayLabel: `${endedDay} (UTC)`,
    };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const endDate = new Date(timestamp);
  const weekday = endDate.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  const fullDate = endDate.toLocaleString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return {
    exactCountdown: `${days}d ${hours}h ${minutes}m`,
    timeLeftText: `${days} day${days === 1 ? "" : "s"}, ${hours} hour${hours === 1 ? "" : "s"}, ${minutes} minute${minutes === 1 ? "" : "s"} left`,
    dayLabel: `${weekday}, ${fullDate} UTC`,
  };
}

export function useChallengeCard(challenge: ChallengeListItem) {
  const router = useRouter();
  const { user } = useUserStore();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isBetFormOpen, setIsBetFormOpen] = React.useState(false);
  const [betInput, setBetInput] = React.useState(String(challenge.initial_bet ?? ""));
  const [betError, setBetError] = React.useState("");
  const [joinSide, setJoinSide] = React.useState<"challenger" | "opponent">("opponent");
  const [currentTime, setCurrentTime] = React.useState(() => Date.now());
  const [modalMinAcceptBet, setModalMinAcceptBet] = React.useState<number | undefined>(
    challenge.min_accept_bet
  );
  const [modalMaxAcceptBet, setModalMaxAcceptBet] = React.useState<number | undefined>(
    challenge.max_accept_bet
  );
  const [escrowAddress, setEscrowAddress] = React.useState<string | undefined>(undefined);
  const [usdcBalance, setUsdcBalance] = React.useState<number | null>(null);

  const connection = getReadonlyConnection();
  const creator = challenge.creator ?? {
    username: "",
    profile_image: "",
    wallet_address: "",
  };

  // Fetch USDC balance
  React.useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !isConnected) {
        setUsdcBalance(null);
        return;
      }

      try {
        const pubKey = new PublicKey(address);
        const ata = await getAssociatedTokenAddress(USDC_MINT, pubKey, false);
        const accountInfo = await connection.getTokenAccountBalance(ata);
        setUsdcBalance(accountInfo.value.uiAmount || 0);
      } catch {
        setUsdcBalance(0);
      }
    };

    fetchBalance();
  }, [address, isConnected, connection]);

  // Update current time every minute
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  // Load challenge modal data when bet form opens
  React.useEffect(() => {
    if (!isBetFormOpen) return;

    let cancelled = false;
    const loadChallengeModalData = async () => {
      try {
        const details = await getChallengeById(challenge.id);
        if (cancelled) return;

        setModalMinAcceptBet(
          typeof details.min_accept_bet === "number"
            ? details.min_accept_bet
            : challenge.min_accept_bet
        );
        setModalMaxAcceptBet(
          typeof details.max_accept_bet === "number"
            ? details.max_accept_bet
            : challenge.max_accept_bet
        );

        const metadata = (details.metadata as Record<string, unknown> | undefined) ?? {};
        const onchain = (metadata.onchain as Record<string, unknown> | undefined) ?? {};
        const maybeChallengePda = metadata.challenge_pda ?? onchain.challenge_pda;
        setEscrowAddress(typeof maybeChallengePda === "string" ? maybeChallengePda : undefined);
      } catch (error) {
        console.error("Failed to load fresh challenge details for modal:", error);
      }
    };

    loadChallengeModalData();
    return () => {
      cancelled = true;
    };
  }, [isBetFormOpen, challenge.id, challenge.min_accept_bet, challenge.max_accept_bet]);

  const handleClick = (callback?: (challenge: ChallengeListItem) => void) => (e: React.MouseEvent) => {
    e.stopPropagation();

    if (callback) {
      window.setTimeout(() => callback(challenge), 0);
    }
  };

  const openBetForm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBetInput(String(challenge.initial_bet ?? ""));
    setBetError("");
    setJoinSide(challenge.mode === "pool" ? "challenger" : "opponent");
    setModalMinAcceptBet(challenge.min_accept_bet);
    setModalMaxAcceptBet(challenge.max_accept_bet);
    setEscrowAddress(undefined);
    setIsBetFormOpen(true);
  };

  const closeBetForm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isLoading) return;
    setBetError("");
    setIsBetFormOpen(false);
  };

  const openProfile = (e: React.MouseEvent, walletAddress: string | null | undefined) => {
    e.preventDefault();
    e.stopPropagation();
    if (!walletAddress) return;
    router.push(`/profile/${walletAddress}`);
  };

  const handleJoinChallenge = async (e: React.SubmitEvent<HTMLFormElement>, onRekt?: (challenge: ChallengeListItem) => void) => {

      e.preventDefault();
      e.stopPropagation();

      if (!isConnected || !address) {
        setBetError("Connect your wallet to join this challenge.");
        return;
      }

      if (!walletProvider) {
        setBetError("Wallet provider not available.");
        return;
      }

      if (!user?.id) {
        setBetError("Your user profile is not ready yet. Please try again.");
        return;
      }

      const parsedBetAmount = Number(betInput);
      const minAcceptBet = modalMinAcceptBet;
      const maxAcceptBet = modalMaxAcceptBet;
      const betCurrency = "USDC";

      if (!Number.isFinite(parsedBetAmount) || parsedBetAmount <= 0) {
        setBetError("Please enter a valid bet amount.");
        return;
      }

      if (
        typeof usdcBalance === "number" &&
        Number.isFinite(usdcBalance) &&
        parsedBetAmount > usdcBalance
      ) {
        setBetError("Not enough balance.");
        return;
      }

      if (typeof minAcceptBet === "number" && parsedBetAmount < minAcceptBet) {
        setBetError(`Bet amount must be at least ${minAcceptBet} ${betCurrency}.`);
        return;
      }

      if (typeof maxAcceptBet === "number" && parsedBetAmount > maxAcceptBet) {
        setBetError(`Bet amount must be at most ${maxAcceptBet} ${betCurrency}.`);
        return;
      }

      try {
        setBetError("");
        setIsLoading(true);

        const challengeDetails = await getChallengeById(challenge.id);

        const onchainMeta =
          (challengeDetails.metadata as Record<string, unknown> | undefined)?.onchain as
            | {
                challenge_pda?: string;
                creator_wallet?: string;
              }
            | undefined;

        const challengePdaStr = onchainMeta?.challenge_pda;
        const creatorWalletStr = onchainMeta?.creator_wallet ?? creator.wallet_address;

        if (!challengePdaStr) {
          throw new Error(
            "This challenge has no on-chain reference yet. Please ask the creator to recreate it."
          );
        }
        if (!creatorWalletStr) {
          throw new Error("Creator wallet is missing for this challenge.");
        }

        const challengePDA = new PublicKey(challengePdaStr);
        const creatorPubkey = new PublicKey(creatorWalletStr);
        const userPubkey = new PublicKey(address);

        const program = (walletProvider as any).program;
        if (!program) {
          throw new Error("Anchor program not available. Please reconnect your wallet.");
        }

        const onChainChallenge = await fetchChallenge(program, challengePDA);
        if (!onChainChallenge) {
          throw new Error(
            "On-chain challenge account not found. It may have been cancelled or settled."
          );
        }
        if (Date.now() / 1000 >= onChainChallenge.expiresAt) {
          throw new Error("Challenge has already expired.");
        }
        if (userPubkey.equals(onChainChallenge.creator)) {
          throw new Error("You cannot accept your own challenge.");
        }

        const tx = await buildAcceptChallengeTx(program, userPubkey, challengePDA, creatorPubkey);

        tx.feePayer = userPubkey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signedTx = await (walletProvider as any).signAndSendTransaction(tx);

        await joinChallenge({
          challenge_id: challenge.id,
          user_id: user.id,
          side: challenge.mode === "pool" ? joinSide : "opponent",
          bet_amount: parsedBetAmount,
        });

        setIsBetFormOpen(false);
        if (onRekt) onRekt(challenge);
      } catch (error) {
        console.error("Failed to join challenge:", error);
        const message =
          error instanceof Error ? error.message : "Failed to join challenge. Please try again.";
        setBetError(message);
        alert(message);
      } finally {
        setIsLoading(false);
      }
  };

  const handleShareChallenge = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/challenges?challengeId=${encodeURIComponent(
      challenge.id
    )}`;
    const shareText = `Check out this challenge: ${challenge.title}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: challenge.title,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // no-op
      }
    }
  };

  // Computed values
  const market = challenge.market ?? null;
  const assetMeta: AssetMetadata = {
    symbol: market?.name,
    name: market?.name,
    icon: market?.icon,
  };
  const modeMeta: ModeMetadata = {
    type: challenge.mode === "pool" ? "multi" : "pvp",
    display: challenge.mode === "pool" ? "Pool Mode" : "PVP Mode",
  };
  const labelsMeta: LabelsMetadata = {
    creator: creator.username,
  };

  const resolvedPoolAmount = (() => {
    const totalPoolValue = Number(challenge.total_pool ?? 0);
    if (Number.isFinite(totalPoolValue) && totalPoolValue > 0) {
      return totalPoolValue;
    }
    const fallbackValue = Number(challenge.initial_bet ?? 0);
    if (Number.isFinite(fallbackValue) && fallbackValue > 0) {
      return fallbackValue;
    }
    return 0;
  })();

  const challengeMode: "pvp" | "multi" = modeMeta.type || "pvp";
  const hasWon =
    challenge.status === "resolved" &&
    challenge.result &&
    (challenge.result as Record<string, unknown>).winner === "current_user_id";
  const hasLost =
    challenge.status === "resolved" &&
    challenge.result &&
    (challenge.result as Record<string, unknown>).winner !== "current_user_id";

  const assetSymbol = assetMeta.symbol || assetMeta.name || "BTC";
  const assetIcon = assetMeta.icon || "/scribbles/btc.png";
  const assetName = assetMeta.name || assetSymbol;
  const creatorName = labelsMeta.creator || creator.username || "Creator";
  const creatorDisplayName = truncateProfileName(creatorName, 10);
  const creatorWalletDisplay = formatWalletAddress(creator.wallet_address);
  const creatorProfileImage = creator.profile_image || assetIcon;
  const opponentInfo = challenge.opponent_info ?? null;
  const hasOpponentInfo = Boolean(opponentInfo?.username || opponentInfo?.wallet_address);
  const opponentProfileImage = opponentInfo?.profile_image || assetIcon;
  const opponentDisplayName = opponentInfo?.username || "Opponent";
  const opponentWalletDisplay = formatWalletAddress(opponentInfo?.wallet_address);

  const title = challenge.title || `Bet on ${assetSymbol}`;
  const betAmount = challenge.initial_bet || 0;
  const betCurrency = "USDC";
  const poolDisplay = `$${resolvedPoolAmount}` || "$0 USDC";

  const expiryTimestamp = parseDateValue(challenge.expire_time);
  const timeRemaining = formatExpiryCountdown(expiryTimestamp, currentTime);
  const isExpiryUnderOneHour = Boolean(
    expiryTimestamp &&
    expiryTimestamp > currentTime &&
    expiryTimestamp - currentTime < 60 * 60 * 1000
  );

  const createdTimeText = formatCreatedTimeAgo(parseDateValue(challenge.created_at));
  const resolveTimestamp = parseDateValue(challenge.resolve_time);
  const challengeEndTimeText = formatUtcDateTime(resolveTimestamp);
  const resolveDateByText = resolveTimestamp
    ? new Date(resolveTimestamp).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const endsByCountdown = formatEndsByCountdown(resolveTimestamp, currentTime);
  const exactCountdownDetails = formatExactCountdownDetails(resolveTimestamp, currentTime);
  const isCreator = user?.wallet_address === creator.wallet_address;
  const isPvpMode = challenge.mode !== "pool";
  const isPoolMode = challenge.mode === "pool";
  const isManualResolution = String(challenge.resolution_source ?? "").toLowerCase() === "manual";
  const totalOpponents = Number(challenge.total_opponents ?? 0);
  const hasOpponents = totalOpponents > 0;
  const isExpireTimeAchieved = Boolean(expiryTimestamp && expiryTimestamp <= currentTime);
  const isResolveTimeAchieved = Boolean(resolveTimestamp && resolveTimestamp <= currentTime);

  const challengeWithResolution = challenge as ChallengeListItem & {
    resolving_status?: string;
    resolution_status?: string;
  };
  const resolutionStatusRaw = String(
    challengeWithResolution.resolving_status ??
      challengeWithResolution.resolution_status ??
      ""
  ).toLowerCase();
  const isResolutionPending = resolutionStatusRaw === "pending";
  const isResolutionResolved = resolutionStatusRaw === "resolved" || challenge.status === "resolved";

  // CTA Button logic
  const ctaBaseClassName =
    "w-full h-11 px-4 border-2 border-black font-black text-sm flex items-center justify-center gap-2 uppercase tracking-[0.06em]";
  const activeCtaClassName =
    `${ctaBaseClassName} cursor-pointer bg-[#246044] hover:bg-[#2b7351] text-white hover:-translate-y-1 hover:shadow-[3px_3px_0_#111] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
  const activePvpCtaClassName =
    `${ctaBaseClassName} cursor-pointer bg-[#0c9d63] opacity-90 hover:bg-[#0a7d4f] text-white hover:-translate-y-1 hover:shadow-[3px_3px_0_#111] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
  const ongoingCtaClassName =
    `${ctaBaseClassName} cursor-not-allowed bg-[#008080] opacity-80 text-white hover:shadow-[2px_2px_0_#111]`;
  const expiredCtaClassName =
    `${ctaBaseClassName} bg-red-100 text-red-700 hover:shadow-[2px_2px_0_#111] cursor-not-allowed`;
  const resolvingCtaClassName =
    `${ctaBaseClassName} bg-amber-100 text-amber-700 hover:shadow-[2px_2px_0_#111] cursor-not-allowed`;
  const completedCtaClassName =
    `${ctaBaseClassName} bg-gray-200 text-gray-700 hover:shadow-[2px_2px_0_#111] cursor-not-allowed`;

  const getCtaButtonState = (): CTAButtonState => {
    let ctaLabel = "";
    let ctaDisabled = false;
    let ctaClassName = "";

    if (isPvpMode) {
      if (isResolveTimeAchieved && hasOpponents && isResolutionResolved) {
        ctaLabel = "COMPLETED ✅";
        ctaDisabled = true;
        ctaClassName = completedCtaClassName;
      } else if (isResolveTimeAchieved && hasOpponents && isResolutionPending) {
        ctaLabel = "RESOLVING ⌛";
        ctaDisabled = true;
        ctaClassName = resolvingCtaClassName;
      } else if (!isResolveTimeAchieved && hasOpponents) {
        ctaLabel = "ONGOING ⚔️";
        ctaDisabled = true;
        ctaClassName = ongoingCtaClassName;
      } else if (isExpireTimeAchieved && !hasOpponents) {
        ctaLabel = "EXPIRED!";
        ctaDisabled = true;
        ctaClassName = expiredCtaClassName;
      } else {
        ctaLabel = "COUNTER ⚔️";
        ctaDisabled = isLoading || isCreator;
        ctaClassName = activePvpCtaClassName;
      }
    } else if (isPoolMode) {
      if (isResolveTimeAchieved && hasOpponents && isResolutionResolved) {
        ctaLabel = "COMPLETED ✅";
        ctaDisabled = true;
        ctaClassName = completedCtaClassName;
      } else if (isResolveTimeAchieved && hasOpponents && isResolutionPending) {
        ctaLabel = "RESOLVING ⌛";
        ctaDisabled = true;
        ctaClassName = resolvingCtaClassName;
      } else if (isExpireTimeAchieved && !hasOpponents) {
        ctaLabel = "EXPIRED";
        ctaDisabled = true;
        ctaClassName = expiredCtaClassName;
      } else if (!isExpireTimeAchieved) {
        ctaLabel = "JOIN CHALLENGE ⚔️";
        ctaDisabled = isLoading;
        ctaClassName = activeCtaClassName;
      } else {
        ctaLabel = "ONGOING ⚔️";
        ctaDisabled = true;
        ctaClassName = ongoingCtaClassName;
      }
    }

    const isOngoing = ctaLabel.startsWith("ONGOING");
    const showCreatorHint = isCreator && ctaLabel === "COUNTER";

    return {
      label: ctaLabel,
      disabled: ctaDisabled,
      className: ctaClassName,
      isOngoing,
      showCreatorHint,
    };
  };

  const ctaState = getCtaButtonState();
  const isBattleOnState = !isResolveTimeAchieved && hasOpponents;
  const isResolvingState = isResolveTimeAchieved && hasOpponents && isResolutionPending;
  const isCompletedState = isResolveTimeAchieved && hasOpponents && isResolutionResolved;
  const isExpiresInState = !isExpireTimeAchieved && !hasOpponents;

  const expiryStatusText = isCompletedState
    ? "Challenge completed"
    : isResolvingState
      ? "Challenge is resolving"
      : isBattleOnState
        ? "The battle is on"
        : isExpireTimeAchieved && !hasOpponents
          ? "Challenge expired"
          : "Expires in";

  const expiryTooltipText = isCompletedState
    ? "this challenge has been resolved and marked completed."
    : isResolvingState
      ? "resolve time has been reached and this challenge is currently resolving."
      : isBattleOnState
        ? `max opponents have joined and the battle is live. It resolves in ${endsByCountdown}.`
        : isExpireTimeAchieved && !hasOpponents
          ? "expire time was reached before anyone joined, so this challenge has expired."
          : `no opponents yet. This challenge will expire in ${timeRemaining} if nobody joins.`;

  return {
    // State
    isLoading,
    isBetFormOpen,
    betInput,
    betError,
    joinSide,
    currentTime,
    modalMinAcceptBet,
    modalMaxAcceptBet,
    escrowAddress,
    usdcBalance,

    // Setters
    setIsLoading,
    setIsBetFormOpen,
    setBetInput,
    setBetError,
    setJoinSide,
    setCurrentTime,
    setModalMinAcceptBet,
    setModalMaxAcceptBet,
    setEscrowAddress,
    setUsdcBalance,

    // Handlers
    handleClick,
    openBetForm,
    closeBetForm,
    openProfile,
    handleJoinChallenge,
    handleShareChallenge,

    // Computed values
    creator,
    market,
    assetMeta,
    modeMeta,
    labelsMeta,
    resolvedPoolAmount,
    challengeMode,
    hasWon,
    hasLost,
    assetSymbol,
    assetIcon,
    assetName,
    creatorName,
    creatorDisplayName,
    creatorWalletDisplay,
    creatorProfileImage,
    opponentInfo,
    hasOpponentInfo,
    opponentProfileImage,
    opponentDisplayName,
    opponentWalletDisplay,
    title,
    betAmount,
    betCurrency,
    poolDisplay,
    expiryTimestamp,
    timeRemaining,
    isExpiryUnderOneHour,
    createdTimeText,
    resolveTimestamp,
    challengeEndTimeText,
    resolveDateByText,
    endsByCountdown,
    exactCountdownDetails,
    isCreator,
    isPvpMode,
    isPoolMode,
    isManualResolution,
    totalOpponents,
    hasOpponents,
    isExpireTimeAchieved,
    isResolveTimeAchieved,
    isResolutionPending,
    isResolutionResolved,
    ctaState,
    isBattleOnState,
    isResolvingState,
    isCompletedState,
    isExpiresInState,
    expiryStatusText,
    expiryTooltipText,
  };
}
