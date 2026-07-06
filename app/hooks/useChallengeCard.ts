import React from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Challenge, getChallengeById } from "@/app/lib/challenges-service/challenges";
import { createPosition } from "@/app/lib/positions-service/positions";
import { useUserStore } from "@/app/store/useUserStore";
import {
  buildAcceptChallengeTx,
  fetchChallenge,
  getRektoProgram,
  USDC_MINT,
  USDC_MULTIPLIER,
  getReadonlyConnection,
} from "@/app/lib/rektofun-program";

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
      exactCountdown: "0d 0h 0m 0s",
      timeLeftText: "Challenge ended",
      dayLabel: `${endedDay} (UTC)`,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

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
    exactCountdown: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    timeLeftText: `${days} day${days === 1 ? "" : "s"}, ${hours} hour${hours === 1 ? "" : "s"}, ${minutes} minute${minutes === 1 ? "" : "s"} left`,
    dayLabel: `${weekday}, ${fullDate} UTC`,
  };
}

export function useChallengeCard(challenge: Challenge) {
  const router = useRouter();
  const { user } = useUserStore();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isBetFormOpen, setIsBetFormOpen] = React.useState(false);
  const [betInput, setBetInput] = React.useState(String(challenge.initial_bet ?? ""));
  const [betError, setBetError] = React.useState("");
  const [joinSide, setJoinSide] = React.useState<"TEAM_A" | "TEAM_B">("TEAM_B");
  const [currentTime, setCurrentTime] = React.useState(() => Date.now());
  const [escrowAddress, setEscrowAddress] = React.useState<string | undefined>(undefined);
  const [usdcBalance, setUsdcBalance] = React.useState<number | null>(null);

  const connection = getReadonlyConnection();

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

  // Update current time every second so the exact countdown (with seconds) stays live
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  // Load the on-chain escrow address when the bet form opens
  React.useEffect(() => {
    if (!isBetFormOpen) return;

    let cancelled = false;
    const loadEscrowAddress = async () => {
      try {
        const details = await getChallengeById(challenge.id);
        if (cancelled) return;

        const onchain = (details.metadata as Record<string, unknown> | undefined)?.onchain as
          | { challenge_pda?: string }
          | undefined;
        setEscrowAddress(typeof onchain?.challenge_pda === "string" ? onchain.challenge_pda : undefined);
      } catch (error) {
        console.error("Failed to load fresh challenge details for modal:", error);
      }
    };

    loadEscrowAddress();
    return () => {
      cancelled = true;
    };
  }, [isBetFormOpen, challenge.id]);

  const handleClick = (callback?: (challenge: Challenge) => void) => (e: React.MouseEvent) => {
    e.stopPropagation();

    if (callback) {
      window.setTimeout(() => callback(challenge), 0);
    }
  };

  const openBetForm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBetInput(String(challenge.initial_bet ?? ""));
    setBetError("");
    setJoinSide(challenge.mode === "TEAM" ? "TEAM_A" : "TEAM_B");
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

  const handleJoinChallenge = async () => {
    if (!isConnected || !address || !walletProvider) {
      setBetError("Connect your Solana wallet before joining this challenge.");
      return;
    }

    if (!user?.id) {
      setBetError("Your user profile is not ready yet. Please try again.");
      return;
    }

    const parsedBetAmount = Number(betInput);

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

    try {
      setBetError("");
      setIsLoading(true);

      const challengeDetails = await getChallengeById(challenge.id);
      const onchainMeta = (challengeDetails.metadata as Record<string, unknown> | undefined)
        ?.onchain as { challenge_pda?: string; creator_wallet?: string } | undefined;

      const challengePdaStr = onchainMeta?.challenge_pda;
      const creatorWalletStr = onchainMeta?.creator_wallet;

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
      const challengerPubkey = new PublicKey(address);

      const walletAdapter = {
        publicKey: challengerPubkey,
        signTransaction: async (tx: Transaction) => (walletProvider as any).signTransaction(tx),
        signAllTransactions: async (txs: Transaction[]) =>
          (walletProvider as any).signAllTransactions(txs),
      };

      const program = getRektoProgram(walletAdapter);

      const onChainChallenge = await fetchChallenge(program, challengePDA);
      if (!onChainChallenge) {
        throw new Error("On-chain challenge account not found. It may have been cancelled or settled.");
      }
      if (Date.now() / 1000 >= onChainChallenge.expiresAt) {
        throw new Error("Challenge has already expired.");
      }
      if (challengerPubkey.equals(onChainChallenge.creator)) {
        throw new Error("You cannot accept your own challenge.");
      }

      const requiredBetUsdc = Number(onChainChallenge.betAmount) / USDC_MULTIPLIER;
      console.log("opponent data: ", {
        program,
        challengerPubkey,
        challengePDA,
        creatorPubkey
      });
      const tx = await buildAcceptChallengeTx(
        program,
        challengerPubkey,
        challengePDA,
        creatorPubkey,
        joinSide === "TEAM_A"
      );
      tx.feePayer = challengerPubkey;
      tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
      const signedTx = await walletAdapter.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      await createPosition({
        challenge_id: challenge.id,
        bet: requiredBetUsdc,
        side: joinSide,
        creator: user.id,
      });

      setIsBetFormOpen(false);
    } catch (error) {
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
    const shareText = `Check out this challenge: ${challenge.statement ?? ""}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: challenge.statement ?? "RektoFun challenge",
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
  const assetSymbol = challenge.ticker;
  const assetIcon = "/scribbles/btc.png";
  const assetName = challenge.trading_pair || assetSymbol;

  const isPvpMode = challenge.mode !== "TEAM";
  const isTeam = challenge.mode === "TEAM";

  const creator = challenge.creator;
  const isCreator = user?.id != null && user.id === creator;
  const creatorDetails = challenge.creator_details;
  const teamAHighestBet = challenge.bet_info?.highest_bet?.TEAM_A;
  const teamBHighestBet = challenge.bet_info?.highest_bet?.TEAM_B;

  const creatorDisplayName = teamAHighestBet?.username || creatorDetails?.username || "Creator";
  const creatorProfileImage = teamAHighestBet?.profile_image || creatorDetails?.profile_image || assetIcon;
  const creatorWalletAddress = teamAHighestBet?.pubkey || creatorDetails?.pubkey || "";

  // Opponent/team roster data comes from the challenge's bet_info.highest_bet.TEAM_B entry.
  const opponentInfo = teamBHighestBet ? { wallet_address: teamBHighestBet.pubkey } : null;
  const hasOpponentInfo = Boolean(teamBHighestBet);
  const opponentProfileImage = teamBHighestBet?.profile_image || assetIcon;
  const opponentDisplayName = teamBHighestBet?.username || "Opponent";

  const hasWon = false;
  const hasLost = false;

  const resolvedPoolAmount = challenge.pool_size || challenge.initial_bet || 0;

  const title = challenge.statement || `Bet on ${assetSymbol}`;
  const betCurrency = "USDC";
  const poolDisplay = `$${resolvedPoolAmount}`;

  const expiryTimestamp = parseDateValue(challenge.expiry);
  const timeRemaining = formatExpiryCountdown(expiryTimestamp, currentTime);
  const isExpiryUnderOneHour = Boolean(
    expiryTimestamp &&
    expiryTimestamp > currentTime &&
    expiryTimestamp - currentTime < 60 * 60 * 1000
  );

  const createdTimeText = formatCreatedTimeAgo(parseDateValue(challenge.created_at));
  const resolveTimestamp = parseDateValue(challenge.resolution_date);
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
  const isManualResolution = challenge.resolution_method !== "PRICE_FEED";
  const totalOpponents = Math.max((challenge.participants ?? 0) - 1, 0);
  const hasOpponents = hasOpponentInfo || totalOpponents > 0;
  const isExpireTimeAchieved = Boolean(expiryTimestamp && expiryTimestamp <= currentTime);
  const isResolveTimeAchieved = Boolean(resolveTimestamp && resolveTimestamp <= currentTime);
  const isResolutionPending = challenge.status === "PENDING_RESOLUTION";
  const isResolutionResolved = challenge.status === "RESOLVED";

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
        ctaLabel = "Join Challenge ⚔️";
        ctaDisabled = isLoading || isCreator;
        ctaClassName = activePvpCtaClassName;
      }
    } else if (isTeam) {
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
    const showCreatorHint = isCreator && ctaLabel === "Join Challenge";

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
    usdcBalance,
    escrowAddress,
    modalMinAcceptBet: undefined as number | undefined,
    modalMaxAcceptBet: undefined as number | undefined,

    // Setters
    setBetInput,
    setBetError,
    setJoinSide,

    // Handlers
    handleClick,
    openBetForm,
    closeBetForm,
    openProfile,
    handleJoinChallenge,
    handleShareChallenge,

    // Computed values
    creator,
    assetSymbol,
    assetIcon,
    assetName,
    creatorDisplayName,
    creatorProfileImage,
    creatorWalletAddress,
    opponentInfo,
    hasOpponentInfo,
    opponentProfileImage,
    opponentDisplayName,
    title,
    betCurrency,
    poolDisplay,
    expiryTimestamp,
    timeRemaining,
    isExpiryUnderOneHour,
    createdTimeText,
    challengeEndTimeText,
    resolveDateByText,
    endsByCountdown,
    exactCountdownDetails,
    isCreator,
    isPvpMode,
    isTeam,
    isManualResolution,
    totalOpponents,
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
  };
}
