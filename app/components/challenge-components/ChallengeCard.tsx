"use client";

import React from "react";
import Image from "next/image";
import {
    ChallengeListItem,
    getChallengeById,
    joinChallenge,
} from "@/app/lib/challenges-service/challenges";
import { useUserStore } from "@/app/store/useUserStore";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import {
    buildAcceptChallengeTx,
    fetchAllChallenges,
    solToLamports,
} from "@/app/lib/rektofun-program";
import { PublicKey } from "@solana/web3.js";


interface ChallengeCardProps {
    challenge: ChallengeListItem;
    onClick?: (challenge: ChallengeListItem) => void;
    onRekt?: (challenge: ChallengeListItem) => void;
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

// Helper types for resolution_details
export function ChallengeCard({
    challenge,
    onClick,
    onRekt
}: ChallengeCardProps) {
    const { user } = useUserStore();
    const { authenticated, login, program, publicKey, sendTransaction } = useSolanaWallet();
    const [isLoading, setIsLoading] = React.useState(false);
    const [isBetFormOpen, setIsBetFormOpen] = React.useState(false);
    const [betInput, setBetInput] = React.useState(String(challenge.initial_bet ?? ""));
    const [betError, setBetError] = React.useState("");
    const [currentTime, setCurrentTime] = React.useState(() => Date.now());

    React.useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);

        return () => window.clearInterval(interval);
    }, []);

    const handleClick = () => {
        if (onClick) {
            onClick(challenge);
        } else if (onRekt) {
            onRekt(challenge);
        }
    };

    const openBetForm = (e: React.MouseEvent) => {
        e.stopPropagation();
        setBetInput(String(challenge.initial_bet ?? ""));
        setBetError("");
        setIsBetFormOpen(true);
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
        const minAcceptBet = challenge.min_accept_bet;
        const maxAcceptBet = challenge.max_accept_bet;

        if (!Number.isFinite(parsedBetAmount) || parsedBetAmount <= 0) {
            setBetError("Please enter a valid bet amount.");
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
            const creatorPubkey = new PublicKey(challenge.creator.wallet_address);
            const onChainChallenges = await fetchAllChallenges(program);
            const expectedBetLamports = solToLamports(challenge.initial_bet ?? 0);
            const expectedExpireAt = Math.floor(new Date(challengeDetails.expire_time).getTime() / 1000);
            const expectedResolveAt = Math.floor(new Date(challengeDetails.resolve_time).getTime() / 1000);
            const expectedAsset = challengeDetails.ticker || challenge.market.name;

            const onChainChallenge = onChainChallenges.find((candidate) =>
                candidate.creator.equals(creatorPubkey) &&
                candidate.status === "Open" &&
                candidate.asset === expectedAsset &&
                candidate.betAmount === expectedBetLamports &&
                candidate.expiresAt === expectedExpireAt &&
                candidate.resolvesAt === expectedResolveAt
            );

            if (!onChainChallenge) {
                throw new Error("Matching on-chain challenge was not found.");
            }

            if (parsedBetAmount !== challenge.initial_bet) {
                throw new Error(
                    `This on-chain challenge currently requires an exact ${challenge.initial_bet} ${betCurrency} match.`
                );
            }

            const tx = await buildAcceptChallengeTx(
                program,
                publicKey,
                onChainChallenge.publicKey,
                creatorPubkey
            );

            await sendTransaction(tx);

            await joinChallenge({
                challenge_id: challenge.id,
                user_id: user.id,
                side: "opponent",
                bet_amount: parsedBetAmount,
            });
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

    // ChallengeListItem doesn't have metadata or resolution_details in the same way as Challenge
    // We use the flattened properties provided by ChallengeListItem
    const uiMeta: UIMetadata = {};
    const assetMeta: AssetMetadata = {
        name: challenge.market.name,
        icon: challenge.market.icon,
    };
    const betMeta: BetMetadata = {
        amount: challenge.initial_bet,
        currency: "SOL", // Defaulting to SOL as per original code
    };
    const modeMeta: ModeMetadata = {
        type: challenge.mode === "pool" ? "multi" : "pvp",
        display: challenge.mode === "pool" ? "Pool Mode" : "PVP Mode",
    };
    const labelsMeta: LabelsMetadata = {
        creator: challenge.creator.username,
    };
    const poolMeta: PoolMetadata = {
        display: `$${challenge.total_pool} SOL`,
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
    const assetSymbol = assetMeta.symbol || challenge.market.name || "BTC";
    const assetIcon = assetMeta.icon || "/scribbles/btc.png";
    const assetName = assetMeta.name || assetSymbol;

    // Get title
    const title = uiMeta.title || challenge.title || `Bet on ${assetSymbol}`;

    // Get bet amount
    const betAmount = betMeta.amount || 0;
    const betCurrency = betMeta.currency || "SOL";

    // Get pool display
    const poolDisplay = poolMeta.display || "$0 SOL";

    // Calculate time remaining from expire_time
    const timeRemaining = challenge.expire_time
        ? `${Math.floor((new Date(challenge.expire_time).getTime() - currentTime) / 60000)}m`
        : "N/A";

    // Get resolution condition value for display
    return (
        <div
            onClick={handleClick}
            className="bg-[#f8ede7] rounded-2xl p-4 shadow-sm border border-gray-300 hover:shadow-lg transition-shadow block cursor-pointer"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                        <Image
                            src={assetIcon}
                            alt={assetName}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
                        />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-base leading-tight">
                            {title}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden">
                                <Image
                                    src={assetIcon}
                                    alt={assetName}
                                    width={16}
                                    height={16}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-sm text-gray-600">{labelsMeta.creator || "Creator"}</span>
                        </div>
                    </div>
                </div>
                {/* Watchlist Button */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-3"></div>

            {/* Challenge Mode Info */}
            <div className="group relative flex items-center justify-center gap-2 mb-4">
                <h2 className="text-sm font-medium text-black">
                    {modeMeta.display || (challengeMode === "pvp" ? "PVP Mode" : "Multi Mode")}
                </h2>
                <svg className="w-4 h-4 text-black cursor-help ml-[-4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-center">
                    {challengeMode === "pvp"
                        ? "The creator has set this challenge to PVP mode, meaning it's a 1v1 challenge only."
                        : "The creator has set this challenge to pool mode, meaning multiple people can join."}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>

            {/* VS Section */}
            <div className="mb-5">
                <div className="flex flex-row items-center justify-center gap-2 sm:gap-4">
                    {/* Challenger Profile */}
                    <div className="relative group flex flex-col items-center">
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
                                    src={assetIcon}
                                    alt={assetName}
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
                                <p className="font-bold text-[#2d1f1a] text-xs">{assetSymbol}</p>
                                <p className="text-[10px] text-[#8b7355] mt-0.5">
                                    {hasWon ? "Won!" : hasLost ? "Lost" : "Created"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* VS Badge or Pending Badge */}
                    <div className="flex flex-col items-center justify-center px-2">
                        <>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2d1f1a] to-[#4a3830] flex items-center justify-center shadow-lg">
                                <span className="text-lg font-black text-[#f3e1d7]">VS</span>
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
                            {hasWon || hasLost ? (
                                <div className="mt-1 text-center">
                                    <p className={`text-lg font-black ${hasWon ? "text-amber-500" : "text-red-500"}`}>
                                        {hasWon ? "+" : "-"}{betAmount} {betCurrency}
                                    </p>
                                </div>
                            ) : null}
                        </>
                    </div>

                    {/* Defender Profile */}
                    {isAccepted && challenge.opponent_info ? (
                        <div className="relative group flex flex-col items-center">
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
                                        src={challenge.opponent_info.profile_image}
                                        alt={challenge.opponent_info.username}
                                        width={56}
                                        height={56}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Count Badge */}
                                {challenge.mode === "multi" && (challenge.total_opponents ?? 0) > 1 && (
                                    <div className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                                        <span className="text-[9px] font-bold text-white">+{(challenge.total_opponents ?? 0) - 1}</span>
                                    </div>
                                )}
                                {/* Label */}
                                <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                    {challenge.mode === "pool" ? "POOL" : "DEFENDER"}
                                </div>

                                {/* Info */}
                                <div className="mt-2 text-center">
                                    <p className="font-bold text-[#2d1f1a] text-xs">{challenge.opponent_info.username}</p>
                                    <p className="text-[10px] text-[#8b7355] mt-0.5">
                                        {hasLost ? "Won!" : hasWon ? "Lost" : "Defending"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Placeholder for pending state */
                        <div className="w-[120px] h-[140px] flex flex-col items-center justify-center p-3 rounded-xl bg-white/40 border-2 border-dashed border-[#d4a574]/30">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-2 border-[#d4a574]/50">
                                <span className="text-xl">❓</span>
                            </div>
                            <div className="mt-1 px-1.5 py-0.5 bg-[#2d1f1a] text-white text-[9px] font-bold rounded-full">
                                {challenge.mode === "multi" ? "DEFENDERS" : "DEFENDER"}
                            </div>
                            <div className="mt-2 text-center">
                                <p className="font-semibold text-[#8b7355] text-xs">No one yet!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CTA Button */}
            <div className="flex gap-2">
                {challenge.mode === "pool" ? (
                    <>
                        <button
                            disabled={isLoading}
                            onClick={(e) => { e.preventDefault(); handleJoinChallenge(e) }}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-[#246044] hover:bg-[#2b7351] text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "JOINING..." : "JOIN CHALLENGE"}
                            {!isLoading && <span className="text-lg">⚔️</span>}
                        </button>
                    </>
                ) : (
                    user?.wallet_address !== challenge.creator.wallet_address && <button
                        disabled={isLoading}
                        onClick={(e) => { e.preventDefault(); 
                            openBetForm(e) }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#246044] hover:bg-[#2b7351] text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "JOINING..." : "ACCEPT CHALLENGE"}
                        {!isLoading && <span className="text-xl">⚔️</span>}
                    </button>
                )}
            </div>

            {isBetFormOpen && (
                <div
                    onClick={closeBetForm}
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-2xl bg-[#f8ede7] border border-gray-200 shadow-2xl p-5"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Place your bet</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Enter the amount you want to bet on this challenge.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeBetForm}
                                disabled={isLoading}
                                className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-60"
                            >
                                x
                            </button>
                        </div>

                        <form onSubmit={handleJoinChallenge} className="mt-4 space-y-4">
                            <div>
                                <label htmlFor={`bet-amount-${challenge.id}`} className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Bet amount
                                </label>
                                <input
                                    id={`bet-amount-${challenge.id}`}
                                    type="number"
                                    min={challenge.min_accept_bet ?? 0}
                                    max={challenge.max_accept_bet}
                                    step="any"
                                    value={betInput}
                                    onChange={(e) => {
                                        setBetInput(e.target.value);
                                        if (betError) {
                                            setBetError("");
                                        }
                                    }}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-[#246044] focus:ring-2 focus:ring-[#246044]/20"
                                    placeholder={`Enter amount in ${betCurrency}`}
                                />
                                {betError && (
                                    <p className="mt-1 text-xs text-red-600">{betError}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Default bet: {challenge.initial_bet} {betCurrency}
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2.5 px-4 rounded-xl bg-[#246044] hover:bg-[#2b7351] text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "PLACING BET..." : "BET"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Challenge Expiry */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mt-1.5">
                <span>Challenge expires in</span>
                <span className="font-medium text-gray-900">{timeRemaining}</span>
                <div className="group relative">
                    <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        This challenge will expire in {timeRemaining}, you will not be able to join after that.
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
                    <span className="text-sm">Created <span className="font-semibold text-gray-900">2h ago</span></span>
                    <div className="group relative">
                        <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            This challenge was created 2 hours ago and will end on September 30, 2024 at 3:00 PM UTC if accepted.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    );
}
