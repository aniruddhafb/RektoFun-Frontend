"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Clock, User, Calendar, AlertCircle, ChevronDown, ChevronUp, Share2, Trophy, Target, Users, Activity, Wallet } from "lucide-react";
import { AcceptChallengeModal } from "./AcceptChallengeModal";
import { ChallengeListItem, getChallengeById, joinChallenge } from "@/app/lib/challenges-service/challenges";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/useUserStore";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import { buildAcceptChallengeTx, fetchChallenge } from "@/app/lib/rektofun-program";
import { PublicKey } from "@solana/web3.js";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";


interface ChallengeDetailModalProps {
    challenge: ChallengeListItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChallengeDetailModal({ challenge, isOpen, onClose }: ChallengeDetailModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { user } = useUserStore();
    const { authenticated, login, program, publicKey, sendTransaction, usdcBalance } = useSolanaWallet();
    const [currentTime, setCurrentTime] = React.useState(() => Date.now());
    const [shareFeedback, setShareFeedback] = React.useState<string | null>(null);
    const [liveSolPrice, setLiveSolPrice] = React.useState<number | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isBetFormOpen, setIsBetFormOpen] = React.useState(false);
    const [betInput, setBetInput] = React.useState("");
    const [betError, setBetError] = React.useState("");
    const [joinSide, setJoinSide] = React.useState<"challenger" | "opponent">("opponent");
    const [modalMinAcceptBet, setModalMinAcceptBet] = React.useState<number | undefined>(undefined);
    const [modalMaxAcceptBet, setModalMaxAcceptBet] = React.useState<number | undefined>(undefined);
    const [escrowAddress, setEscrowAddress] = React.useState<string | undefined>(undefined);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(true);
    const [isTitleExpanded, setIsTitleExpanded] = React.useState(true);
    useBodyScrollLock(isOpen);

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

    const formatExactCountdownDetails = (timestamp: number | null, nowMs: number): {
        exactCountdown: string;
        timeLeftText: string;
        dayLabel: string;
    } => {
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

    // Close modal on escape key (but keep parent open while accept modal is active)
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
        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose, isBetFormOpen]);

    // Close modal when clicking outside (disabled while accept modal is active)
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
        const interval = window.setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);

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
        if (!isOpen) return;

        let isMounted = true;
        const marketDescription = encodeURIComponent(
            challenge?.market?.description?.trim() || "Solana"
        );

        const fetchSolPrice = async () => {
            try {
                const response = await fetch(
                    `https://api.diadata.org/v1/assetQuotation/${marketDescription}/0x0000000000000000000000000000000000000000`,
                    { cache: "no-store" },
                );
                if (!response.ok) return;

                const data = await response.json();
                const rawPrice =
                    data?.price ??
                    data?.Price ??
                    data?.quotation ??
                    data?.value ??
                    null;
                const parsedPrice =
                    typeof rawPrice === "number"
                        ? rawPrice
                        : typeof rawPrice === "string"
                            ? Number(rawPrice)
                            : NaN;

                if (isMounted && Number.isFinite(parsedPrice) && parsedPrice > 0) {
                    setLiveSolPrice(parsedPrice);
                }
            } catch {
                // Keep previous value on transient network/API errors.
            }
        };

        void fetchSolPrice();
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

    if (!isOpen || !challenge) return null;
    const betCurrency = "USDC";

    const asset = challenge.market?.name || "Market";
    const assetLogo = challenge.market?.icon || "/scribbles/btc.png";
    const creatorName = challenge.creator?.username || "Creator";
    const creatorAvatar = challenge.creator?.profile_image || assetLogo;
    const hasOpponentInfo = Boolean(challenge.opponent_info?.username || challenge.opponent_info?.wallet_address);
    const isAccepted =
        challenge.status === "locked" ||
        challenge.status === "resolved" ||
        hasOpponentInfo;
    const opponentDisplayName = challenge.opponent_info?.username || "Opponent";
    const opponentAvatar = challenge.opponent_info?.profile_image || assetLogo;
    const isPoolMode = challenge.mode === "pool";
    const betAmount = challenge.initial_bet ?? 0;
    const createdTimestamp = challenge.created_at ? new Date(challenge.created_at).getTime() : null;
    const expiryTimestamp = challenge.expire_time ? new Date(challenge.expire_time).getTime() : null;
    const resolveTimestamp = challenge.resolve_time ? new Date(challenge.resolve_time).getTime() : null;
    const resolveDateByText = resolveTimestamp
        ? new Date(resolveTimestamp).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })
        : "";
    const exactCountdownDetails = formatExactCountdownDetails(resolveTimestamp, currentTime);
    const createdTimeText = formatCreatedTimeAgo(createdTimestamp, currentTime);
    const expiresInText = formatExpiryCountdown(expiryTimestamp, currentTime);
    const endsInText = formatEndsByCountdown(resolveTimestamp, currentTime);
    const resolveDayDateText = resolveTimestamp
        ? new Date(resolveTimestamp).toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
        })
        : "Unknown date";
    const creatorWalletAddress = challenge.creator?.wallet_address || "";
    const creatorWalletShort = creatorWalletAddress
        ? `${creatorWalletAddress.slice(0, 6)}...${creatorWalletAddress.slice(-4)}`
        : "Unknown wallet";
    const titleWords = challenge.title.trim().split(/\s+/).filter(Boolean);
    const canExpandTitle = titleWords.length > 6;
    const displayedTitle = isTitleExpanded || !canExpandTitle
        ? challenge.title
        : `${titleWords.slice(0, 6).join(" ")}...`;
    const startPrice = betAmount;
    const targetPrice = challenge.target_price ?? challenge.total_pool ?? betAmount;
    const currentPrice = liveSolPrice ?? challenge.total_pool ?? 0;
    const priceChange = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
    const titleLower = challenge.title.toLowerCase();
    const isBelowChallenge = titleLower.includes("below");
    const isAboveChallenge = titleLower.includes("above");
    const isManualResolution = String(challenge.resolution_source ?? "").toLowerCase() === "manual";
    const challengeTicker = challenge.market?.name?.trim().toLowerCase() || "this asset";
    const challengeDescriptionText = `The challenger thinks ${challengeTicker} will ${isBelowChallenge ? "fall below" : isAboveChallenge ? "rise above" : "hit"} $${targetPrice.toLocaleString()} by the resolution time. If you think opposite you can counter it and win the total pool of $${betAmount} if you're right.`;
    const challengeDescriptionWords = challengeDescriptionText.trim().split(/\s+/).filter(Boolean);
    const isDescriptionTruncatable = challengeDescriptionWords.length > 7;
    const challengeDescriptionPreviewText = isDescriptionTruncatable
        ? `${challengeDescriptionWords.slice(0, 7).join(" ")}...`
        : challengeDescriptionText;
    const displayedDescriptionText =
        isDescriptionExpanded && isDescriptionTruncatable
            ? challengeDescriptionText
            : challengeDescriptionPreviewText;
    const manualDescriptionText = `The challenger has a conviction, ${challenge?.title}. If you don't think so you can counter it and win $${betAmount} if you are right.`;
    const manualDescriptionWords = manualDescriptionText.trim().split(/\s+/).filter(Boolean);
    const isManualDescriptionTruncatable = manualDescriptionWords.length > 7;
    const manualDescriptionPreviewText = isManualDescriptionTruncatable
        ? `${manualDescriptionWords.slice(0, 7).join(" ")}...`
        : manualDescriptionText;
    const displayedManualDescriptionText =
        isDescriptionExpanded && isManualDescriptionTruncatable
            ? manualDescriptionText
            : manualDescriptionPreviewText;
    const isDirectionalBelow = isBelowChallenge && !isAboveChallenge;
    const progressThemeClass = isDirectionalBelow
        ? "from-red-500 to-red-300"
        : "from-emerald-500 to-emerald-300";
    const markerThemeClass = isDirectionalBelow ? "border-red-400" : "border-emerald-400";
    const markerDotThemeClass = isDirectionalBelow ? "bg-red-500" : "bg-emerald-500";
    const priceLabelThemeClass = isDirectionalBelow ? "text-red-300" : "text-emerald-300";

    // Calculate target progress (0-100%) based on direction:
    // above: current/target, below: target/current.
    const getPriceBarPosition = () => {
        if (targetPrice <= 0 || currentPrice <= 0) return 0;
        const ratio = isDirectionalBelow
            ? targetPrice / currentPrice
            : currentPrice / targetPrice;
        return Math.max(0, Math.min(100, ratio * 100));
    };
    const priceBarPosition = getPriceBarPosition();
    const isCreator = user?.wallet_address === creatorWalletAddress;
    const hasOpponents = Number(challenge.total_opponents ?? 0) > 0 || hasOpponentInfo;
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
    const isResolutionResolved = resolutionStatusRaw === "resolved";
    const hasResolveTimePassed = Boolean(resolveTimestamp && resolveTimestamp <= currentTime);

    const showResolvesBox = !isExpireTimeAchieved || hasOpponents;
    const hideExpiresBox = !isPoolMode && hasOpponentInfo;
    const timelineColumns = (!hideExpiresBox ? 1 : 0) + 2 + (showResolvesBox ? 1 : 0);
    const resolvesInText = hasResolveTimePassed
        ? isResolutionResolved
            ? "Completed"
            : isResolutionPending
                ? "Resolving"
                : "Resolving"
        : endsInText;
    const resolvesInSubtext = hasResolveTimePassed ? null : `(${resolveDayDateText})`;
    const expiresInTextForBox = isExpireTimeAchieved && !hasOpponents ? "Expired" : expiresInText;

    let ctaLabel = "";
    let ctaDisabled = false;
    let ctaClassName = "";
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
    const showCreatorCtaHoverHint = isCreator && ctaLabel === "COUNTER ⚔️";
    const isOngoingCta = ctaLabel.startsWith("ONGOING");

    const handleCtaClick = () => {
        if (ctaDisabled) return;
        setBetInput(String(challenge.initial_bet ?? ""));
        setBetError("");
        setJoinSide(challenge.mode === "pool" ? "challenger" : "opponent");
        setModalMinAcceptBet(challenge.min_accept_bet);
        setModalMaxAcceptBet(challenge.max_accept_bet);
        setEscrowAddress(undefined);
        setIsBetFormOpen(true);
    };

    const closeBetForm = () => {
        if (isLoading) return;
        setBetError("");
        setIsBetFormOpen(false);
    };

    const handleJoinChallenge = async (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();
        if (!authenticated) {
            login();
            return;
        }

        if (!program || !publicKey) {
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

            const onChainChallenge = await fetchChallenge(program, challengePDA);
            if (!onChainChallenge) {
                throw new Error("On-chain challenge account not found. It may have been cancelled or settled.");
            }
            if (Date.now() / 1000 >= onChainChallenge.expiresAt) {
                throw new Error("Challenge has already expired.");
            }
            if (publicKey.equals(onChainChallenge.creator)) {
                throw new Error("You cannot accept your own challenge.");
            }

            const requiredBetUsdc = Number(onChainChallenge.betAmount) / 1_000_000;

            const tx = await buildAcceptChallengeTx(program, publicKey, challengePDA, creatorPubkey);
            await sendTransaction(tx);

            await joinChallenge({
                challenge_id: challenge.id,
                user_id: user.id,
                side: challenge.mode === "pool" ? joinSide : "opponent",
                bet_amount: requiredBetUsdc,
            });

            setIsBetFormOpen(false);
            onClose();
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to join challenge. Please try again.";
            setBetError(message);
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareChallenge = async () => {
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
    };

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
    const modeLabel = challenge.mode === "pool" ? "Multi Mode" : "PvP Mode";
    const totalPoolLabel = `$${Number(betAmount || 0).toLocaleString()}`;
    const titleSuffix = !isManualResolution && isResolveTimeAchieved && resolveDateByText ? ` by ${resolveDateByText}` : "";
    const primaryTitle = `${displayedTitle}${titleSuffix}`;
    const descriptionToShow = isManualResolution ? displayedManualDescriptionText : displayedDescriptionText;
    const canToggleDescription = isManualResolution ? isManualDescriptionTruncatable : isDescriptionTruncatable;
    const resolutionLabel = isManualResolution ? "Community resolution" : "Price feed resolution";

    return createPortal(
        <div className="fixed inset-0 z-[10010] flex items-center justify-center overflow-hidden bg-black/55 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4">
            <div
                ref={modalRef}
                className="rekto-modal-panel relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden bg-[#fff8f4] animate-in zoom-in-95 duration-300"
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
            >
                {/* Hide scrollbar CSS for WebKit browsers */}
                <style>{`
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
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
                    onClick={onClose}
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
                                        alt={asset}
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
                                            {asset}
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
                                        {asset}
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
                                        aria-label={isTitleExpanded ? "Collapse title" : "Expand title"}
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
                                        onClick={() => {
                                            if (!creatorWalletAddress) return;
                                            router.push(`/profile/${creatorWalletAddress}`);
                                        }}
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
                                    <h3 className="mt-1 text-2xl font-black text-white sm:text-3xl">{asset}</h3>
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
                            <div className={`mb-3 flex items-center ${isBelowChallenge ? "justify-start" : isAboveChallenge ? "justify-end" : "justify-end"}`}>
                                {/* Target Price */}
                                <div className="flex items-center gap-1.5">
                                    <div>
                                        <p className={`text-white/70 text-xs ${isBelowChallenge ? "text-left" : "text-right"}`}>Target</p>
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
                                {/* Track */}
                                <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                                    {/* Progress fill */}
                                    <div
                                        className={`absolute top-0 h-full rounded-full transition-all duration-500 bg-gradient-to-r ${progressThemeClass} ${isDirectionalBelow ? "right-0" : "left-0"}`}
                                        style={{ width: `${priceBarPosition}%` }}
                                    />
                                    {/* Live update sheen to simulate real-time movement */}
                                    <div className="price-live-sheen absolute top-0 h-full w-14 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                                </div>

                                {/* Current Price Marker */}
                                <div
                                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 flex items-center justify-center ${markerThemeClass}`}
                                    style={
                                        isDirectionalBelow
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
                                onClick={() => {
                                    if (!creatorWalletAddress) return;
                                    router.push(`/profile/${creatorWalletAddress}`);
                                }}
                                className="relative group flex cursor-pointer flex-col items-center"
                            >
                                <div className={`flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center rounded-xl p-2 text-center transition-all duration-300 group-hover:-translate-y-0.5 sm:h-[140px] sm:w-[120px] sm:p-3 ${hasWon
                                    ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400 shadow-lg shadow-amber-200"
                                    : hasLost
                                        ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                        : "bg-white/80 border-2 border-[#d4a574]/30"
                                    }`}>
                                    {/* Winner Badge */}
                                    {isFinalOutcome && hasWon && (
                                        <div className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-amber-700 shadow-md">
                                            <Trophy className="h-4 w-4" />
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div className="relative flex flex-col items-center">
                                        <div className={`h-11 w-11 overflow-hidden rounded-full border-2 sm:h-14 sm:w-14 ${hasWon ? "border-amber-400" : "border-[#d4a574]"
                                            } shadow-md`}>
                                            <Image
                                                src={creatorAvatar}
                                                alt={creatorName}
                                                width={56}
                                                height={56}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Label */}
                                        <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                            {isPoolMode ? "CHALLENGERS" : "CHALLENGER"}
                                        </div>
                                    </div>

                                    {/* Info */}
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCtaClick();
                                        }}
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
                                {isAccepted ? (
                                    <>
                                        <div className="w-9 h-9 max-[350px]:w-8 max-[350px]:h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] flex items-center justify-center shadow-lg">
                                            {isOngoingCta ? (
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
                                    onClick={() => {
                                        const walletAddress = challenge.opponent_info?.wallet_address;
                                        if (!walletAddress) return;
                                        router.push(`/profile/${walletAddress}`);
                                    }}
                                    className="relative group flex cursor-pointer flex-col items-center"
                                >
                                    <div className={`flex h-[132px] w-[98px] max-w-full flex-col items-center justify-center rounded-xl p-2 text-center transition-all duration-300 group-hover:-translate-y-0.5 sm:h-[140px] sm:w-[120px] sm:p-3 ${hasLost
                                        ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400 shadow-lg shadow-amber-200"
                                        : hasWon
                                            ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                            : "bg-white/80 border-2 border-[#d4a574]/30"
                                        }`}>
                                        {/* Winner Badge */}
                                        {isFinalOutcome && hasLost && (
                                            <div className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-100 text-amber-700 shadow-md">
                                                <Trophy className="h-4 w-4" />
                                            </div>
                                        )}

                                        {/* Avatar */}
                                        <div className="relative flex flex-col items-center">
                                            <div className={`h-11 w-11 overflow-hidden rounded-full border-2 sm:h-14 sm:w-14 ${hasLost ? "border-amber-400" : "border-[#d4a574]"
                                                } shadow-md`}>
                                                <Image
                                                    src={opponentAvatar}
                                                    alt={opponentDisplayName}
                                                    width={56}
                                                    height={56}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {challenge.mode === "pool" && (challenge.total_opponents ?? 0) > 1 && (
                                                <div className="absolute -right-1 top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500">
                                                    <span className="text-[9px] font-bold text-white">+{(challenge.total_opponents ?? 0) - 1}</span>
                                                </div>
                                            )}
                                            {/* Label */}
                                            <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                                {isPoolMode ? "POOL" : "OPPONENT"}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="mt-2 w-full text-center">
                                            <p className="break-words font-bold text-[#2d1f1a] text-xs">{opponentDisplayName}</p>
                                            <p className="mt-0.5 break-all text-[10px] text-[#8b7355]">
                                                {hasOpponents ? opponentOutcomeText : "Opposing challenge"}
                                            </p>
                                        </div>
                                    </div>
                                    {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCtaClick();
                                            }}
                                            className={`absolute -bottom-3.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-[28px] font-black leading-none shadow-md transition hover:scale-105 ${hasLost
                                                ? "border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-700 hover:from-amber-200 hover:to-yellow-100"
                                                : hasWon
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
                                    {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCtaClick();
                                            }}
                                            className="absolute -bottom-3.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-[#d4a574]/40 bg-white/90 text-[28px] font-black leading-none text-[#2d1f1a] shadow-md transition hover:scale-105 hover:bg-white"
                                            aria-label="COUNTER"
                                            title="COUNTER"
                                        >
                                            +
                                        </button>
                                    )}
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
                            {/* Mode */}
                            <div className="relative overflow-visible rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-[2px_2px_0_#111] sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 sm:h-8 sm:w-8">
                                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Mode</span>
                                </div>
                                <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">{modeLabel}</p>
                            </div>

                            {/* Created */}
                            <div className="relative overflow-visible rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-[2px_2px_0_#111] sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 sm:h-8 sm:w-8">
                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Created</span>
                                </div>
                                <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">{createdTimeText}</p>
                            </div>

                            {/* Expires */}
                            {!hideExpiresBox && (
                                <div className="relative z-20 overflow-visible rounded-lg border border-[#ead8cc] bg-[#fffaf6] p-3 transition-all duration-200 hover:z-50 hover:-translate-y-0.5 hover:border-black/25 hover:bg-white hover:shadow-[2px_2px_0_#111] sm:p-4">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 sm:h-8 sm:w-8">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                                        </div>
                                        <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Expires In</span>
                                        <div className="group relative z-[60]">
                                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] text-center">
                                                {isExpireTimeAchieved && !hasOpponents
                                                    ? "This challenge has expired. No one joined before expiry."
                                                    : isExpireTimeAchieved && hasOpponents
                                                        ? "Expiry passed, but the challenge has opponents and is now in resolution timeline."
                                                        : `This challenge will expire in ${expiresInText}. After that, no one can join.`}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">{expiresInTextForBox}</p>
                                </div>
                            )}

                            {/* Resolves */}
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
                                disabled={ctaDisabled}
                                onClick={handleCtaClick}
                                className={ctaClassName}
                            >
                                {ctaLabel}
                            </button>
                            {showCreatorCtaHoverHint && (
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
                betCurrency={betCurrency}
                minAcceptBet={modalMinAcceptBet}
                maxAcceptBet={modalMaxAcceptBet}
                escrowAddress={escrowAddress}
                resolveCountdown={exactCountdownDetails.exactCountdown}
                resolveLabel={exactCountdownDetails.dayLabel}
                resolutionSource={challenge.resolution_source ?? undefined}
                isPoolMode={isPoolMode}
                joinSide={joinSide}
                onClose={closeBetForm}
                onSubmit={(e) => handleJoinChallenge(e)}
                onBetInputChange={(value) => {
                    setBetInput(value);
                    if (betError) setBetError("");
                }}
                onJoinSideChange={(side) => setJoinSide(side)}
            />
        </div>,
        document.body,
    );
}
