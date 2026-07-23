import React from "react";
import { useRouter } from "next/navigation";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Challenge, getChallengeById, getChallengeCategoryImage, updateChallengeStatus } from "@/app/lib/challenges-service/challenges";
import { createPosition, getJoinedChallengeIds } from "@/app/lib/positions-service/positions";
import { useUserStore } from "@/app/store/useUserStore";
import {
  deriveClaimPDA,
  fetchChallenge,
  getRektoProgram,
  USDC_MULTIPLIER,
  getReadonlyConnection,
} from "@/app/lib/rektofun-program";
import { useTokenBalanceStore } from "@/app/store/useTokenBalanceStore";
import { stripUsdcQuote } from "@/app/lib/format-market-label";
import { getUserByWallet } from "@/app/lib/users-service/users";
import { announceChallengeUpdated } from "@/app/lib/realtime-events";
import { getChallengeLifecycle } from "@/app/lib/challenge-lifecycle";
import {
  getChallengeActionError,
  type ChallengeActionStage,
} from "@/app/lib/challenge-action-errors";

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

type ChallengeAction = "cancel" | "refund" | "winnings" | null;

const joinedChallengeRequests = new Map<number, Promise<Set<number>>>();

function loadJoinedChallengeIds(userId: number): Promise<Set<number>> {
  const pending = joinedChallengeRequests.get(userId);
  if (pending) return pending;
  const request = getJoinedChallengeIds(userId)
    .then((challengeIds) => new Set(challengeIds))
    .catch((error) => {
      joinedChallengeRequests.delete(userId);
      throw error;
    });
  joinedChallengeRequests.set(userId, request);
  return request;
}

type ProfileVerification = {
  isVerified: boolean;
  isModerator: boolean;
};

const verificationCache = new Map<string, ProfileVerification>();
const verificationRequests = new Map<string, Promise<ProfileVerification>>();

async function loadProfileVerification(walletAddress: string): Promise<ProfileVerification> {
  const key = walletAddress.trim().toLowerCase();
  const cached = verificationCache.get(key);
  if (cached) return cached;

  const pending = verificationRequests.get(key);
  if (pending) return pending;

  const request = getUserByWallet(walletAddress)
    .then((profile) => {
      const verification = {
        isVerified: Boolean(profile.twitter_username || profile.user_type === "moderator"),
        isModerator: profile.user_type === "moderator",
      };
      verificationCache.set(key, verification);
      return verification;
    })
    .finally(() => verificationRequests.delete(key));

  verificationRequests.set(key, request);
  return request;
}

function useProfileVerification(
  walletAddress: string,
  twitterUsername?: string | null,
  userType?: "user" | "moderator",
): ProfileVerification {
  const key = walletAddress.trim().toLowerCase();
  const isKnownModerator = userType === "moderator";
  const isKnownVerified = Boolean(twitterUsername || isKnownModerator);
  const hasKnownVerificationData = twitterUsername !== undefined || userType !== undefined;
  const cachedVerification = key ? verificationCache.get(key) : undefined;
  const [resolvedVerification, setResolvedVerification] = React.useState<
    (ProfileVerification & { key: string }) | null
  >(null);

  React.useEffect(() => {
    if (!walletAddress || hasKnownVerificationData || cachedVerification) return;
    let cancelled = false;
    loadProfileVerification(walletAddress)
      .then((verification) => {
        if (!cancelled) setResolvedVerification({ key, ...verification });
      })
      .catch(() => {
        if (!cancelled) setResolvedVerification({ key, isVerified: false, isModerator: false });
      });
    return () => {
      cancelled = true;
    };
  }, [cachedVerification, hasKnownVerificationData, key, walletAddress]);

  return (hasKnownVerificationData ? { isVerified: isKnownVerified, isModerator: isKnownModerator } : null)
    ?? cachedVerification
    ?? (resolvedVerification?.key === key ? resolvedVerification : null)
    ?? { isVerified: false, isModerator: false };
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

function parseResolutionDateValue(value: string | number | null | undefined): number | null {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseDateValue(`${value}T23:59:59.999Z`);
  }

  return parseDateValue(value);
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
  const { open } = useAppKit();
  const { walletProvider } = useAppKitProvider("solana");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isBetFormOpen, setIsBetFormOpen] = React.useState(false);
  const [betInput, setBetInput] = React.useState(String(challenge.initial_bet ?? ""));
  const [betError, setBetError] = React.useState("");
  const [joinSide, setJoinSide] = React.useState<"TEAM_A" | "TEAM_B">("TEAM_B");
  const [currentTime, setCurrentTime] = React.useState(() => Date.now());
  const [escrowAddress, setEscrowAddress] = React.useState<string | undefined>(undefined);
  const balanceWalletAddress = useTokenBalanceStore((state) => state.walletAddress);
  const storedUsdcBalance = useTokenBalanceStore((state) => state.usdcBalance);
  const loadBalances = useTokenBalanceStore((state) => state.loadBalances);
  const usdcBalance = balanceWalletAddress === address ? storedUsdcBalance : null;
  const [challengeAction, setChallengeAction] = React.useState<ChallengeAction>(null);
  const [pendingChallengeAction, setPendingChallengeAction] = React.useState<ChallengeAction>(null);
  const [actionError, setActionError] = React.useState("");
  const [locallyCancelled, setLocallyCancelled] = React.useState(false);
  const [claimedWinnings, setClaimedWinnings] = React.useState<number | null>(null);
  const creatorStakeMinimum = Math.max(Number(challenge.initial_bet) || 0, 1);
  const recordedOpponentStake = Number(challenge.bet_info?.team_count?.TEAM_B?.total_amount) || 0;
  const requiresCreatorStakeMatch = challenge.mode === "TEAM"
    && recordedOpponentStake < creatorStakeMinimum;
  const minimumAcceptBet = challenge.mode === "TEAM" && !requiresCreatorStakeMatch
    ? 1
    : creatorStakeMinimum;
  const joinedStatusKey = user?.id == null ? "" : `${user.id}:${challenge.id}`;
  const [joinedStatus, setJoinedStatus] = React.useState<{ key: string; joined: boolean } | null>(null);
  const hasJoinedChallenge = joinedStatus?.key === joinedStatusKey && joinedStatus.joined;
  const isJoinedStatusLoading = Boolean(joinedStatusKey && joinedStatus?.key !== joinedStatusKey);

  const connection = getReadonlyConnection();

  const signAndSendSponsoredAction = async (payload: {
    action: "accept" | "cancel" | "refund" | "winnings";
    participant: string;
    creator: string;
    challengePDA: string;
    joinCreatorSide?: boolean;
    amountMicroUsdc?: string;
    challengeId?: number;
  }, onStage?: (stage: ChallengeActionStage) => void) => {
    if (!walletProvider) throw new Error("Wallet is not ready.");
    onStage?.("prepare");
    const response = await fetch("/api/challenges/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json() as {
      error?: string;
      serializedTx?: string;
      blockhash?: string;
      lastValidBlockHeight?: number;
    };
    if (!response.ok || !data.serializedTx || !data.blockhash || data.lastValidBlockHeight == null) {
      throw new Error(data.error || "Failed to prepare transaction.");
    }

    const transaction = Transaction.from(Buffer.from(data.serializedTx, "base64"));
    onStage?.("sign");
    const signedTransaction = await (walletProvider as {
      signTransaction: (tx: Transaction) => Promise<Transaction>;
    }).signTransaction(transaction);
    onStage?.("submit");
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    onStage?.("confirm");
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: data.blockhash,
      lastValidBlockHeight: data.lastValidBlockHeight,
    }, "confirmed");
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    return signature;
  };

  // Update current time every second so the exact countdown (with seconds) stays live
  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (user?.id == null) return;

    let cancelled = false;
    loadJoinedChallengeIds(user.id)
      .then((challengeIds) => {
        if (!cancelled) setJoinedStatus({ key: joinedStatusKey, joined: challengeIds.has(challenge.id) });
      })
      .catch((error) => {
        console.error("Failed to determine joined challenges:", error);
        if (!cancelled) setJoinedStatus({ key: joinedStatusKey, joined: false });
      });

    return () => { cancelled = true; };
  }, [challenge.id, joinedStatusKey, user?.id]);

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
    if (isDirectJoinRestricted || isDeclinedDirectInvitation) return;
    if (hasJoinedChallenge || isJoinedStatusLoading) return;
    if (!isConnected || !address) {
      open();
      return;
    }
    setBetInput(String(challenge.initial_bet ?? ""));
    setBetError("");
    setJoinSide("TEAM_B");
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
    if (isDirectJoinRestricted || isDeclinedDirectInvitation) {
      setBetError(isDeclinedDirectInvitation
        ? "This invitation was declined."
        : "Only the challenged user can join this battle.");
      return;
    }
    if (hasJoinedChallenge) {
      setBetError("You have already joined this challenge.");
      return;
    }

    if (!isConnected || !address || !walletProvider) {
      setBetError("Your wallet is not connected or ready. Reconnect it, then try again.");
      return;
    }

    if (!user?.id) {
      setBetError("Your RektoFun profile is not ready. Finish setting up your profile, then try again.");
      return;
    }

    const parsedBetAmount = Number(betInput);

    if (!Number.isFinite(parsedBetAmount) || parsedBetAmount <= 0) {
      setBetError("Please enter a valid bet amount.");
      return;
    }

    if (parsedBetAmount < minimumAcceptBet) {
      setBetError(challenge.mode === "TEAM"
        ? `The opponent side must first match the creator's stake. Bet at least ${minimumAcceptBet} USDC.`
        : `Your bet must match or exceed the challenger's ${minimumAcceptBet} USDC stake.`);
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

    let joinStage: ChallengeActionStage = "validation";
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
      const signingProvider = walletProvider as {
        signTransaction: (transaction: Transaction) => Promise<Transaction>;
        signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      };

      const walletAdapter = {
        publicKey: challengerPubkey,
        signTransaction: async (tx: Transaction) => signingProvider.signTransaction(tx),
        signAllTransactions: async (txs: Transaction[]) =>
          signingProvider.signAllTransactions(txs),
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
      const isAlreadyOnCreatorTeam = onChainChallenge.creatorTeam.some((wallet) => wallet.equals(challengerPubkey));
      const isAlreadyOnOpponentTeam = onChainChallenge.opponentTeam.some((wallet) => wallet.equals(challengerPubkey));
      const isAlreadyPvpChallenger = !onChainChallenge.challenger.equals(PublicKey.default)
        && onChainChallenge.challenger.equals(challengerPubkey);
      if (isAlreadyOnCreatorTeam || isAlreadyOnOpponentTeam || isAlreadyPvpChallenger) {
        setJoinedStatus({ key: joinedStatusKey, joined: true });
        throw new Error("You have already joined this challenge.");
      }

      const depositMicroUsdc = BigInt(Math.round(parsedBetAmount * USDC_MULTIPLIER));
      await signAndSendSponsoredAction({
        action: "accept",
        challengeId: challenge.id,
        participant: challengerPubkey.toBase58(),
        creator: creatorPubkey.toBase58(),
        challengePDA: challengePDA.toBase58(),
        joinCreatorSide: joinSide === "TEAM_A",
        amountMicroUsdc: depositMicroUsdc.toString(),
      }, (stage) => { joinStage = stage; });

      joinStage = "save";
      await createPosition({
        challenge_id: challenge.id,
        bet: parsedBetAmount,
        side: joinSide,
        creator: user.id,
      });
      await loadBalances(address, true);
      void joinedChallengeRequests.get(user.id)?.then((ids) => ids.add(challenge.id));
      setJoinedStatus({ key: joinedStatusKey, joined: true });

      setIsBetFormOpen(false);
      announceChallengeUpdated({ challengeId: challenge.id, action: "joined" });
    } catch (error) {
      console.error("Failed to accept challenge:", error);
      setBetError(getChallengeActionError(error, "join", joinStage));
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
    const shareStatement = stripUsdcQuote(challenge.statement);
    const shareText = `Check out this challenge: ${shareStatement}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareStatement || "RektoFun challenge",
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
  const assetIcon = getChallengeCategoryImage(challenge);
  const assetName = stripUsdcQuote(challenge.trading_pair || assetSymbol);

  const isPvpMode = challenge.mode !== "TEAM";
  const isTeam = challenge.mode === "TEAM";

  const creator = challenge.creator;
  const isCreator = user?.id != null && user.id === creator;
  const isDirectJoinRestricted = challenge.visibility === "DIRECT"
    && user?.id !== challenge.challenged_user_id;
  const isDeclinedDirectInvitation = challenge.visibility === "DIRECT"
    && challenge.invitation_status === "DECLINED";
  const creatorDetails = challenge.creator_details;
  const teamAHighestBet = challenge.bet_info?.highest_bet?.TEAM_A;
  const teamBHighestBet = challenge.bet_info?.highest_bet?.TEAM_B;
  const teamACount = challenge.bet_info?.team_count?.TEAM_A;
  const teamBCount = challenge.bet_info?.team_count?.TEAM_B;
  const teamATotalBets = teamACount?.total_bets ?? 0;
  const teamATotalAmount = teamACount?.total_amount ?? 0;
  const teamBTotalBets = teamBCount?.total_bets ?? 0;
  const teamBTotalAmount = teamBCount?.total_amount ?? 0;

  const creatorDisplayName = teamAHighestBet?.username || creatorDetails?.username || "Creator";
  const creatorProfileImage = teamAHighestBet?.profile_image || creatorDetails?.profile_image || assetIcon;
  const creatorWalletAddress = teamAHighestBet?.pubkey || creatorDetails?.pubkey || "";

  // Opponent/team roster data comes from the challenge's bet_info.highest_bet.TEAM_B entry.
  const opponentInfo = teamBHighestBet ? { wallet_address: teamBHighestBet.pubkey } : null;
  const hasOpponentInfo = Boolean(teamBHighestBet);
  const opponentProfileImage = teamBHighestBet?.profile_image || assetIcon;
  const opponentDisplayName = teamBHighestBet?.username || "Opponent";
  const creatorVerification = useProfileVerification(
    creatorWalletAddress,
    teamAHighestBet ? teamAHighestBet.twitter_username : creatorDetails?.twitter_username,
    teamAHighestBet ? teamAHighestBet.user_type : creatorDetails?.user_type,
  );
  const opponentVerification = useProfileVerification(
    teamBHighestBet?.pubkey || "",
    teamBHighestBet?.twitter_username,
    teamBHighestBet?.user_type,
  );

  const totalPooledAmount = teamATotalAmount + teamBTotalAmount;
  const resolvedPoolAmount = totalPooledAmount > 0
    ? totalPooledAmount
    : (challenge.pool_size || challenge.initial_bet || 0);

  const title = stripUsdcQuote(challenge.statement) || `Bet on ${assetSymbol}`;
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
  const composerMetadata = challenge.metadata?.composer;
  const composerResolvesAt = typeof composerMetadata?.resolves_at === "string"
    ? composerMetadata.resolves_at
    : null;
  const resolveTimestamp = parseDateValue(composerResolvesAt)
    ?? parseDateValue(challenge.resolve_time)
    ?? parseResolutionDateValue(challenge.resolution_date);
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
  // These names describe the creator side's outcome and are also used to
  // decorate the two participant tiles. Only show a winner once the backend
  // has confirmed the result and both sides exist.
  const hasWon = hasOpponents && challenge.status === "RESOLVED" && challenge.result === "TEAM_A";
  const hasLost = hasOpponents && challenge.status === "RESOLVED" && challenge.result === "TEAM_B";
  const isExpireTimeAchieved = Boolean(expiryTimestamp && expiryTimestamp <= currentTime);
  const isResolveTimeAchieved = Boolean(resolveTimestamp && resolveTimestamp <= currentTime);
  const lifecycle = getChallengeLifecycle({
    status: locallyCancelled ? "CANCELLED" : challenge.status,
    onchainSettled: Boolean(challenge.metadata?.onchain?.settled_at),
    hasOpponents,
    expiryTimestamp,
    resolveTimestamp,
    now: currentTime,
  });
  // The backend resolves price-feed challenges immediately when their target
  // is hit. With no opponent, the on-chain challenge is still Open, so the
  // creator must use the cancel instruction to recover the escrowed stake.
  // Keep the transaction action as "cancel", but present this terminal case
  // as a refund instead of a voluntary cancellation.
  const isUncontestedResolved = !hasOpponents
    && String(challenge.status || "").toUpperCase() === "RESOLVED";
  const shouldPresentCancelAsRefund = isExpireTimeAchieved || isUncontestedResolved;

  React.useEffect(() => {
    if (!address || !walletProvider || !isConnected) {
      return;
    }

    const onchain = (challenge.metadata as Record<string, unknown> | undefined)?.onchain as
      | { challenge_pda?: string; creator_wallet?: string }
      | undefined;
    if (!onchain?.challenge_pda || !onchain.creator_wallet) {
      return;
    }
    const challengePdaAddress = onchain.challenge_pda;

    let cancelled = false;
    const loadAction = async () => {
      try {
        const participant = new PublicKey(address);
        const signer = walletProvider as {
          signTransaction: (transaction: Transaction) => Promise<Transaction>;
          signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
        };
        const program = getRektoProgram({
          publicKey: participant,
          signTransaction: signer.signTransaction.bind(signer),
          signAllTransactions: signer.signAllTransactions.bind(signer),
        });
        const challengePDA = new PublicKey(challengePdaAddress);
        const chainChallenge = await fetchChallenge(program, challengePDA);
        if (!chainChallenge || cancelled) return;

        const isChainCreator = chainChallenge.creator.equals(participant);
        const isCreatorTeamMember = chainChallenge.creatorTeam.some((wallet) => wallet.equals(participant));
        const isOpponentTeamMember = chainChallenge.opponentTeam.some((wallet) => wallet.equals(participant));
        const isPvpChallenger = !chainChallenge.challenger.equals(PublicKey.default)
          && chainChallenge.challenger.equals(participant);
        const hasChainOpponent = isPvpMode
          ? !chainChallenge.challenger.equals(PublicKey.default)
          : chainChallenge.opponentTeam.length > 0;

        if (isChainCreator && chainChallenge.status === "Open" && !hasChainOpponent) {
          setChallengeAction("cancel");
          return;
        }

        const [claimPDA] = deriveClaimPDA(challengePDA, participant);
        if (await connection.getAccountInfo(claimPDA)) {
          setChallengeAction(null);
          return;
        }

        if (chainChallenge.status === "Cancelled" && !isChainCreator
          && (isPvpChallenger || isCreatorTeamMember || isOpponentTeamMember)) {
          setChallengeAction("refund");
          return;
        }

        const isWinner = chainChallenge.winningSide === "CreatorTeam"
          ? isChainCreator || isCreatorTeamMember
          : chainChallenge.winningSide === "OpponentTeam" && isOpponentTeamMember;
        setChallengeAction(
          chainChallenge.status === "Settled" && chainChallenge.challengeType === "Team" && isWinner
            ? "winnings"
            : null
        );
      } catch (error) {
        console.error("Failed to determine challenge action:", error);
        if (!cancelled) setChallengeAction(null);
      }
    };
    void loadAction();
    return () => { cancelled = true; };
  }, [address, challenge.metadata, connection, isConnected, isPvpMode, walletProvider]);

  const availableChallengeAction = isConnected ? challengeAction : null;

  const handleChallengeAction = async (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!availableChallengeAction || !address || !walletProvider || isLoading) return;
    setActionError("");
    setPendingChallengeAction(availableChallengeAction);
  };

  const closeChallengeActionConfirmation = () => {
    if (!isLoading) setPendingChallengeAction(null);
  };

  const confirmChallengeAction = async () => {
    const actionToExecute = pendingChallengeAction;
    if (!actionToExecute || !address || !walletProvider || isLoading) return;

    try {
      setActionError("");
      setIsLoading(true);
      const details = await getChallengeById(challenge.id);
      const onchain = (details.metadata as Record<string, unknown> | undefined)?.onchain as
        | { challenge_pda?: string; creator_wallet?: string }
        | undefined;
      if (!onchain?.challenge_pda || !onchain.creator_wallet) throw new Error("Missing on-chain challenge details.");

      const participant = new PublicKey(address);
      const creatorPubkey = new PublicKey(onchain.creator_wallet);
      const challengePDA = new PublicKey(onchain.challenge_pda);
      const signer = walletProvider as {
        signTransaction: (transaction: Transaction) => Promise<Transaction>;
        signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      };
      const walletAdapter = {
        publicKey: participant,
        signTransaction: (tx: Transaction) => signer.signTransaction(tx),
        signAllTransactions: (txs: Transaction[]) => signer.signAllTransactions(txs),
      };
      const program = getRektoProgram(walletAdapter);
      let actionAmount: number | null = actionToExecute === "cancel" && shouldPresentCancelAsRefund
        ? Number(challenge.initial_bet) || 0
        : null;
      const chainChallenge = actionToExecute === "winnings" || actionToExecute === "refund"
        ? await fetchChallenge(program, challengePDA)
        : null;
      if (actionToExecute === "winnings") {
        if (!chainChallenge || chainChallenge.winningSideTotalAmount <= BigInt(0)) {
          throw new Error("Unable to calculate winnings.");
        }
        let participantStake = BigInt(0);
        if (chainChallenge.winningSide === "CreatorTeam") {
          if (chainChallenge.creator.equals(participant)) {
            participantStake = chainChallenge.betAmount;
          } else {
            const index = chainChallenge.creatorTeam.findIndex((wallet) => wallet.equals(participant));
            if (index >= 0) participantStake = chainChallenge.creatorTeamAmounts[index] ?? BigInt(0);
          }
        } else if (chainChallenge.winningSide === "OpponentTeam") {
          const index = chainChallenge.opponentTeam.findIndex((wallet) => wallet.equals(participant));
          if (index >= 0) participantStake = chainChallenge.opponentTeamAmounts[index] ?? BigInt(0);
        }
        const payoutMicroUsdc = participantStake * chainChallenge.settledNetPot
          / chainChallenge.winningSideTotalAmount;
        actionAmount = Number(payoutMicroUsdc) / USDC_MULTIPLIER;
      } else if (actionToExecute === "refund") {
        if (!chainChallenge) throw new Error("Unable to calculate refund.");
        let participantStake = BigInt(0);
        if (chainChallenge.creator.equals(participant)) {
          participantStake = chainChallenge.betAmount;
        } else {
          const creatorIndex = chainChallenge.creatorTeam.findIndex((wallet) => wallet.equals(participant));
          const opponentIndex = chainChallenge.opponentTeam.findIndex((wallet) => wallet.equals(participant));
          if (creatorIndex >= 0) participantStake = chainChallenge.creatorTeamAmounts[creatorIndex] ?? BigInt(0);
          if (opponentIndex >= 0) participantStake = chainChallenge.opponentTeamAmounts[opponentIndex] ?? BigInt(0);
        }
        actionAmount = Number(participantStake) / USDC_MULTIPLIER;
      }
      const signature = await signAndSendSponsoredAction({
        action: actionToExecute,
        participant: participant.toBase58(),
        creator: creatorPubkey.toBase58(),
        challengePDA: challengePDA.toBase58(),
      });
      if (actionToExecute === "cancel") {
        try {
          await updateChallengeStatus(challenge.id, "CANCELLED");
        } catch (syncError) {
          console.error("Challenge cancelled on-chain but backend status sync failed:", syncError);
        }
        setLocallyCancelled(true);
      }
      const recordsRefund = actionToExecute === "refund"
        || (actionToExecute === "cancel" && shouldPresentCancelAsRefund);
      if ((actionToExecute === "winnings" || recordsRefund) && user?.id && actionAmount !== null) {
        try {
          const { recordChallengeHistoryEvent } = await import("@/app/lib/challenges-service/challenges");
          await recordChallengeHistoryEvent(challenge, {
            id: signature,
            type: actionToExecute === "winnings" ? "redeemed" : "refunded",
            user_id: Number(user.id),
            amount: actionAmount,
            occurred_at: new Date().toISOString(),
            signature,
          });
        } catch (historyError) {
          console.error("On-chain action succeeded but history sync failed:", historyError);
        }
      }
      setChallengeAction(null);
      if (actionToExecute === "winnings" && actionAmount !== null) {
        setClaimedWinnings(actionAmount);
      }
      setPendingChallengeAction(null);
      announceChallengeUpdated({
        challengeId: challenge.id,
        action: actionToExecute === "cancel"
          ? "cancelled"
          : actionToExecute === "refund"
            ? "refunded"
            : "redeemed",
      });
      router.refresh();
    } catch (error) {
      console.error("Challenge action failed:", error);
      setActionError(error instanceof Error ? error.message : "Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // CTA Button logic
  const ctaBaseClassName =
    "w-full h-11 px-4 border-2 border-black font-black text-sm flex items-center justify-center gap-2 uppercase tracking-[0.06em]";
  const activeCtaClassName =
    `${ctaBaseClassName} cursor-pointer bg-[#246044] hover:bg-[#2b7351] text-white hover:-translate-y-1 hover:shadow-[3px_3px_0_#111] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
  const activePvpCtaClassName =
    `${ctaBaseClassName} cursor-pointer bg-[#0c9d63] opacity-90 hover:bg-[#0a7d4f] text-white hover:-translate-y-1 hover:shadow-[3px_3px_0_#111] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
  const destructiveCtaClassName =
    `${ctaBaseClassName} cursor-pointer bg-[#d94335] hover:bg-[#bd3025] text-white hover:-translate-y-1 hover:shadow-[3px_3px_0_#111] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
  const ongoingCtaClassName =
    `${ctaBaseClassName} cursor-not-allowed bg-[#008080] opacity-80 text-white hover:shadow-[2px_2px_0_#111]`;
  const expiredCtaClassName =
    `${ctaBaseClassName} bg-red-100 text-red-700 hover:shadow-[2px_2px_0_#111] cursor-not-allowed`;
  const resolvingCtaClassName =
    `${ctaBaseClassName} bg-amber-100 text-amber-700 hover:shadow-[2px_2px_0_#111] cursor-not-allowed`;
  const completedCtaClassName =
    `${ctaBaseClassName} bg-[#008080] opacity-80 text-white hover:shadow-[2px_2px_0_#111] cursor-not-allowed`;
  const cancelledCtaClassName =
    `${ctaBaseClassName} bg-gray-200 text-gray-700 hover:shadow-[2px_2px_0_#111] cursor-not-allowed`;

  const getCtaButtonState = (): CTAButtonState => {
    let ctaLabel = "";
    let ctaDisabled = false;
    let ctaClassName = "";

    if (availableChallengeAction) {
      ctaLabel = availableChallengeAction === "cancel"
        ? (shouldPresentCancelAsRefund ? "Claim refund" : "Cancel challenge")
        : availableChallengeAction === "refund" ? "Claim refund" : "Claim winnings";
      ctaDisabled = isLoading;
      ctaClassName = availableChallengeAction === "cancel" && !shouldPresentCancelAsRefund
        ? destructiveCtaClassName
        : activeCtaClassName;
    } else if (lifecycle === "CANCELLED") {
      ctaLabel = "Cancelled";
      ctaDisabled = true;
      ctaClassName = cancelledCtaClassName;
    } else if (lifecycle === "RESOLVED") {
      ctaLabel = "Completed";
      ctaDisabled = true;
      ctaClassName = completedCtaClassName;
    } else if (lifecycle === "RESOLVING") {
      ctaLabel = "Resolving";
      ctaDisabled = true;
      ctaClassName = resolvingCtaClassName;
    } else if (hasJoinedChallenge) {
      ctaLabel = "Already joined";
      ctaDisabled = true;
      ctaClassName = ongoingCtaClassName;
    } else if (isDirectJoinRestricted || isDeclinedDirectInvitation) {
      ctaLabel = isDeclinedDirectInvitation ? "Invitation declined" : "Invitation only";
      ctaDisabled = true;
      ctaClassName = cancelledCtaClassName;
    } else if (lifecycle === "LIVE") {
      if (isTeam && !isExpireTimeAchieved) {
        ctaLabel = "Join challenge";
        ctaDisabled = isLoading || isCreator || isJoinedStatusLoading;
        ctaClassName = activeCtaClassName;
      } else {
        ctaLabel = "Battle live";
        ctaDisabled = true;
        ctaClassName = ongoingCtaClassName;
      }
    } else if (lifecycle === "EXPIRED") {
      ctaLabel = "Expired";
      ctaDisabled = true;
      ctaClassName = expiredCtaClassName;
    } else {
      ctaLabel = "Join challenge";
      ctaDisabled = isLoading || isCreator || isJoinedStatusLoading;
      ctaClassName = isPvpMode ? activePvpCtaClassName : activeCtaClassName;
    }

    const isOngoing = lifecycle === "LIVE" && hasOpponents;
    const showCreatorHint = isCreator && ctaLabel === "Join challenge";

    return {
      label: ctaLabel,
      disabled: ctaDisabled,
      className: ctaClassName,
      isOngoing,
      showCreatorHint,
    };
  };

  const ctaState = getCtaButtonState();
  const isCancelledState = lifecycle === "CANCELLED";
  const isBattleOnState = lifecycle === "LIVE";
  const isResolvingState = lifecycle === "RESOLVING";
  const isCompletedState = lifecycle === "RESOLVED";
  const isExpiresInState = lifecycle === "OPEN";

  const expiryStatusText = isCancelledState
    ? "Challenge cancelled"
    : isCompletedState
    ? "Challenge completed"
    : isResolvingState
      ? "Challenge is resolving"
      : isBattleOnState
        ? "Battle ends in"
        : isExpireTimeAchieved && !hasOpponents
          ? "Challenge expired"
          : "Expires in";

  const expiryTooltipText = isCancelledState
    ? "This challenge was cancelled and is no longer accepting participants."
    : isCompletedState
    ? "This challenge has been resolved and marked completed."
    : isResolvingState
      ? "Resolve time has been reached and this challenge is currently resolving."
      : isBattleOnState
        ? `Max opponents have joined and the battle is live. It resolves in ${endsByCountdown}.`
        : isExpireTimeAchieved && !hasOpponents
          ? "Expire time was reached before anyone joined, so this challenge has expired."
          : `No opponents yet. This challenge will expire in ${timeRemaining} if nobody joins.`;

  return {
    // State
    isLoading,
    isBetFormOpen,
    betInput,
    betError,
    joinSide,
    usdcBalance,
    escrowAddress,
    modalMinAcceptBet: minimumAcceptBet,
    requiresCreatorStakeMatch,
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
    handleChallengeAction,
    confirmChallengeAction,
    closeChallengeActionConfirmation,

    // Computed values
    creator,
    assetSymbol,
    assetIcon,
    assetName,
    creatorDisplayName,
    creatorProfileImage,
    creatorWalletAddress,
    creatorIsVerified: creatorVerification.isVerified,
    creatorIsModerator: creatorVerification.isModerator,
    opponentInfo,
    hasOpponentInfo,
    opponentProfileImage,
    opponentDisplayName,
    opponentIsVerified: opponentVerification.isVerified,
    opponentIsModerator: opponentVerification.isModerator,
    teamATotalBets,
    teamATotalAmount,
    teamBTotalBets,
    teamBTotalAmount,
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
    hasJoinedChallenge,
    isPvpMode,
    isTeam,
    isManualResolution,
    totalOpponents,
    hasOpponents,
    isExpireTimeAchieved,
    isResolveTimeAchieved,
    shouldPresentCancelAsRefund,
    ctaState,
    challengeAction: availableChallengeAction,
    pendingChallengeAction,
    actionError,
    claimedWinnings,
    closeWinningsShare: () => setClaimedWinnings(null),
    isBattleOnState,
    isCancelledState,
    isResolvingState,
    isCompletedState,
    isExpiresInState,
    expiryStatusText,
    expiryTooltipText,
    hasWon,
    hasLost,
  };
}
