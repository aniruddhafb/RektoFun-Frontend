"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { X, Clock, User, Calendar, AlertCircle } from "lucide-react";
import { AcceptChallengeModal } from "./AcceptChallengeModal";
import { ChallengeListItem, getChallengeById, joinChallenge } from "@/app/lib/challenges-service/challenges";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/store/useUserStore";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import { buildAcceptChallengeTx, fetchChallenge } from "@/app/lib/rektofun-program";
import { PublicKey } from "@solana/web3.js";


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
    const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
    const [isTitleExpanded, setIsTitleExpanded] = React.useState(false);

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
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
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
        setIsDescriptionExpanded(false);
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
    const endsByCountdown = formatEndsByCountdown(resolveTimestamp, currentTime);
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
    const hideExpiresBox = hasOpponents && isExpireTimeAchieved;
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
        "w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2";
    const activeCtaClassName =
        `${ctaBaseClassName} cursor-pointer bg-[#246044] hover:bg-[#2b7351] text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
    const activePvpCtaClassName =
        `${ctaBaseClassName} cursor-pointer bg-[#0c9d63] hover:bg-[#0a7d4f] border border-gray-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
    const ongoingCtaClassName =
        `${ctaBaseClassName} cursor-not-allowed bg-[#09905a] border border-gray-500 text-white shadow-lg`;
    const expiredCtaClassName =
        `${ctaBaseClassName} bg-red-100 border border-red-300 text-red-700 shadow-sm cursor-not-allowed`;
    const resolvingCtaClassName =
        `${ctaBaseClassName} bg-amber-100 border border-amber-300 text-amber-700 shadow-sm cursor-not-allowed`;
    const completedCtaClassName =
        `${ctaBaseClassName} bg-gray-200 border border-gray-300 text-gray-700 shadow-sm cursor-not-allowed`;

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-hidden">
            <div
                ref={modalRef}
                className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#f8ede7] via-[#f3e1d7] to-[#e8d5c4] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#d4a574]/30 animate-in zoom-in-95 duration-300"
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

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#d4a574]/20 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-[#246044]/20 to-transparent rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Main Content */}
                <div className="relative p-4 sm:p-8">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8">
                        {/* Asset Image */}
                        <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-gray-300 p-1 shadow-xl">
                                <div className="w-full h-full rounded-xl bg-[#f8ede7] flex items-center justify-center overflow-hidden">
                                    <Image
                                        src={assetLogo}
                                        alt={asset}
                                        width={80}
                                        height={80}
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Challenge Info */}
                        <div className="flex-1 text-center sm:text-left min-w-0">
                            {/* Market Tag */}
                            {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/70 backdrop-blur-sm rounded-full mb-3 border border-[#d4a574]/40 shadow-sm">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] text-[#2d1f1a] font-black">
                                        <Image
                                            src={assetLogo}
                                            alt={asset}
                                            width={80}
                                            height={80}
                                            className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                                        />
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-[#2d1f1a] uppercase tracking-wide">{asset} Challenge Markets</span>
                            </div> */}

                            {/* Title */}
                            <h2 className="mt-2 mb-3 text-[#2d1f1a] leading-tight min-w-0">
                                {isManualResolution ? (
                                    <>
                                        <span className="block sm:hidden text-[22px] font-bold tracking-tight break-words">
                                            {displayedTitle}
                                            {canExpandTitle && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTitleExpanded((prev) => !prev)}
                                                    className="mr-1 inline-flex h-5 w-5 align-middle items-center justify-center rounded-full border border-[#d4a574]/50 text-[#246044] hover:bg-white/60 transition-colors"
                                                    aria-label={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                    title={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                >
                                                    <svg
                                                        className={`h-3.5 w-3.5 transition-transform ${isTitleExpanded ? "rotate-180" : ""}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </span>
                                        <span className="hidden sm:block sm:text-3xl sm:font-bold sm:tracking-tight break-words">
                                            {displayedTitle}
                                            {canExpandTitle && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTitleExpanded((prev) => !prev)}
                                                    className="mr-2 inline-flex h-6 w-6 align-middle items-center justify-center rounded-full border border-[#d4a574]/50 text-[#246044] hover:bg-white/60 transition-colors"
                                                    aria-label={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                    title={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                >
                                                    <svg
                                                        className={`h-4 w-4 transition-transform ${isTitleExpanded ? "rotate-180" : ""}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </span>
                                    </>
                                ) : isResolveTimeAchieved ? (
                                    <>
                                        <span className="block sm:hidden text-[22px] font-bold tracking-tight break-words">
                                            {displayedTitle} by {resolveDateByText}
                                            {canExpandTitle && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTitleExpanded((prev) => !prev)}
                                                    className="mr-1 inline-flex h-5 w-5 align-middle items-center justify-center rounded-full border border-[#d4a574]/50 text-[#246044] hover:bg-white/60 transition-colors"
                                                    aria-label={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                    title={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                >
                                                    <svg
                                                        className={`h-3.5 w-3.5 transition-transform ${isTitleExpanded ? "rotate-180" : ""}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </span>
                                        <span className="hidden sm:block sm:text-3xl sm:font-bold sm:tracking-tight break-words">
                                            {displayedTitle} by {resolveDateByText}
                                            {canExpandTitle && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTitleExpanded((prev) => !prev)}
                                                    className="mr-2 inline-flex h-6 w-6 align-middle items-center justify-center rounded-full border border-[#d4a574]/50 text-[#246044] hover:bg-white/60 transition-colors"
                                                    aria-label={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                    title={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                >
                                                    <svg
                                                        className={`h-4 w-4 transition-transform ${isTitleExpanded ? "rotate-180" : ""}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="block sm:hidden text-[22px] font-bold tracking-tight break-words">
                                            {canExpandTitle && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTitleExpanded((prev) => !prev)}
                                                    className="mr-1 inline-flex h-5 w-5 align-middle items-center justify-center rounded-full border border-[#d4a574]/50 text-[#246044] hover:bg-white/60 transition-colors"
                                                    aria-label={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                    title={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                >
                                                    <svg
                                                        className={`h-3.5 w-3.5 transition-transform ${isTitleExpanded ? "rotate-180" : ""}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                            {displayedTitle} In Next{" "}
                                            <span className="inline-flex items-center gap-1.5 align-middle">
                                                <span className="font-bold text-emerald-900 whitespace-nowrap">{endsByCountdown}</span>
                                                <span className="group relative inline-flex items-center">
                                                    <svg className="w-4 h-4 text-emerald-700 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="absolute left-1/2 top-full z-10 mt-2 w-60 -translate-x-1/2 rounded-lg bg-gray-900 p-2 text-[11px] font-medium text-white opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible normal-case leading-relaxed shadow-lg">
                                                        <span className="block">Exact countdown: {exactCountdownDetails.exactCountdown}</span>
                                                        <span className="block">Time left: {exactCountdownDetails.timeLeftText}</span>
                                                        <span className="block">Resolves on: {exactCountdownDetails.dayLabel}</span>
                                                        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900"></span>
                                                    </span>
                                                </span>
                                            </span>
                                        </span>
                                        <span className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:text-3xl sm:font-bold sm:tracking-tight break-words">
                                            {canExpandTitle && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTitleExpanded((prev) => !prev)}
                                                    className="inline-flex h-6 w-6 align-middle items-center justify-center rounded-full border border-[#d4a574]/50 text-[#246044] hover:bg-white/60 transition-colors"
                                                    aria-label={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                    title={isTitleExpanded ? "Collapse title" : "Expand title"}
                                                >
                                                    <svg
                                                        className={`h-4 w-4 transition-transform ${isTitleExpanded ? "rotate-180" : ""}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            )}
                                            <span className="break-words">{displayedTitle} In Next</span>
                                            <span className="inline-flex items-center gap-1.5 align-middle">
                                                <span className="font-bold text-emerald-900 whitespace-nowrap">{endsByCountdown}</span>
                                                <span className="group relative inline-flex items-center">
                                                    <svg className="w-4 h-4 text-emerald-700 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="absolute left-1/2 top-full z-10 mt-2 w-60 -translate-x-1/2 rounded-lg bg-gray-900 p-2 text-[11px] font-medium text-white opacity-0 invisible transition-all duration-200 group-hover:opacity-100 group-hover:visible normal-case leading-relaxed shadow-lg">
                                                        <span className="block">Exact countdown: {exactCountdownDetails.exactCountdown}</span>
                                                        <span className="block">Time left: {exactCountdownDetails.timeLeftText}</span>
                                                        <span className="block">Resolves on: {exactCountdownDetails.dayLabel}</span>
                                                        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-900"></span>
                                                    </span>
                                                </span>
                                            </span>
                                        </span>
                                    </>
                                )}
                            </h2>
                            {!isManualResolution ? (
                                <div className="mb-2 text-[14px] sm:text-[16px] text-[#756d66] leading-relaxed flex flex-wrap items-center justify-start gap-1 max-[350px]:gap-0.5">
                                    <p className="inline max-[350px]:basis-full">
                                        {displayedDescriptionText}
                                    </p>
                                    {isDescriptionTruncatable && (
                                        <button
                                            type="button"
                                            onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                                            className={`text-[12px] max-[350px]:text-[11px] sm:text-sm font-semibold text-[#246044] hover:text-[#2d6f4a] transition-colors cursor-pointer whitespace-nowrap mt-0.5 ${isDescriptionExpanded ? "block w-full text-center sm:inline sm:w-auto sm:text-left" : "max-[350px]:self-start"}`}
                                        >
                                            {isDescriptionExpanded ? "Show less" : "Show more"}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-2 text-[14px] sm:text-[16px] text-[#756d66] leading-relaxed flex flex-wrap items-center justify-start gap-1 max-[350px]:gap-0.5">
                                    <p className="inline max-[350px]:basis-full">
                                        {displayedManualDescriptionText}
                                    </p>
                                    {isManualDescriptionTruncatable && (
                                        <button
                                            type="button"
                                            onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                                            className={`text-[12px] max-[350px]:text-[11px] sm:text-sm font-semibold text-[#246044] hover:text-[#2d6f4a] transition-colors cursor-pointer whitespace-nowrap mt-0.5 ${isDescriptionExpanded ? "block w-full text-center sm:inline sm:w-auto sm:text-left" : "max-[350px]:self-start"}`}
                                        >
                                            {isDescriptionExpanded ? "Show less" : "Show more"}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Created By */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (!creatorWalletAddress) return;
                                    router.push(`/profile/${creatorWalletAddress}`);
                                }}
                                className="inline-flex items-center gap-2.5 rounded-2xl border border-[#d8d2cb] bg-[#f6f3ef] px-3.5 py-2 transition-colors duration-200 hover:border-[#cbc3bb] cursor-pointer"
                            >
                                <div className="h-8 w-8 rounded-full overflow-hidden border border-[#c8c1ba] shrink-0">
                                    <Image
                                        src={creatorAvatar}
                                        alt={creatorName}
                                        width={30}
                                        height={30}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="flex flex-col leading-none text-left">
                                    <span className="text-[10px] text-[#9a9189]">Created by</span>
                                    <span className="text-[13px] text-[#756d66] mt-1">{creatorName}</span>
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Bet Amount - Highlighted */}
                    {!isManualResolution && (
                        <div className="relative mb-8 p-4 sm:p-6 bg-gradient-to-r from-[#246044] to-[#2d6f4a] rounded-2xl text-white shadow-xl overflow-visible">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full translate-x-8 -translate-y-8" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full -translate-x-6 translate-y-6" />

                            {/* Prize Pool - Top */}
                            <div className="text-center mb-6">
                                <div className="flex items-center justify-center gap-1.5 mb-1">
                                    <p className="text-white/80 text-sm font-medium">Total Pool</p>
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
                                <p className="text-4xl font-black">
                                    ${betAmount}
                                </p>
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
                                    {/* <span className="text-xs ml-2 text-white/60">
                                    ({priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%)
                                </span> */}
                                </p>
                                <p className="text-[11px] text-white/70 mt-1 animate-pulse">Live market sync</p>
                            </div>
                        </div>
                    )}

                    {/* VS Section */}
                    <div className="mb-8">
                        {isManualResolution && (
                            <div className="mb-3 text-center">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#8b7355]">Total Pool</p>
                                <p className="text-2xl font-black text-[#2d1f1a]">${betAmount}</p>
                            </div>
                        )}
                        <h3 className="text-center text-sm font-bold text-[#8b7355] uppercase tracking-wider mb-4">
                            Battle Matchup
                        </h3>

                        <div className="flex w-full flex-row items-center justify-center gap-2.5 max-[350px]:gap-1.5 sm:gap-4">
                            {/* Challenger Profile */}
                            <div className="relative group flex flex-col items-center">
                                <div className={`w-[112px] h-[142px] max-[350px]:w-[98px] max-[350px]:h-[132px] sm:w-full sm:max-w-[138px] sm:min-h-[168px] sm:h-auto flex flex-col items-center justify-center text-center gap-1.5 max-[350px]:gap-1 sm:gap-2 p-2.5 max-[350px]:p-2 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 ${hasWon
                                    ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400 shadow-lg shadow-amber-200"
                                    : hasLost
                                        ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                        : "bg-white/80 border-2 border-[#d4a574]/30"
                                    }`}>
                                    {/* Winner Crown */}
                                    {isFinalOutcome && hasWon && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                                            👑
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div className="relative flex flex-col items-center">
                                        <div className={`w-12 h-12 max-[350px]:w-10 max-[350px]:h-10 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 ${hasWon ? "border-amber-400" : "border-[#d4a574]"
                                            } shadow-md`}>
                                            <Image
                                                src={creatorAvatar}
                                                alt={creatorName}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Label */}
                                        <div className="mt-1 px-1.5 py-0.5 max-[350px]:px-1 max-[350px]:text-[7px] bg-[#2d1f1a] text-white text-[8px] sm:text-[9px] font-bold rounded-full">
                                            CHALLENGER
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="text-center max-[350px]:w-full max-[350px]:px-0.5">
                                        <p className="font-bold text-[#2d1f1a] text-[11px] max-[350px]:text-[10px] sm:text-xs truncate">{creatorName}</p>
                                        <p className="text-[9px] max-[350px]:text-[8px] sm:text-[10px] text-[#8b7355] mt-0.5 leading-tight">
                                            {hasOpponents ? creatorOutcomeText : "Created challenge"}
                                        </p>
                                    </div>
                                </div>
                                {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                    <button
                                        type="button"
                                        onClick={handleCtaClick}
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
                                <div className="relative group flex flex-col items-center">
                                    <div className={`w-[112px] h-[142px] max-[350px]:w-[98px] max-[350px]:h-[132px] sm:w-[138px] sm:h-[168px] flex flex-col items-center justify-center text-center gap-1.5 max-[350px]:gap-1 sm:gap-2 p-2.5 max-[350px]:p-2 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 ${hasLost
                                        ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400 shadow-lg shadow-amber-200"
                                        : hasWon
                                            ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                            : "bg-white/80 border-2 border-[#d4a574]/30"
                                        }`}>
                                        {/* Winner Crown */}
                                        {isFinalOutcome && hasLost && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                                                👑
                                            </div>
                                        )}

                                        {/* Avatar */}
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-12 h-12 max-[350px]:w-10 max-[350px]:h-10 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 ${hasLost ? "border-amber-400" : "border-[#d4a574]"
                                                } shadow-md`}>
                                                <Image
                                                    src={opponentAvatar}
                                                    alt={opponentDisplayName}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* Label */}
                                            <div className="mt-1 px-1.5 py-0.5 max-[350px]:px-1 max-[350px]:text-[7px] bg-[#2d1f1a] text-white text-[8px] sm:text-[9px] font-bold rounded-full">
                                                {isPoolMode ? "POOL" : "OPPONENT"}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="text-center max-[350px]:w-full max-[350px]:px-0.5">
                                            <p className="font-bold text-[#2d1f1a] text-[11px] max-[350px]:text-[10px] sm:text-xs truncate">{opponentDisplayName}</p>
                                            <p className="text-[9px] max-[350px]:text-[8px] sm:text-[10px] text-[#8b7355] mt-0.5 leading-tight">
                                                {hasOpponents ? opponentOutcomeText : "Opposing challenge"}
                                            </p>
                                        </div>
                                    </div>
                                    {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                        <button
                                            type="button"
                                            onClick={handleCtaClick}
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
                                    <div className="w-[112px] h-[142px] max-[350px]:w-[98px] max-[350px]:h-[132px] sm:w-[138px] sm:h-[168px] flex flex-col items-center justify-center text-center gap-1.5 max-[350px]:gap-1 sm:gap-2 p-2.5 max-[350px]:p-2 sm:p-4 rounded-lg sm:rounded-xl bg-white/40 border-2 border-dashed border-[#d4a574]/30">
                                        <div className="w-12 h-12 max-[350px]:w-10 max-[350px]:h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-[#d4a574]/50">
                                            <span className="text-base max-[350px]:text-sm sm:text-xl">❓</span>
                                        </div>
                                        <div className="mt-1 px-1.5 py-0.5 max-[350px]:px-1 max-[350px]:text-[7px] bg-[#2d1f1a] text-white text-[8px] sm:text-[9px] font-bold rounded-full">
                                            OPPONENT
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-[#8b7355] text-[11px] max-[350px]:text-[10px] sm:text-xs">No one yet</p>
                                            <p className="text-[9px] max-[350px]:text-[8px] sm:text-[10px] text-[#a08070] mt-0.5 leading-tight">Be the first to accept!</p>
                                        </div>
                                    </div>
                                    {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                        <button
                                            type="button"
                                            onClick={handleCtaClick}
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
                    <div className="mb-6">
                        <h3 className="text-center text-xs sm:text-sm font-bold text-[#8b7355] uppercase tracking-wider mb-3 sm:mb-4">
                            Challenge Timeline
                        </h3>

                        <div className={`grid grid-cols-2 ${timelineColumns === 4 ? "sm:grid-cols-4" : timelineColumns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2.5 sm:gap-4 overflow-visible`}>
                            {/* Mode */}
                            <div className="relative p-2.5 sm:p-4 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-visible">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Mode</span>
                                </div>
                                <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">{challenge.mode === "pool" ? "Multi Mode" : "PvP Mode"}</p>
                            </div>

                            {/* Created */}
                            <div className="relative p-2.5 sm:p-4 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-visible">
                                <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-semibold text-[#8b7355] uppercase">Created</span>
                                </div>
                                <p className="font-bold text-[11px] sm:text-base text-[#2d1f1a] leading-tight">{createdTimeText}</p>
                            </div>

                            {/* Expires */}
                            {!hideExpiresBox && (
                                <div className="relative z-20 hover:z-50 p-2.5 sm:p-4 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-visible">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex items-center justify-center">
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
                                        <div className="relative z-10 p-2.5 sm:p-4 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-visible">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
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
                                        <div className="relative z-10 p-2.5 sm:p-4 bg-white/60 backdrop-blur-sm rounded-lg sm:rounded-xl border border-[#d4a574]/20 hover:border-[#d4a574]/40 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-visible">
                                            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 flex items-center justify-center">
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
                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
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
                            className="flex-1 py-3.5 px-4 sm:px-6 bg-white/80 hover:bg-white rounded-xl text-[#2d1f1a] font-semibold text-base border border-[#d4a574]/30 hover:border-[#d4a574] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {shareFeedback ?? "Share"}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
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
        </div>
    );
}
