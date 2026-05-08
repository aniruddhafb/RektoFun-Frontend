"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AcceptChallengeModal } from "./AcceptChallengeModal";
import {
    ChallengeListItem,
    getChallengeById,
    joinChallenge,
} from "@/app/lib/challenges-service/challenges";
import { useUserStore } from "@/app/store/useUserStore";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import {
    buildAcceptChallengeTx,
    fetchChallenge,
} from "@/app/lib/rektofun-program";
import { PublicKey } from "@solana/web3.js";


interface ChallengeCardProps {
    challenge: ChallengeListItem;
    onClick?: (challenge: ChallengeListItem) => void;
    onRekt?: (challenge: ChallengeListItem) => void;
    onToggleBookmark?: (challengeId: string) => void;
    isBookmarked?: boolean;
    ownerAddress?: string;
}

// Helper types for metadata structure
interface UIMetadata {
    title?: string;
    subtitle?: string;
}

interface AssetMetadata {
    symbol?: string;
    name?: string;
    icon?: string;
}

interface BetMetadata {
    amount?: number;
    currency?: string;
    display?: string;
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

interface PoolMetadata {
    currency?: string;
    display?: string;
}

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

function formatExactCountdownDetails(timestamp: number | null, nowMs: number): {
    exactCountdown: string;
    timeLeftText: string;
    dayLabel: string;
} {
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
}

// Helper types for resolution_details
export function ChallengeCard({
    challenge,
    onClick,
    onRekt,
    onToggleBookmark,
    isBookmarked = false,
}: ChallengeCardProps) {
    const router = useRouter();
    const { user } = useUserStore();
    const { authenticated, login, program, publicKey, sendTransaction, usdcBalance } = useSolanaWallet();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isBetFormOpen, setIsBetFormOpen] = React.useState(false);
    const [betInput, setBetInput] = React.useState(String(challenge.initial_bet ?? ""));
    const [betError, setBetError] = React.useState("");
    const [joinSide, setJoinSide] = React.useState<"challenger" | "opponent">("opponent");
    const [currentTime, setCurrentTime] = React.useState(() => Date.now());
    const [fallbackPoolAmount, setFallbackPoolAmount] = React.useState<number | null>(null);
    const [modalMinAcceptBet, setModalMinAcceptBet] = React.useState<number | undefined>(challenge.min_accept_bet);
    const [modalMaxAcceptBet, setModalMaxAcceptBet] = React.useState<number | undefined>(challenge.max_accept_bet);
    const [escrowAddress, setEscrowAddress] = React.useState<string | undefined>(undefined);
    const creator = challenge.creator ?? {
        username: "",
        profile_image: "",
        wallet_address: "",
    };

    React.useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);

        return () => window.clearInterval(interval);
    }, []);

    React.useEffect(() => {
        let isCancelled = false;
        const loadFallbackPool = async () => {
            const totalPoolValue = Number(challenge.total_pool ?? 0);

            if (Number.isFinite(totalPoolValue) && totalPoolValue > 0) {
                if (!isCancelled) {
                    setFallbackPoolAmount(totalPoolValue);
                }
                return;
            }

            if (!isCancelled) {
                setFallbackPoolAmount(null);
            }

            try {
                const challengeDetails = await getChallengeById(challenge.id);
                const initialBetValue = Number(
                    (challengeDetails as { initial_bet?: number | null }).initial_bet ??
                    challenge.initial_bet ??
                    0
                );

                if (!isCancelled && Number.isFinite(initialBetValue) && initialBetValue > 0) {
                    setFallbackPoolAmount(initialBetValue);
                }
            } catch (error) {
                console.error("Failed to load fallback pool amount:", error);
            }
        };

        loadFallbackPool();

        return () => {
            isCancelled = true;
        };
    }, [challenge.id, challenge.total_pool, challenge.initial_bet]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (onClick) {
            // Defer to next tick so the opening click cannot also close the modal backdrop.
            window.setTimeout(() => onClick(challenge), 0);
        } else if (onRekt) {
            onRekt(challenge);
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

    React.useEffect(() => {
        if (!isBetFormOpen) return;

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
    }, [isBetFormOpen, challenge.id, challenge.min_accept_bet, challenge.max_accept_bet]);

    const openProfile = (e: React.MouseEvent, walletAddress: string | null | undefined) => {
        e.preventDefault();
        e.stopPropagation();
        if (!walletAddress) return;
        router.push(`/profile/${walletAddress}`);
    };

    const closeBetForm = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (isLoading) return;
        setBetError("");
        setIsBetFormOpen(false);
    };

    const handleJoinChallenge = async (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault()

        e.stopPropagation();

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

            // ── 1. Load the challenge from the centralized DB.
            //      The on-chain PDA was persisted in metadata at creation time,
            //      so we don't need to scan every on-chain account.
            const challengeDetails = await getChallengeById(challenge.id);

            const onchainMeta =
                (challengeDetails.metadata as Record<string, unknown> | undefined)
                    ?.onchain as
                | {
                    challenge_pda?: string;
                    creator_wallet?: string;
                }
                | undefined;

            const challengePdaStr = onchainMeta?.challenge_pda;
            const creatorWalletStr =
                onchainMeta?.creator_wallet ?? creator.wallet_address;

            console.log({ onchainMeta });

            if (!challengePdaStr) {
                throw new Error(
                    "This challenge has no on-chain reference yet. It may have been created before the on-chain integration — please ask the creator to recreate it."
                );
            }
            if (!creatorWalletStr) {
                throw new Error("Creator wallet is missing for this challenge.");
            }

            const challengePDA = new PublicKey(challengePdaStr);
            const creatorPubkey = new PublicKey(creatorWalletStr);

            // ── 2. Verify the on-chain account is still joinable.
            //      Single fetch by PDA — O(1), no full-table scan.
            const onChainChallenge = await fetchChallenge(program, challengePDA);
            if (!onChainChallenge) {
                throw new Error(
                    "On-chain challenge account not found. It may have been cancelled or settled."
                );
            }
            // if (onChainChallenge.status !== "Open") {
            //     throw new Error(
            //         `Challenge is no longer open (status: ${onChainChallenge.status}).`
            //     );
            // }
            if (Date.now() / 1000 >= onChainChallenge.expiresAt) {
                throw new Error("Challenge has already expired.");
            }
            if (publicKey.equals(onChainChallenge.creator)) {
                throw new Error("You cannot accept your own challenge.");
            }

            // ── 3. The on-chain `accept_challenge` instruction transfers exactly
            //      `challenge.bet_amount` USDC micro-units from the challenger to
            //      the same vault PDA the creator funded. To keep amounts in sync,
            //      we lock the opponent's bet to that exact amount.
            const requiredBetUsdc =
                Number(onChainChallenge.betAmount) / 1_000_000;

            // if (Math.abs(parsedBetAmount - requiredBetUsdc) > 1e-9) {
            //     throw new Error(
            //         `This challenge requires an exact ${requiredBetUsdc} ${betCurrency} match (the creator's bet). Your USDC will be locked into the same on-chain vault.`
            //     );
            // }

            // ── 4. Build, sign and send the accept_challenge tx.
            //      sendTransaction internally confirms before returning.
            const tx = await buildAcceptChallengeTx(
                program,
                publicKey,
                challengePDA,
                creatorPubkey
            );

            const signature = await sendTransaction(tx);

            // ── 5. Tell the backend the user joined (off-chain bookkeeping).
            await joinChallenge({
                challenge_id: challenge.id,
                user_id: user.id,
                side: challenge.mode === "pool" ? joinSide : "opponent",
                bet_amount: requiredBetUsdc,
            });

            console.log(
                `[join] accepted challenge ${challenge.id} on-chain — sig ${signature}`
            );

            setIsBetFormOpen(false);
            if (onRekt) onRekt(challenge);
        } catch (error) {
            console.error("Failed to join challenge:", error);
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to join challenge. Please try again.";
            setBetError(message);
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareChallenge = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const shareUrl = `${window.location.origin}/challenges?challengeId=${encodeURIComponent(challenge.id)}`;
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

    const handleBookmarkClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleBookmark?.(challenge.id);
    };

    // ChallengeListItem doesn't have metadata or resolution_details in the same way as Challenge
    // We use the flattened properties provided by ChallengeListItem
    const uiMeta: UIMetadata = {};
    const market = challenge.market ?? null;
    const assetMeta: AssetMetadata = {
        symbol: market?.name,
        name: market?.name,
        icon: market?.icon,
    };
    const betMeta: BetMetadata = {
        amount: challenge.initial_bet,
        currency: "USDC",
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

        const fallbackValue = Number(fallbackPoolAmount ?? challenge.initial_bet ?? 0);
        if (Number.isFinite(fallbackValue) && fallbackValue > 0) {
            return fallbackValue;
        }

        return 0;
    })();

    const poolMeta: PoolMetadata = {
        display: `$${resolvedPoolAmount}`,
    };

    // Determine mode: pvp or multi (mapped from pvp/pool)
    const challengeMode: "pvp" | "multi" = modeMeta.type || "pvp";

    // Helper values derived from metadata
    const isAccepted = challenge.status === "locked" || challenge.status === "resolved";

    // ChallengeListItem doesn't have created_by, but we can check result if available
    // Since we don't have created_by in ChallengeListItem, we might need to adjust this logic
    // For now, let's assume we can't determine win/loss without the creator's ID
    const hasWon = challenge.status === "resolved" && challenge.result && (challenge.result as Record<string, unknown>).winner === "current_user_id"; // Placeholder
    const hasLost = challenge.status === "resolved" && challenge.result && (challenge.result as Record<string, unknown>).winner !== "current_user_id"; // Placeholder

    // Get asset info
    const assetSymbol = assetMeta.symbol || assetMeta.name || "BTC";
    const assetIcon = assetMeta.icon || "/scribbles/btc.png";
    const assetName = assetMeta.name || assetSymbol;
    const creatorName = labelsMeta.creator || creator.username || "Creator";
    const creatorDisplayName = truncateProfileName(creatorName, 6);
    const creatorWalletDisplay = formatWalletAddress(creator.wallet_address);
    const creatorProfileImage = creator.profile_image || assetIcon;
    const opponentInfo = challenge.opponent_info ?? null;
    const hasOpponentInfo = Boolean(opponentInfo?.username || opponentInfo?.wallet_address);
    const opponentProfileImage = opponentInfo?.profile_image || assetIcon;
    const opponentDisplayName = opponentInfo?.username || "Opponent";
    const opponentWalletDisplay = formatWalletAddress(opponentInfo?.wallet_address);

    // Get title
    const title = uiMeta.title || challenge.title || `Bet on ${assetSymbol}`;

    // Get bet amount
    const betAmount = betMeta.amount || 0;
    const betCurrency = betMeta.currency || "USDC";

    // Get pool display
    const poolDisplay = poolMeta.display || "$0 USDC";

    // Calculate time remaining from expire_time
    const expiryTimestamp = parseDateValue(challenge.expire_time);
    const timeRemaining = formatExpiryCountdown(expiryTimestamp, currentTime);
    const hasChallengeExpired = Boolean(expiryTimestamp && expiryTimestamp <= currentTime && !isAccepted);
    const isExpiryUnderOneHour = Boolean(
        expiryTimestamp &&
        expiryTimestamp > currentTime &&
        (expiryTimestamp - currentTime) < 60 * 60 * 1000
    );

    // Get resolution condition value for display
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
    console.log({ isResolutionPending, isResolutionResolved });

    let ctaLabel = "";
    let ctaDisabled = false;
    let ctaClassName = "";
    const ctaBaseClassName =
        "w-full h-11 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2";
    const activeCtaClassName =
        `${ctaBaseClassName} cursor-pointer bg-[#246044] hover:bg-[#2b7351] text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
    const activePvpCtaClassName =
        `${ctaBaseClassName} cursor-pointer bg-[#0c9d63] opacity-80 hover:bg-[#0a7d4f] border border-gray-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed`;
    const ongoingCtaClassName =
        `${ctaBaseClassName} cursor-not-allowed bg-[#008080] opacity-70 border border-gray-500 text-white shadow-lg`;
    const expiredCtaClassName =
        `${ctaBaseClassName} bg-red-100 border border-red-300 text-red-700 shadow-sm cursor-not-allowed`;
    const resolvingCtaClassName =
        `${ctaBaseClassName} bg-amber-100 border border-amber-300 text-amber-700 shadow-sm cursor-not-allowed`;
    const completedCtaClassName =
        `${ctaBaseClassName} bg-gray-200 border border-gray-300 text-gray-700 shadow-sm cursor-not-allowed`;

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
    const isOngoingCta = ctaLabel.startsWith("ONGOING");
    const showCreatorCtaHoverHint = isCreator && ctaLabel === "COUNTER";
    const isBattleOnState = !isResolveTimeAchieved && hasOpponents;
    const isChallengeExpiredState = isExpireTimeAchieved && !hasOpponents;
    const isResolvingState = isResolveTimeAchieved && hasOpponents && isResolutionPending;
    const isCompletedState = isResolveTimeAchieved && hasOpponents && isResolutionResolved;
    const isExpiresInState = !isExpireTimeAchieved && !hasOpponents;

    const expiryStatusText = isCompletedState
        ? "Challenge completed"
        : isResolvingState
            ? "Challenge is resolving"
            : isBattleOnState
                ? "The battle is on"
                : isChallengeExpiredState
                    ? "Challenge expired"
                    : "Challenge expires in";
    const expiryTooltipText = isCompletedState
        ? "this challenge has been resolved and marked completed."
        : isResolvingState
            ? "resolve time has been reached and this challenge is currently resolving."
            : isBattleOnState
                ? `max opponents have joined and the battle is live. It resolves in ${endsByCountdown}.`
                : isChallengeExpiredState
                    ? "expire time was reached before anyone joined, so this challenge is expired."
                    : `no opponents yet. This challenge will expire in ${timeRemaining} if nobody joins.`;

    return (
        <>
            <div
                className="bg-[#f8ede7] rounded-2xl border border-gray-400 p-4 shadow-sm border border-gray-300 hover:shadow-lg transition-shadow block"
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Image
                            src={assetIcon}
                            alt={assetName}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
                        />
                        <div>
                            <h3 className="text-gray-900 leading-tight">
                                {isManualResolution ? (
                                    <span
                                        onClick={handleClick}
                                        className="block text-[16px] font-bold tracking-tight cursor-pointer"
                                    >
                                        {title}
                                    </span>
                                ) : isResolveTimeAchieved ? (
                                    <span
                                        onClick={handleClick}
                                        className="block text-[16px] font-bold tracking-tight cursor-pointer"
                                    >
                                        {title} by {resolveDateByText}
                                    </span>
                                ) : (
                                    <>
                                        <span
                                            onClick={handleClick}
                                            className="block text-[16px] font-bold tracking-tight cursor-pointer"
                                        >
                                            {title} In
                                        </span>
                                        <span
                                            onClick={handleClick}
                                            className="block text-[16px] font-bold tracking-tight cursor-pointer"
                                        >
                                            Next
                                            <span className="ml-2 inline-flex items-center gap-1.5">
                                                <span className="text-sm font-bold text-emerald-900">{endsByCountdown}</span>
                                                <span className="group relative inline-flex items-center">
                                                    <svg className="w-3.5 h-3.5 text-emerald-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            </h3>
                        </div>
                    </div>
                    {/* Watchlist Button */}
                    <button
                        type="button"
                        onClick={handleBookmarkClick}
                        aria-label={isBookmarked ? "Remove Pin" : "Pin this"}
                        title={isBookmarked ? "Remove pin" : "Pin this"}
                        className="cursor-pointer p-2 bg-white/50 hover:bg-white/20 border border-gray-400 hover:text-gray-500 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-black rotate-45" stroke="currentColor" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17v4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3h8l-1 6 3 3H6l3-3-1-6z" />
                        </svg>
                    </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-3"></div>

                {/* Challenge Mode Info */}
                <div onClick={handleClick} className="flex items-center justify-center gap-2 mb-4 cursor-pointer">
                    <h2 className="text-sm font-medium text-black">
                        {modeMeta.display || (challengeMode === "pvp" ? "PVP Mode" : "Multi Mode")}
                    </h2>

                    <div className="relative group inline-flex ml-[-4px]">
                        <svg
                            className="w-4 h-4 text-black cursor-help"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>

                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-center pointer-events-none">
                            {challengeMode === "pvp"
                                ? "The creator has set this challenge to PVP mode, meaning it's a 1v1 challenge only."
                                : "The creator has set this challenge to pool mode, meaning multiple people can join."}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </div>


                {/* VS Section */}
                <div className="mb-5">
                    <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
                        {/* Challenger Profile */}
                        <div
                            onClick={(e) => openProfile(e, creator.wallet_address)}
                            className="relative group flex flex-col items-center cursor-pointer"
                        >
                            <div className={`w-[120px] h-[140px] flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${hasWon
                                ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400"
                                : hasLost
                                    ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                    : "bg-white/80 border-2 border-[#d4a574]/30"
                                }`}>
                                {/* Winner Crown */}
                                {hasWon && (
                                    <div className="text-2xl animate-bounce">
                                        👑
                                    </div>
                                )}

                                {/* Avatar */}
                                <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${hasWon ? "border-amber-400" : "border-[#d4a574]"
                                    } shadow-md`}>
                                    <Image
                                        src={creatorProfileImage}
                                        alt={creatorName}
                                        width={56}
                                        height={56}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Label */}
                                <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                    {challengeMode === "multi" ? "CHALLENGERS" : "CHALLENGER"}
                                </div>

                                {/* Info */}
                                <div className="mt-2 text-center">
                                    <p className="font-bold text-[#2d1f1a] text-xs">{creatorDisplayName}</p>
                                    <p className="text-[10px] text-[#8b7355] mt-0.5">
                                        {hasWon ? "Won!" : hasLost ? "Lost" : creatorWalletDisplay}
                                    </p>
                                </div>
                            </div>
                            {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                <button
                                    type="button"
                                    onClick={(e) => openBetForm(e)}
                                    className={`absolute -bottom-4.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-[28px] font-black leading-none shadow-md transition hover:scale-105 ${hasWon
                                        ? "border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-700 hover:from-amber-200 hover:to-yellow-100"
                                        : hasLost
                                            ? "border-red-300 bg-gradient-to-br from-red-100 to-rose-50 text-red-700 hover:from-red-200 hover:to-rose-100"
                                            : "border-[#d4a574]/40 bg-white/90 text-[#2d1f1a] hover:bg-white"
                                        }`}
                                    aria-label="counter"
                                    title="counter"
                                >
                                    +
                                </button>
                            )}
                        </div>

                        {/* VS Badge or Pending Badge */}
                        <div className="flex flex-col items-center justify-center px-2">
                            <>
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] flex items-center justify-center shadow-lg">
                                    {isOngoingCta ? (
                                        <video
                                            src="/animations/Sword%20Battle.webm"
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-10 h-10 object-contain"
                                        />
                                    ) : (
                                        <span className="text-lg font-black text-[#f3e1d7]">VS</span>
                                    )}
                                </div>
                                {/* Pool Display */}
                                <div className="mt-2 px-3 py-1.5 bg-emerald-50 rounded-lg text-center border border-emerald-200">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-[9px] text-emerald-600 font-medium">Pool</span>
                                        <div className="group relative">
                                            <svg className="w-3 h-3 text-emerald-500 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-center">
                                                the total money locked in the escrow contract
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-emerald-600">{poolDisplay}</p>
                                </div>
                            </>
                        </div>

                        {/* opponent Profile */}
                        {hasOpponentInfo ? (
                            <div
                                onClick={(e) => openProfile(e, opponentInfo?.wallet_address)}
                                className="relative group flex flex-col items-center cursor-pointer"
                            >
                                <div className={`w-[120px] h-[140px] flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${hasLost
                                    ? "bg-gradient-to-br from-amber-100 to-yellow-50 border-2 border-amber-400"
                                    : hasWon
                                        ? "bg-gradient-to-br from-red-100 to-rose-50 border-2 border-red-300"
                                        : "bg-white/80 border-2 border-[#d4a574]/30"
                                    }`}>
                                    {/* Winner Crown */}
                                    {hasLost && (
                                        <div className="text-2xl animate-bounce">
                                            👑
                                        </div>
                                    )}

                                    {/* Avatar */}
                                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 ${hasLost ? "border-amber-400" : "border-[#d4a574]"
                                        } shadow-md`}>
                                        <Image
                                            src={opponentProfileImage}
                                            alt={opponentDisplayName}
                                            width={56}
                                            height={56}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {/* Count Badge */}
                                    {challenge.mode === "pool" && (challenge.total_opponents ?? 0) > 1 && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                                            <span className="text-[9px] font-bold text-white">+{(challenge.total_opponents ?? 0) - 1}</span>
                                        </div>
                                    )}
                                    {/* Label */}
                                    <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                        {challenge.mode === "pool" ? "POOL" : "Opponent"}
                                    </div>

                                    {/* Info */}
                                    <div className="mt-2 text-center">
                                        <p className="font-bold text-[#2d1f1a] text-xs">{opponentDisplayName}</p>
                                        <p className="text-[10px] text-[#8b7355] mt-0.5">
                                            {hasLost ? "Won!" : hasWon ? "Lost" : opponentWalletDisplay}
                                        </p>
                                    </div>
                                </div>
                                {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                    <button
                                        type="button"
                                        onClick={(e) => openBetForm(e)}
                                        className={`absolute -bottom-4.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-[28px] font-black leading-none shadow-md transition hover:scale-105 ${hasLost
                                            ? "border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-700 hover:from-amber-200 hover:to-yellow-100"
                                            : hasWon
                                                ? "border-red-300 bg-gradient-to-br from-red-100 to-rose-50 text-red-700 hover:from-red-200 hover:to-rose-100"
                                                : "border-[#d4a574]/40 bg-white/90 text-[#2d1f1a] hover:bg-white"
                                            }`}
                                        aria-label="counter"
                                        title="counter"
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Placeholder for pending state */
                            <div className="flex flex-col items-center">
                                <div className="relative w-[120px] h-[140px] flex flex-col items-center justify-center p-3 rounded-xl opponent-placeholder-bg border-2 border-dashed border-[#d4a574]/30">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-[#d4a574]/50 opponent-placeholder-icon">
                                        <span className="text-xl">❓</span>
                                    </div>
                                    <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                        {challenge.mode === "multi" ? " OPPONENTS" : "OPPONENT"}
                                    </div>
                                    {isExpireTimeAchieved && !hasOpponents ? (
                                        <div className="mt-2 text-center">
                                            <p className="text-[10px] text-[#8b7355] mt-0.5">No one joined, challenge expired!</p>
                                        </div>
                                    ) :
                                        (<div className="mt-2 text-center">
                                            <p className="font-semibold text-[#8b7355] text-xs">No one yet!</p>
                                            <p className="text-[10px] text-[#8b7355] mt-0.5">Be the first to join!</p>
                                        </div>)}
                                    {!isExpireTimeAchieved && !isCreator && isPoolMode && (
                                        <button
                                            type="button"
                                            onClick={(e) => openBetForm(e)}
                                            className={`absolute -bottom-4.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 text-[28px] font-black leading-none shadow-md transition hover:scale-105 ${hasWon
                                                ? "border-amber-400 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-700 hover:from-amber-200 hover:to-yellow-100"
                                                : hasLost
                                                    ? "border-red-300 bg-gradient-to-br from-red-100 to-rose-50 text-red-700 hover:from-red-200 hover:to-rose-100"
                                                    : "border-[#d4a574]/40 bg-white/90 text-[#2d1f1a] hover:bg-white"
                                                }`}
                                            aria-label="counter"
                                            title="counter"
                                        >
                                            +
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* CTA Button */}
                <div className="flex gap-2">
                    <div className="group relative w-full">
                        <button
                            disabled={ctaDisabled}
                            onClick={(e) => {
                                e.preventDefault();
                                if (ctaDisabled) return;
                                openBetForm(e);
                            }}
                            className={ctaClassName}
                        >
                            {isLoading && isPoolMode ? "JOINING..." : ctaLabel}
                        </button>
                        {showCreatorCtaHoverHint && (
                            <div className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-1 -translate-x-1/2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                You created this challenge
                            </div>
                        )}
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
                    onClose={() => closeBetForm()}
                    onSubmit={(e) => handleJoinChallenge(e)}
                    onBetInputChange={(value) => {
                        setBetInput(value);
                        if (betError) {
                            setBetError("");
                        }
                    }}
                    onJoinSideChange={(side) => setJoinSide(side)}
                />

                {/* Challenge Expiry */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mt-1.5">
                    {isExpiresInState ? (
                        <>
                            <span>{expiryStatusText}</span>
                            <span className={`font-medium ${isExpiryUnderOneHour ? "text-red-600" : "text-gray-900"}`}>
                                {timeRemaining}
                            </span>
                        </>
                    ) : (
                        <span
                            className={`font-semibold ${isCompletedState
                                ? "text-gray-700"
                                : isResolvingState
                                    ? "text-amber-700"
                                    : isBattleOnState
                                        ? "text-[#008080]"
                                        : "text-red-600"
                                }`}
                        >
                            {expiryStatusText}
                        </span>
                    )}
                    <div className="group relative">
                        <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            {expiryTooltipText}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-2"></div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">Created <span className="font-semibold text-gray-900">{createdTimeText}</span></span>
                        <div className="group relative">
                            <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                This challenge was created {createdTimeText} and will end on {challengeEndTimeText} if accepted.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleShareChallenge}
                            className="flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer"
                            title="Share challenge link"
                            aria-label="Share challenge link"
                        >
                            <svg className="w-5 h-5 text-gray-500 hover:text-gray-900 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                        {/* Eye Icon */}
                        <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-900">0</span>
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .opponent-placeholder-bg {
                    animation: opponent-bg-blink 1.5s ease-in-out infinite;
                }

                .opponent-placeholder-icon {
                    animation: opponent-icon-blink 1.5s ease-in-out infinite;
                }

                @keyframes opponent-bg-blink {
                    0%,
                    100% {
                        background-color: rgba(255, 255, 255, 0.4);
                    }
                    50% {
                        background-color: rgba(255, 255, 255, 0.2);
                    }
                }

                @keyframes opponent-icon-blink {
                    0%,
                    100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.65;
                    }
                }
            `}</style>
        </>
    );
}

