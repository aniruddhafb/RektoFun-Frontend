import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PublicKey, Transaction } from "@solana/web3.js";
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
  getRektoProgram,
} from "@/app/lib/rektofun-program";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

// Types
interface CountdownDetails {
  exactCountdown: string;
  timeLeftText: string;
  dayLabel: string;
}

interface CTAState {
  label: string;
  disabled: boolean;
  className: string;
  isOngoing: boolean;
  showCreatorHint: boolean;
}

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

const formatExactCountdownDetails = (timestamp: number | null, nowMs: number): CountdownDetails => {
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
    const endedDay = endedDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
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
  const weekday = endDate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
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
};

export function useChallengeDetail(challenge: ChallengeListItem | null, isOpen: boolean, onClose: () => void) {
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useUserStore();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("solana");
  const { open } = useAppKit();

  useBodyScrollLock(isOpen);

  // State
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [liveSolPrice, setLiveSolPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBetFormOpen, setIsBetFormOpen] = useState(false);
  const [betInput, setBetInput] = useState("");
  const [betError, setBetError] = useState("");
  const [joinSide, setJoinSide] = useState<"challenger" | "opponent">("opponent");
  const [modalMinAcceptBet, setModalMinAcceptBet] = useState<number | undefined>(undefined);
  const [modalMaxAcceptBet, setModalMaxAcceptBet] = useState<number | undefined>(undefined);
  const [escrowAddress, setEscrowAddress] = useState<string | undefined>(undefined);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [isTitleExpanded, setIsTitleExpanded] = useState(true);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  // Derived values
  const betCurrency = "USDC";
  const asset = challenge?.market?.name || "Market";
  const assetLogo = challenge?.market?.icon || "/scribbles/btc.png";
  const creatorName = challenge?.creator?.username || "Creator";
  const creatorAvatar = challenge?.creator?.profile_image || assetLogo;
  const hasOpponentInfo = Boolean(challenge?.opponent_info?.username || challenge?.opponent_info?.wallet_address);
  const isAccepted =
    challenge?.status === "locked" ||
    challenge?.status === "resolved" ||
    hasOpponentInfo;
  const opponentDisplayName = challenge?.opponent_info?.username || "Opponent";
  const opponentAvatar = challenge?.opponent_info?.profile_image || assetLogo;
  const isPoolMode = challenge?.mode === "pool";
  const betAmount = challenge?.initial_bet ?? 0;
  const createdTimestamp = challenge?.created_at ? new Date(challenge.created_at).getTime() : null;
  const expiryTimestamp = challenge?.expire_time ? new Date(challenge.expire_time).getTime() : null;
  const resolveTimestamp = challenge?.resolve_time ? new Date(challenge.resolve_time).getTime() : null;
  const creatorWalletAddress = challenge?.creator?.wallet_address || "";
  const creatorWalletShort = creatorWalletAddress
    ? `${creatorWalletAddress.slice(0, 6)}...${creatorWalletAddress.slice(-4)}`
    : "Unknown wallet";

  // Title expansion
  const titleWords = (challenge?.title || "").trim().split(/\s+/).filter(Boolean);
  const canExpandTitle = titleWords.length > 6;
  const displayedTitle = isTitleExpanded || !canExpandTitle
    ? challenge?.title || ""
    : `${titleWords.slice(0, 6).join(" ")}...`;

  // Price calculations
  const startPrice = betAmount;
  const targetPrice = challenge?.target_price ?? challenge?.total_pool ?? betAmount;
  const currentPrice = liveSolPrice ?? challenge?.total_pool ?? 0;
  const priceChange = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
  const titleLower = (challenge?.title || "").toLowerCase();
  const isBelowChallenge = titleLower.includes("below");
  const isAboveChallenge = titleLower.includes("above");
  const isDirectionalBelow = isBelowChallenge && !isAboveChallenge;

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
  const isCreator = user?.wallet_address === creatorWalletAddress;
  const hasOpponents = Number(challenge?.total_opponents ?? 0) > 0 || hasOpponentInfo;
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

  const isManualResolution = String(challenge?.resolution_source ?? "").toLowerCase() === "manual";
  const challengeWithResolution = challenge as ChallengeListItem & {
    resolving_status?: string;
    resolution_status?: string;
  };
  const resolutionStatusRaw = String(
    challengeWithResolution?.resolving_status ?? challengeWithResolution?.resolution_status ?? ""
  ).toLowerCase();
  const isResolutionPending = resolutionStatusRaw === "pending";
  const isResolutionResolved = resolutionStatusRaw === "resolved";

  const hasResolveTimePassed = Boolean(resolveTimestamp && resolveTimestamp <= currentTime);
  const showResolvesBox = !isExpireTimeAchieved || hasOpponents;
  const hideExpiresBox = !isPoolMode && hasOpponentInfo;
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

  const exactCountdownDetails = formatExactCountdownDetails(resolveTimestamp, currentTime);
  const resolvesInText = hasResolveTimePassed
    ? isResolutionResolved
      ? "Completed"
      : isResolutionPending
        ? "Resolving"
        : "Resolving"
    : endsInText;
  const resolvesInSubtext = hasResolveTimePassed ? null : `(${resolveDayDateText})`;
  const expiresInTextForBox = isExpireTimeAchieved && !hasOpponents ? "Expired" : expiresInText;

  // Status label
  const statusLabel = isResolutionResolved
    ? "Resolved"
    : isResolutionPending || hasResolveTimePassed
      ? "Resolving"
      : isAccepted
        ? "Live"
        : isExpireTimeAchieved
          ? "Expired"
          : "Open";

  const statusClassName = isResolutionResolved
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : isResolutionPending || hasResolveTimePassed
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : isExpireTimeAchieved && !isAccepted
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-[#b9dec9] bg-[#f1fbf5] text-[#246044]";

  // Description
  const challengeTicker = challenge?.market?.name?.trim().toLowerCase() || "this asset";
  const challengeDescriptionText = isManualResolution
    ? `The challenger has a conviction, ${challenge?.title}. If you don't think so you can counter it and win $${betAmount} if you are right.`
    : `The challenger thinks ${challengeTicker} will ${isBelowChallenge ? "fall below" : isAboveChallenge ? "rise above" : "hit"} $${targetPrice.toLocaleString()} by the resolution time. If you think opposite you can counter it and win the total pool of $${betAmount} if you're right.`;

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

    if (!isPoolMode) {
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
        ctaLabel = "COUNTER ⚔️";
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
      showCreatorHint: isCreator && ctaLabel === "COUNTER ⚔️",
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
      if (isBetFormOpen) {
        setIsBetFormOpen(false);
        setBetError("");
        return;
      }
      onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isBetFormOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isBetFormOpen) return;
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, isBetFormOpen]);

  useEffect(() => {
    if (!isOpen || !challenge?.market?.description) return;

    let isMounted = true;
    const marketDescription = encodeURIComponent(challenge.market.description.trim() || "Solana");

    const fetchSolPrice = async () => {
      try {
        const response = await fetch(
          `https://api.diadata.org/v1/assetQuotation/${marketDescription}/0x0000000000000000000000000000000000000000`,
          { cache: "no-store" }
        );
        if (!response.ok) return;

        const data = await response.json();
        const rawPrice =
          data?.price ?? data?.Price ?? data?.quotation ?? data?.value ?? null;
        const parsedPrice =
          typeof rawPrice === "number" ? rawPrice : typeof rawPrice === "string" ? Number(rawPrice) : NaN;

        if (isMounted && Number.isFinite(parsedPrice) && parsedPrice > 0) {
          setLiveSolPrice(parsedPrice);
        }
      } catch {
        // Keep previous value on transient network/API errors
      }
    };

    fetchSolPrice();
    const interval = window.setInterval(fetchSolPrice, 180000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [isOpen, challenge?.market?.description]);

  useEffect(() => {
    if (!isBetFormOpen || !challenge) return;

    let cancelled = false;
    const loadChallengeModalData = async () => {
      try {
        const details = await getChallengeById(challenge.id);
        if (cancelled) return;

        setModalMinAcceptBet(
          typeof details.min_accept_bet === "number" ? details.min_accept_bet : challenge.min_accept_bet
        );
        setModalMaxAcceptBet(
          typeof details.max_accept_bet === "number" ? details.max_accept_bet : challenge.max_accept_bet
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
  }, [isBetFormOpen, challenge]);

  useEffect(() => {
    if (!isConnected || !address) {
      setUsdcBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const connection = getReadonlyConnection();
        const walletPubkey = new PublicKey(address);
        const usdcAta = await getAssociatedTokenAddress(USDC_MINT, walletPubkey);

        try {
          const account = await connection.getTokenAccountBalance(usdcAta);
          const balance = Number(account.value.uiAmount);
          setUsdcBalance(balance);
        } catch {
          setUsdcBalance(0);
        }
      } catch (error) {
        console.error("Failed to fetch USDC balance:", error);
        setUsdcBalance(null);
      }
    };

    fetchBalance();
  }, [isConnected, address]);

  // Handlers
  const handleCtaClick = useCallback(() => {
    if (ctaState.disabled) return;
    if (!isConnected) {
      open();
      return;
    }
    setBetInput(String(challenge?.initial_bet ?? ""));
    setBetError("");
    setJoinSide(challenge?.mode === "pool" ? "challenger" : "opponent");
    setModalMinAcceptBet(challenge?.min_accept_bet);
    setModalMaxAcceptBet(challenge?.max_accept_bet);
    setEscrowAddress(undefined);
    setIsBetFormOpen(true);
  }, [ctaState.disabled, isConnected, open, challenge]);

  const closeBetForm = useCallback(() => {
    if (isLoading) return;
    setBetError("");
    setIsBetFormOpen(false);
  }, [isLoading]);

  const handleJoinChallenge = useCallback(async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    if (!challenge) return;

    if (!isConnected || !address || !walletProvider) {
      setBetError("Connect your Solana wallet before joining this challenge.");
      return;
    }

    if (!user?.id) {
      setBetError("Your user profile is not ready yet. Please try again.");
      return;
    }

    const parsedBetAmount = Number(betInput);
    const minAcceptBet = modalMinAcceptBet;
    const maxAcceptBet = modalMaxAcceptBet;

    if (!Number.isFinite(parsedBetAmount) || parsedBetAmount <= 0) {
      setBetError("Please enter a valid bet amount.");
      return;
    }

    if (typeof usdcBalance === "number" && Number.isFinite(usdcBalance) && parsedBetAmount > usdcBalance) {
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
      const creatorWalletStr = onchainMeta?.creator_wallet ?? creatorWalletAddress;

      if (!challengePdaStr) {
        throw new Error("This challenge has no on-chain reference yet. Please ask the creator to recreate it.");
      }
      if (!creatorWalletStr) {
        throw new Error("Creator wallet is missing for this challenge.");
      }

      const challengePDA = new PublicKey(challengePdaStr);
      const creatorPubkey = new PublicKey(creatorWalletStr);

      const walletAdapter = {
        publicKey: new PublicKey(address),
        signTransaction: async (tx: Transaction) => {
          const signed = await (walletProvider as any).signTransaction(tx);
          return signed;
        },
        signAllTransactions: async (txs: Transaction[]) => {
          const signed = await (walletProvider as any).signAllTransactions(txs);
          return signed;
        },
      };

      const program = getRektoProgram(walletAdapter);
      const connection = getReadonlyConnection();

      const onChainChallenge = await fetchChallenge(program, challengePDA);

      if (!onChainChallenge) {
        throw new Error("On-chain challenge account not found. It may have been cancelled or settled.");
      }
      if (Date.now() / 1000 >= onChainChallenge.expiresAt) {
        throw new Error("Challenge has already expired.");
      }

      const publicKey = new PublicKey(address);
      if (publicKey.equals(onChainChallenge.creator)) {
        throw new Error("You cannot accept your own challenge.");
      }

      const requiredBetUsdc = Number(onChainChallenge.betAmount) / 1_000_000;

      const tx = await buildAcceptChallengeTx(program, publicKey, challengePDA, creatorPubkey);

      const signedTx = await walletAdapter.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      await joinChallenge({
        challenge_id: challenge.id,
        user_id: user.id,
        side: challenge.mode === "pool" ? joinSide : "opponent",
        bet_amount: requiredBetUsdc,
      });

      setIsBetFormOpen(false);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to join challenge. Please try again.";
      setBetError(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  }, [betInput, challenge, modalMinAcceptBet, modalMaxAcceptBet, usdcBalance, isConnected, address, walletProvider, user?.id, joinSide, creatorWalletAddress, onClose]);

  const handleShareChallenge = useCallback(async () => {
    if (!challenge) return;

    const shareUrl = `${window.location.origin}/challenges?challengeId=${encodeURIComponent(challenge.id)}`;
    const shareText = `Check out this challenge: ${challenge.title}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: challenge.title,
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
    currentTime,
    shareFeedback,
    setShareFeedback,
    liveSolPrice,
    isLoading,
    isBetFormOpen,
    betInput,
    betError,
    joinSide,
    modalMinAcceptBet,
    modalMaxAcceptBet,
    escrowAddress,
    isDescriptionExpanded,
    isTitleExpanded,
    usdcBalance,

    // Setters
    setBetInput,
    setBetError,
    setJoinSide,
    setIsDescriptionExpanded,
    setIsTitleExpanded,

    // Derived values
    betCurrency,
    asset,
    assetLogo,
    creatorName,
    creatorAvatar,
    hasOpponentInfo,
    isAccepted,
    opponentDisplayName,
    opponentAvatar,
    isPoolMode,
    betAmount,
    createdTimestamp,
    expiryTimestamp,
    resolveTimestamp,
    creatorWalletAddress,
    creatorWalletShort,
    canExpandTitle,
    displayedTitle,
    startPrice,
    targetPrice,
    currentPrice,
    priceChange,
    isBelowChallenge,
    isAboveChallenge,
    isDirectionalBelow,
    priceBarPosition,
    progressThemeClass,
    markerThemeClass,
    markerDotThemeClass,
    priceLabelThemeClass,
    isCreator,
    hasOpponents,
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
    hasResolveTimePassed,
    showResolvesBox,
    hideExpiresBox,
    timelineColumns,
    endsInText,
    expiresInText,
    createdTimeText,
    resolveDateByText,
    resolveDayDateText,
    exactCountdownDetails,
    resolvesInText,
    resolvesInSubtext,
    expiresInTextForBox,
    statusLabel,
    statusClassName,
    challengeDescriptionText,
    displayedDescriptionText,
    isDescriptionTruncatable,
    canToggleDescription: isDescriptionTruncatable,
    modeLabel: isPoolMode ? "Multi Mode" : "PvP Mode",
    totalPoolLabel: `$${Number(betAmount || 0).toLocaleString()}`,
    titleSuffix: !isManualResolution && isResolveTimeAchieved && resolveDateByText ? ` by ${resolveDateByText}` : "",
    primaryTitle: displayedTitle + (!isManualResolution && isResolveTimeAchieved && resolveDateByText ? ` by ${resolveDateByText}` : ""),
    resolutionLabel: isManualResolution ? "Community resolution" : "Price feed resolution",
    descriptionToShow: displayedDescriptionText,

    // CTA
    ctaState,

    // Handlers
    handleCtaClick,
    closeBetForm,
    handleJoinChallenge,
    handleShareChallenge,
    openProfile,
    onClose,
  };
}