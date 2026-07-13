"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    Activity,
    ArrowLeft,
    CalendarDays,
    Check,
    CircleDollarSign,
    Clock3,
    Coins,
    Loader2,
    MessageSquareText,
    ShieldCheck,
    Swords,
    Trophy,
    Eye,
    Users,
    Wallet,
    X,
    Zap,
} from "lucide-react";
import { useUserStore } from "@/app/store/useUserStore";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { getParentCategories, getCategoriesByParent, Category } from "@/app/lib/category-service/category";
import { createChallenge } from "@/app/lib/challenges-service/challenges";
import { Transaction } from "@solana/web3.js";
import { getReadonlyConnection } from "@/app/lib/rektofun-program";
import { stripUsdcQuote } from "@/app/lib/format-market-label";

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

type TxStatus = "idle" | "building" | "signing" | "confirming" | "success" | "error";
type MarketType = "crypto" | "sports";
type ChallengeFormat = "price" | "statement";
type ChallengeMode = "pvp" | "team";
type ComposerPanel = "topic" | "stake" | "timing" | "players" | null;
type AssetPriceState = {
    key: string;
    asset: string;
    currentPrice: number | null;
    status: "ready" | "failed";
};

const MAX_STATEMENT_LENGTH = 220;
const MIN_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 7 * 24 * 60;

const formatDuration = (duration: { hours: number; minutes: number }) => {
    const totalMinutes = duration.hours * 60 + duration.minutes;
    if (totalMinutes <= 0) return "Set window";
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return [days ? `${days}d` : "", hours ? `${hours}h` : "", minutes ? `${minutes}m` : ""]
        .filter(Boolean)
        .join(" ");
};

const formatDate = (date: Date) =>
    date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });

const toDateTimeLocalValue = (date: Date) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
};

const durationFromMinutes = (totalMinutes: number) => ({
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
});

const formatPrice = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return "$—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: parsed < 1 ? 6 : 2,
    }).format(parsed);
};

const targetPriceInputValue = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "";
    const decimals = value >= 1 ? 2 : value >= 0.01 ? 4 : 8;
    return value.toFixed(decimals).replace(/\.?0+$/, "");
};

export function CreateChallengeModal({ isOpen, onClose, onCreated }: CreateChallengeModalProps) {
    const [marketType, setMarketType] = useState<MarketType>("crypto");
    const [challengeFormat, setChallengeFormat] = useState<ChallengeFormat>("price");
    const [challengeMode, setChallengeMode] = useState<ChallengeMode>("pvp");
    const [statement, setStatement] = useState("");
    const [betAmount, setBetAmount] = useState(1);
    const [predictionDirection, setPredictionDirection] = useState<"Above" | "Below">("Above");
    const [predictionPrice, setPredictionPrice] = useState("");
    const [assetPriceState, setAssetPriceState] = useState<AssetPriceState>({
        key: "",
        asset: "",
        currentPrice: null,
        status: "failed",
    });
    const [selectedDate, setSelectedDate] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [composerNow] = useState(() => Date.now());
    const [duration, setDuration] = useState({ hours: 4, minutes: 0 });

    const [activePanel, setActivePanel] = useState<ComposerPanel>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [childCategories, setChildCategories] = useState<Category[]>([]);
    const [selectedChildCategory, setSelectedChildCategory] = useState<Category | null>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const [txStatus, setTxStatus] = useState<TxStatus>("idle");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const statementRef = useRef<HTMLTextAreaElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);
    const { user } = useUserStore();
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("solana");

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape" || isSubmitting) return;
            if (isPreviewOpen) {
                setIsPreviewOpen(false);
                return;
            }
            if (activePanel) {
                setActivePanel(null);
                return;
            }
            onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [activePanel, isOpen, isPreviewOpen, isSubmitting, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        const loadCategories = async () => {
            setIsLoadingCategories(true);
            setCategoryError(null);
            try {
                const parents = await getParentCategories();
                if (cancelled) return;
                const currentMarket = marketType;
                const marketParent = parents.find((category) => category.category.trim().toLowerCase() === currentMarket);
                const children = await getCategoriesByParent(
                    marketParent?.category ?? (currentMarket === "crypto" ? "Crypto" : "Sports"),
                );
                if (cancelled) return;
                setChildCategories(children);
                setSelectedChildCategory((current) =>
                    current?.parent_category?.trim().toLowerCase() === currentMarket
                        ? current
                        : children[0] ?? null,
                );
            } catch (error) {
                if (cancelled) return;
                console.error("Failed to load challenge categories:", error);
                setCategoryError("Couldn’t load topics. Try again.");
            } finally {
                if (!cancelled) setIsLoadingCategories(false);
            }
        };

        loadCategories();
        return () => {
            cancelled = true;
        };
    }, [isOpen, marketType]);

    const switchMarket = (nextMarket: MarketType) => {
        if (nextMarket === marketType) return;
        setMarketType(nextMarket);
        setChallengeFormat(nextMarket === "sports" ? "statement" : "price");
        setSelectedChildCategory(null);
        setChildCategories([]);
        setFormError(null);
        setCategoryError(null);
        setActivePanel("topic");
        setIsLoadingCategories(true);
    };

    const togglePanel = (panel: Exclude<ComposerPanel, null>) => {
        setActivePanel((current) => current === panel ? null : panel);
        setFormError(null);
    };

    const handleDurationChange = (nextDuration: { hours: number; minutes: number }) => {
        setDuration(nextDuration);
        const expiryTime = composerNow + (nextDuration.hours * 60 + nextDuration.minutes) * 60 * 1000;
        if (selectedDate.getTime() < expiryTime) {
            setSelectedDate(new Date(expiryTime + 30 * 60 * 1000));
        }
    };

    const handleResolutionDateChange = (nextDate: Date) => {
        const expiryTime = composerNow + (duration.hours * 60 + duration.minutes) * 60 * 1000;
        setSelectedDate(nextDate.getTime() < expiryTime ? new Date(expiryTime) : nextDate);
    };

    const isPriceFeed = marketType === "crypto" && challengeFormat === "price";
    const rawTopicLabel = selectedChildCategory?.category ?? (marketType === "sports" ? "All sports" : "Choose asset");
    const topicLabel = stripUsdcQuote(rawTopicLabel);
    const selectedAssetSymbol = stripUsdcQuote(selectedChildCategory?.category)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
    const assetPriceRequestKey = `${selectedAssetSymbol}:${predictionDirection}`;
    const isAssetPriceLoading = isPriceFeed
        && Boolean(selectedAssetSymbol)
        && assetPriceState.key !== assetPriceRequestKey;
    const hasAssetPriceError = isPriceFeed
        && Boolean(selectedAssetSymbol)
        && assetPriceState.key === assetPriceRequestKey
        && assetPriceState.status === "failed";
    const generatedStatement = `${stripUsdcQuote(selectedChildCategory?.category) || "Asset"} ${predictionDirection.toLowerCase()} ${formatPrice(predictionPrice)}`;
    const totalDurationMinutes = duration.hours * 60 + duration.minutes;
    const estimatedPvpPool = betAmount * 2;
    const estimatedPayout = estimatedPvpPool * 0.98;

    useEffect(() => {
        if (!isOpen || !isPriceFeed || !selectedAssetSymbol) return;
        let cancelled = false;

        fetch(`/api/market-chart?asset=${encodeURIComponent(selectedAssetSymbol)}&range=24H`)
            .then(async (response) => {
                if (!response.ok) throw new Error("Asset price unavailable");
                return response.json() as Promise<{ candles: Array<{ close: number }> }>;
            })
            .then((data) => {
                const currentPrice = Number(data.candles.at(-1)?.close);
                if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
                    throw new Error("Invalid asset price");
                }
                if (cancelled) return;

                const targetPrice = currentPrice * (predictionDirection === "Above" ? 1.1 : 0.9);
                setPredictionPrice(targetPriceInputValue(targetPrice));
                setAssetPriceState({
                    key: assetPriceRequestKey,
                    asset: selectedAssetSymbol,
                    currentPrice,
                    status: "ready",
                });
            })
            .catch((error) => {
                if (cancelled) return;
                console.error(`Failed to load ${selectedAssetSymbol} price:`, error);
                setAssetPriceState({
                    key: assetPriceRequestKey,
                    asset: selectedAssetSymbol,
                    currentPrice: null,
                    status: "failed",
                });
            });

        return () => {
            cancelled = true;
        };
    }, [assetPriceRequestKey, isOpen, isPriceFeed, predictionDirection, selectedAssetSymbol]);

    const validateForm = ({ requireProfile = true }: { requireProfile?: boolean } = {}) => {
        if (marketType === "crypto" && !selectedChildCategory) {
            setActivePanel("topic");
            return "Choose a crypto asset.";
        }
        if (!isPriceFeed && statement.trim().length < 8) {
            window.setTimeout(() => statementRef.current?.focus(), 0);
            return "Write a clear challenge statement.";
        }
        if (isPriceFeed && (!Number.isFinite(Number(predictionPrice)) || Number(predictionPrice) <= 0)) {
            window.setTimeout(() => priceRef.current?.focus(), 0);
            return "Enter a valid target price.";
        }
        if (!Number.isFinite(betAmount) || betAmount < 1) {
            setActivePanel("stake");
            return "Minimum stake is 1 USDC.";
        }
        if (totalDurationMinutes < MIN_DURATION_MINUTES || totalDurationMinutes > MAX_DURATION_MINUTES) {
            setActivePanel("timing");
            return "Join window must be between 5 minutes and 7 days.";
        }
        if (requireProfile && !user?.id) return "Finish your profile before creating a challenge.";
        return null;
    };

    const handleOpenPreview = () => {
        const validationError = validateForm({ requireProfile: false });
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setActivePanel(null);
        setFormError(null);
        setIsPreviewOpen(true);
    };

    const getStatusLabel = () => {
        if (txStatus === "building") return "Preparing challenge";
        if (txStatus === "signing") return "Confirm in wallet";
        if (txStatus === "confirming") return "Publishing challenge";
        return null;
    };

    const handleCreateChallenge = async () => {
        const validationError = validateForm();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        if (!address || !isConnected) {
            open();
            return;
        }
        if (!walletProvider) {
            setFormError("Wallet isn’t ready. Reconnect and try again.");
            return;
        }

        setIsSubmitting(true);
        setTxStatus("building");
        setFormError(null);

        try {
            const nowSec = Math.floor(Date.now() / 1000);
            const expiresAt = nowSec + duration.hours * 3600 + duration.minutes * 60;
            const resolvesAt = Math.max(Math.floor(selectedDate.getTime() / 1000), expiresAt);
            const topic = selectedChildCategory?.category?.trim() || (marketType === "sports" ? "SPORTS" : "CRYPTO");
            const onchainAsset = topic.replace(/[^a-zA-Z0-9/]/g, "").slice(0, 10) || marketType.toUpperCase();
            const ticker = onchainAsset.split("/", 1)[0].toUpperCase();
            const targetPrice = isPriceFeed ? Number(predictionPrice) : 0;
            const challengeStatement = isPriceFeed ? generatedStatement : statement.trim();

            const response = await fetch("/api/challenges/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userWallet: address,
                    asset: onchainAsset,
                    betAmountUsdc: betAmount,
                    targetPriceUsdCents: Math.floor(targetPrice * 100),
                    directionAbove: isPriceFeed ? predictionDirection === "Above" : true,
                    expiresAt,
                    resolvesAt,
                    challengeType: challengeMode,
                    maxTeamSize: 0,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create challenge");

            setTxStatus("signing");
            const transaction = Transaction.from(Buffer.from(data.serializedTx, "base64"));
            const signedTransaction = await (walletProvider as {
                signTransaction: (transaction: Transaction) => Promise<Transaction>;
            }).signTransaction(transaction);

            setTxStatus("confirming");
            const connection = getReadonlyConnection();
            const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                skipPreflight: false,
                preflightCommitment: "confirmed",
            });
            await connection.confirmTransaction(
                {
                    signature,
                    blockhash: data.blockhash,
                    lastValidBlockHeight: data.lastValidBlockHeight,
                },
                "confirmed",
            );

            await createChallenge({
                statement: challengeStatement,
                ticker,
                trading_pair: topic,
                target: targetPrice,
                initial_bet: betAmount,
                pool_size: betAmount,
                resolution_source: isPriceFeed ? "PRICE_FEED" : "COMMUNITY",
                metadata: {
                    onchain: {
                        challenge_pda: data.challengePDA,
                        creator_wallet: data.creator,
                        on_chain_challenge_id: data.challengeId,
                    },
                    composer: {
                        market: marketType,
                        format: isPriceFeed ? "price" : "statement",
                        topic,
                    },
                },
                creator: user!.id,
                resolution_method: isPriceFeed ? "PRICE_FEED" : "COMMUNITY",
                participants: 1,
                status: "OPEN",
                mode: challengeMode === "pvp" ? "PVP" : "TEAM",
                result: "TEAM_A",
                direction: predictionDirection === "Above" ? "UP" : "DOWN",
                expiry: new Date(expiresAt * 1000).toISOString(),
                resolution_date: new Date(resolvesAt * 1000).toISOString().split("T")[0],
                final_price: 0,
                category: marketType === "crypto" ? "Crypto" : "Sports",
            });

            setTxStatus("idle");
            setMarketType("crypto");
            setChallengeFormat("price");
            setChallengeMode("pvp");
            setStatement("");
            setPredictionPrice("");
            setBetAmount(1);
            setSelectedChildCategory(null);
            setDuration({ hours: 4, minutes: 0 });
            setSelectedDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
            setActivePanel(null);
            setIsPreviewOpen(false);
            onCreated();
        } catch (error) {
            console.error("Error creating challenge:", error);
            setTxStatus("error");
            setFormError(error instanceof Error ? error.message : "Something went wrong. Try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const statusLabel = getStatusLabel();

    return createPortal(
        <div className="create-challenge-overlay fixed inset-0 z-[250] flex items-center justify-center p-3 min-[380px]:p-4 sm:p-5">
            <button
                type="button"
                className="absolute inset-0 h-full w-full cursor-default bg-black/45 backdrop-blur-[2px]"
                onClick={() => {
                    if (isSubmitting) return;
                    setIsPreviewOpen(false);
                    setActivePanel(null);
                    onClose();
                }}
                aria-label="Close create challenge"
            />

            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-challenge-title"
                className="create-challenge-modal relative flex h-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden border-2 border-black bg-[#fffaf6] min-[380px]:max-h-[calc(100dvh-2rem)] sm:max-h-[92vh]"
            >
                <header className="flex shrink-0 items-center justify-between border-b-2 border-black px-3 py-2.5 sm:px-5 sm:py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center border-2 border-black bg-[#f5d547] sm:h-9 sm:w-9">
                            <Zap className="h-4.5 w-4.5 fill-black" />
                        </div>
                        <div>
                            <h2 id="create-challenge-title" className="text-base font-black tracking-tight text-[#17120f] sm:text-lg">
                                Create challenge
                            </h2>
                            <p className="text-[11px] font-bold text-[#7a6961]">Make your call.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (isSubmitting) return;
                            setIsPreviewOpen(false);
                            setActivePanel(null);
                            onClose();
                        }}
                        disabled={isSubmitting}
                        aria-label="Close create challenge"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-[#f5d547] disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div className="border-b border-black/15 px-3 py-2.5 sm:px-5 sm:py-3">
                        <div className="grid grid-cols-1 gap-2 min-[430px]:flex min-[430px]:flex-wrap min-[430px]:items-center">
                            <div className="grid w-full grid-cols-2 border-2 border-black bg-[#f3e1d7] p-0.5 min-[430px]:inline-flex min-[430px]:w-auto" aria-label="Challenge market">
                                <button
                                    type="button"
                                    onClick={() => switchMarket("crypto")}
                                    className={`inline-flex h-8 items-center justify-center gap-1.5 px-3 text-xs font-black transition-colors ${marketType === "crypto" ? "bg-black text-white" : "text-[#594b44] hover:bg-white/70"}`}
                                    aria-pressed={marketType === "crypto"}
                                >
                                    <Coins className="h-3.5 w-3.5" /> Crypto
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchMarket("sports")}
                                    className={`inline-flex h-8 items-center justify-center gap-1.5 px-3 text-xs font-black transition-colors ${marketType === "sports" ? "bg-black text-white" : "text-[#594b44] hover:bg-white/70"}`}
                                    aria-pressed={marketType === "sports"}
                                >
                                    <Trophy className="h-3.5 w-3.5" /> Sports
                                </button>
                            </div>

                            {marketType === "crypto" && (
                                <div className="grid w-full grid-cols-2 border border-black/20 bg-white p-0.5 min-[430px]:inline-flex min-[430px]:w-auto" aria-label="Challenge format">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setChallengeFormat("price");
                                            setFormError(null);
                                        }}
                                        className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-[11px] font-black transition-colors ${challengeFormat === "price" ? "bg-[#e85a2d] text-white" : "text-[#6d5d55] hover:bg-[#f3e1d7]"}`}
                                        aria-pressed={challengeFormat === "price"}
                                    >
                                        <Activity className="h-3.5 w-3.5" /> Price
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setChallengeFormat("statement");
                                            setFormError(null);
                                            window.setTimeout(() => statementRef.current?.focus(), 0);
                                        }}
                                        className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-[11px] font-black transition-colors ${challengeFormat === "statement" ? "bg-[#e85a2d] text-white" : "text-[#6d5d55] hover:bg-[#f3e1d7]"}`}
                                        aria-pressed={challengeFormat === "statement"}
                                    >
                                        <MessageSquareText className="h-3.5 w-3.5" /> Statement
                                    </button>
                                </div>
                            )}

                            <span className="ml-auto hidden items-center gap-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b7a72] sm:inline-flex">
                                {isPriceFeed ? <><Activity className="h-3 w-3" /> Auto resolved</> : <><ShieldCheck className="h-3 w-3" /> Community resolved</>}
                            </span>
                        </div>
                    </div>

                    <div className="px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-5">
                        <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-[#f5d547] text-sm font-black text-black">
                                    <span>{(user?.username || "Y").charAt(0).toUpperCase()}</span>
                                    {(user?.profile_image || user?.twitter_profile_image) && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={user.profile_image || user.twitter_profile_image || ""}
                                            alt={`${user.username || "User"} profile`}
                                            className="absolute inset-0 h-full w-full object-cover"
                                            onError={(event) => { event.currentTarget.style.display = "none"; }}
                                        />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex min-w-0 items-center gap-1.5">
                                        <span className="truncate text-sm font-black text-[#17120f]">{user?.username || "You"}</span>
                                        {(user?.user_type === "moderator" || user?.twitter_username) && (
                                            <VerifiedBadge
                                                isModerator={user.user_type === "moderator"}
                                                twitterUsername={user.twitter_username}
                                            />
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-[11px] font-semibold text-[#8b7a72]">challenges everyone</p>
                                </div>
                            </div>

                            <div className="mt-3 min-w-0 pl-0 sm:pl-[52px]">

                                {isPriceFeed ? (
                                    <div className="min-h-28 py-1 sm:min-h-32 sm:py-2">
                                        <button
                                            type="button"
                                            onClick={() => setActivePanel("topic")}
                                            className="mb-3 inline-flex items-center gap-1.5 border border-black/20 bg-[#f3e1d7] px-2 py-1 text-[11px] font-black text-[#594b44] hover:border-black"
                                        >
                                            <Coins className="h-3 w-3" /> {rawTopicLabel}
                                        </button>
                                        <div className="grid min-w-0 grid-cols-1 items-center gap-2 text-lg font-black leading-tight text-[#17120f] min-[430px]:flex min-[430px]:flex-wrap min-[430px]:gap-x-2 min-[430px]:gap-y-3 sm:text-2xl">
                                            <span className="min-w-0 truncate">{topicLabel || "This asset"}</span>
                                            <div className="grid w-full grid-cols-2 border-2 border-black bg-white p-0.5 min-[430px]:inline-flex min-[430px]:w-auto">
                                                {(["Above", "Below"] as const).map((direction) => (
                                                    <button
                                                        key={direction}
                                                        type="button"
                                                        onClick={() => {
                                                            setPredictionDirection(direction);
                                                            if (assetPriceState.asset === selectedAssetSymbol && assetPriceState.currentPrice) {
                                                                const targetPrice = assetPriceState.currentPrice * (direction === "Above" ? 1.1 : 0.9);
                                                                setPredictionPrice(targetPriceInputValue(targetPrice));
                                                            }
                                                        }}
                                                        className={`px-2.5 py-1.5 text-sm font-black ${predictionDirection === direction ? direction === "Above" ? "bg-emerald-600 text-white" : "bg-[#e85a2d] text-white" : "text-[#77675f]"}`}
                                                    >
                                                        {direction.toLowerCase()}
                                                    </button>
                                                ))}
                                            </div>
                                            <label className="relative inline-flex w-full min-w-0 max-w-none flex-1 items-center border-b-2 border-black min-[430px]:min-w-32 min-[430px]:max-w-48">
                                                <span className="text-[#8b7a72]">$</span>
                                                <input
                                                    ref={priceRef}
                                                    type="number"
                                                    inputMode="decimal"
                                                    min="0"
                                                    step="any"
                                                    value={predictionPrice}
                                                    onChange={(event) => {
                                                        setPredictionPrice(event.target.value);
                                                        setFormError(null);
                                                    }}
                                                    className="create-challenge-composer-input min-w-0 flex-1 border-0 bg-transparent px-1 py-1 text-xl font-black text-black outline-none placeholder:text-[#b7a9a2] sm:text-2xl"
                                                    placeholder={isAssetPriceLoading ? "loading" : "target"}
                                                    aria-label="Target price"
                                                />
                                                {isAssetPriceLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#8b7a72]" />}
                                                {hasAssetPriceError && <span className="shrink-0 text-xs font-black text-[#e85a2d]" title="Price unavailable">!</span>}
                                            </label>
                                        </div>
                                        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#7c6b63]">
                                            <CalendarDays className="h-3.5 w-3.5 text-[#e85a2d]" /> by {formatDate(selectedDate)}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <textarea
                                            ref={statementRef}
                                            value={statement}
                                            onChange={(event) => {
                                                setStatement(event.target.value);
                                                setFormError(null);
                                            }}
                                            maxLength={MAX_STATEMENT_LENGTH}
                                            rows={5}
                                            autoFocus
                                            placeholder={marketType === "sports" ? "India wins the next match..." : "ETH flips BTC this cycle..."}
                                            className="create-challenge-composer-input min-h-28 w-full resize-none border-0 bg-transparent p-0 text-base font-bold leading-relaxed text-[#17120f] outline-none placeholder:font-semibold placeholder:text-[#a99991] sm:min-h-32 sm:text-xl"
                                            aria-label="Challenge statement"
                                        />
                                        <div className="flex justify-end text-[10px] font-bold text-[#9a8981]">
                                            {statement.length}/{MAX_STATEMENT_LENGTH}
                                        </div>
                                    </div>
                                )}

                                <div className="-mr-3 mt-2 flex items-center gap-1.5 overflow-x-auto border-t border-black/10 pb-1 pr-3 pt-2.5 scrollbar-hide sm:mr-0 sm:mt-3 sm:pb-0 sm:pr-0 sm:pt-3" aria-label="Customize challenge">
                                    <ComposerButton
                                        icon={marketType === "crypto" ? Coins : Trophy}
                                        label={topicLabel}
                                        isActive={activePanel === "topic"}
                                        onClick={() => togglePanel("topic")}
                                    />
                                    <ComposerButton
                                        icon={CircleDollarSign}
                                        label={`${betAmount || 0} USDC`}
                                        isActive={activePanel === "stake"}
                                        onClick={() => togglePanel("stake")}
                                    />
                                    <ComposerButton
                                        icon={Clock3}
                                        label={formatDuration(duration)}
                                        isActive={activePanel === "timing"}
                                        onClick={() => togglePanel("timing")}
                                    />
                                    <ComposerButton
                                        icon={challengeMode === "pvp" ? Swords : Users}
                                        label={challengeMode === "pvp" ? "1 vs 1" : "Teams"}
                                        isActive={activePanel === "players"}
                                        onClick={() => togglePanel("players")}
                                    />
                                </div>
                            </div>
                        </div>

                        {activePanel && (
                            <div className="mt-3 border-2 border-black bg-[#f8ede7] p-3 sm:mt-4 sm:p-4">
                                {activePanel === "topic" && (
                                    <div>
                                        <PanelHeading>{marketType === "crypto" ? "Asset" : "Sport"}</PanelHeading>
                                        {isLoadingCategories ? (
                                            <div className="flex h-16 items-center justify-center text-[#7b6a62]">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            </div>
                                        ) : childCategories.length > 0 ? (
                                            <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
                                                {childCategories.map((category) => {
                                                    const isSelected = selectedChildCategory?.id === category.id;
                                                    return (
                                                        <button
                                                            key={category.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedChildCategory(category);
                                                                if (marketType === "crypto" && category.id !== selectedChildCategory?.id) {
                                                                    setPredictionPrice("");
                                                                }
                                                                setFormError(null);
                                                                setActivePanel(null);
                                                            }}
                                                            className={`inline-flex max-w-full items-center gap-1.5 break-words border-2 px-3 py-2 text-left text-xs font-black transition-all ${isSelected ? "border-black bg-[#f5d547] text-black shadow-[2px_2px_0_#111]" : "border-black/20 bg-white text-[#594b44] hover:border-black"}`}
                                                        >
                                                            {isSelected && <Check className="h-3.5 w-3.5" />}
                                                            {stripUsdcQuote(category.category)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="py-3 text-xs font-bold text-[#7b6a62]">
                                                {marketType === "sports" ? "Your statement can cover any sport." : categoryError || "No assets available."}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {activePanel === "stake" && (
                                    <div>
                                        <PanelHeading>Stake</PanelHeading>
                                        <div className="grid grid-cols-4 items-center gap-2">
                                            {[1, 5, 10, 25].map((amount) => (
                                                <button
                                                    key={amount}
                                                    type="button"
                                                    onClick={() => {
                                                        setBetAmount(amount);
                                                        setFormError(null);
                                                    }}
                                                    className={`h-10 min-w-0 border-2 px-1 text-xs font-black sm:px-3 ${betAmount === amount ? "border-black bg-[#f5d547] shadow-[2px_2px_0_#111]" : "border-black/20 bg-white hover:border-black"}`}
                                                >
                                                    ${amount}
                                                </button>
                                            ))}
                                            <label className="relative col-span-4 min-w-0 sm:col-span-4">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-[#75645c]">$</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={betAmount}
                                                    onChange={(event) => {
                                                        setBetAmount(Number(event.target.value));
                                                        setFormError(null);
                                                    }}
                                                    className="h-11 w-full border-2 border-black bg-white pl-7 pr-14 text-base font-black outline-none sm:h-10 sm:text-sm"
                                                    aria-label="Custom stake"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#8b7a72]">USDC</span>
                                            </label>
                                        </div>
                                        <p className="mt-3 text-[11px] font-bold text-[#77675f]">
                                            {challengeMode === "pvp"
                                                ? `${estimatedPvpPool.toFixed(2)} USDC pot · ${estimatedPayout.toFixed(2)} to winner`
                                                : `Pool starts at ${Number.isFinite(betAmount) ? betAmount : 0} USDC`}
                                        </p>
                                    </div>
                                )}

                                {activePanel === "timing" && (
                                    <div>
                                        <PanelHeading>Timing</PanelHeading>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="mb-2 text-[9px] font-black uppercase tracking-[0.1em] text-[#8b7a72]">Join window</p>
                                                <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                                                    {[
                                                        { label: "15m", minutes: 15 },
                                                        { label: "1h", minutes: 60 },
                                                        { label: "4h", minutes: 240 },
                                                        { label: "1d", minutes: 1440 },
                                                        { label: "3d", minutes: 4320 },
                                                        { label: "7d", minutes: 10080 },
                                                    ].map((option) => (
                                                        <button
                                                            key={option.minutes}
                                                            type="button"
                                                            onClick={() => handleDurationChange(durationFromMinutes(option.minutes))}
                                                            className={`h-9 min-w-0 border-2 px-2 text-xs font-black sm:min-w-12 sm:px-3 ${totalDurationMinutes === option.minutes ? "border-black bg-[#f5d547] shadow-[2px_2px_0_#111]" : "border-black/20 bg-white hover:border-black"}`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                            </div>
                        </div>
                                            <label className="block">
                                                <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.1em] text-[#8b7a72]">Resolves</span>
                                                <span className="flex items-center gap-2 border-2 border-black/20 bg-white px-3 focus-within:border-black">
                                                    <CalendarDays className="h-4 w-4 shrink-0 text-[#e85a2d]" />
                                                    <input
                                                        type="datetime-local"
                                                        value={toDateTimeLocalValue(selectedDate)}
                                                        min={toDateTimeLocalValue(new Date(composerNow + totalDurationMinutes * 60 * 1000))}
                                                        onChange={(event) => handleResolutionDateChange(new Date(event.target.value))}
                                                        className="create-challenge-date-input h-12 w-full min-w-0 flex-1 border-0 bg-transparent text-base font-black text-black outline-none sm:h-11 sm:text-xs"
                                                    />
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {activePanel === "players" && (
                                    <div>
                                        <PanelHeading>Players</PanelHeading>
                                        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setChallengeMode("pvp");
                                                    setActivePanel(null);
                                                }}
                                                className={`flex items-center gap-3 border-2 p-3 text-left ${challengeMode === "pvp" ? "border-black bg-black text-white shadow-[3px_3px_0_#f5d547]" : "border-black/20 bg-white text-black hover:border-black"}`}
                                            >
                                                <Swords className="h-5 w-5 shrink-0" />
                                                <span>
                                                    <span className="block text-xs font-black">1 vs 1</span>
                                                    <span className={`text-[10px] font-bold ${challengeMode === "pvp" ? "text-white/65" : "text-[#8b7a72]"}`}>One rival</span>
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setChallengeMode("team");
                                                    setActivePanel(null);
                                                }}
                                                className={`flex items-center gap-3 border-2 p-3 text-left ${challengeMode === "team" ? "border-black bg-black text-white shadow-[3px_3px_0_#f5d547]" : "border-black/20 bg-white text-black hover:border-black"}`}
                                            >
                                                <Users className="h-5 w-5 shrink-0" />
                                                <span>
                                                    <span className="block text-xs font-black">Teams</span>
                                                    <span className={`text-[10px] font-bold ${challengeMode === "team" ? "text-white/65" : "text-[#8b7a72]"}`}>Crowd vs crowd</span>
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {formError && (
                            <div role="alert" className="mt-3 flex items-start gap-2 border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 bg-red-600" />
                                {formError}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="flex shrink-0 items-center gap-3 border-t-2 border-black bg-[#f3e1d7] px-3 py-2.5 sm:px-5 sm:py-3">
                    <div className="hidden min-w-0 flex-1 sm:block">
                        <p className="truncate text-xs font-black text-[#17120f]">
                            {marketType === "crypto" ? "Crypto" : "Sports"} · {isPriceFeed ? "Price" : "Statement"} · {challengeMode === "pvp" ? "1 vs 1" : "Teams"}
                        </p>
                        <p className="mt-0.5 text-[10px] font-bold text-[#7b6a62]">
                            {betAmount || 0} USDC · closes in {formatDuration(duration)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleOpenPreview}
                        disabled={isSubmitting}
                        className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 border-2 border-black bg-white px-3 text-xs font-black text-black transition-colors hover:bg-[#f5d547] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                    >
                        <Eye className="h-4 w-4" />
                        <span>Preview</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleCreateChallenge}
                        disabled={isSubmitting || txStatus === "success"}
                        className="rekto-button ml-auto inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-black bg-black px-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-[#27211e] hover:shadow-[3px_3px_0_#e85a2d] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-5 sm:min-w-44"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> {statusLabel}</>
                        ) : !isConnected ? (
                            <><Wallet className="h-4 w-4" /> Connect & create</>
                        ) : (
                            <><Zap className="h-4 w-4 fill-white" /> Create challenge</>
                        )}
                    </button>
                </footer>

                {isPreviewOpen && (
                    <div className="absolute inset-0 z-30 flex min-h-0 flex-col bg-[#fffaf6]">
                        <header className="flex shrink-0 items-center justify-between border-b-2 border-black px-3 py-2.5 sm:px-5 sm:py-3.5">
                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsPreviewOpen(false)}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-black bg-white transition-colors hover:bg-[#f5d547] sm:h-9 sm:w-9"
                                    aria-label="Back to editor"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <div>
                                    <h2 className="text-base font-black text-[#17120f] sm:text-lg">Challenge preview</h2>
                                    <p className="text-[11px] font-bold text-[#7a6961]">This is how your call will appear.</p>
                                </div>
                            </div>
                            <span className="border border-black/20 bg-[#f5d547] px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em]">Preview</span>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
                            <ChallengePreview
                                username={user?.username || "You"}
                                isModerator={user?.user_type === "moderator"}
                                twitterUsername={user?.twitter_username ?? null}
                                marketType={marketType}
                                isPriceFeed={isPriceFeed}
                                challengeMode={challengeMode}
                                pairTag={rawTopicLabel}
                                title={isPriceFeed ? generatedStatement : statement.trim()}
                                betAmount={betAmount}
                                duration={duration}
                                resolutionDate={selectedDate}
                            />
                        </div>

                        <footer className="flex shrink-0 gap-2 border-t-2 border-black bg-[#f3e1d7] px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
                            <button
                                type="button"
                                onClick={() => setIsPreviewOpen(false)}
                                disabled={isSubmitting}
                                className="inline-flex h-11 min-w-24 cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-3 text-xs font-black text-black hover:bg-[#f5d547] disabled:opacity-60"
                            >
                                <ArrowLeft className="h-4 w-4" /> Edit
                            </button>
                            <button
                                type="button"
                                onClick={handleCreateChallenge}
                                disabled={isSubmitting}
                                className="rekto-button inline-flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-black bg-black px-3 text-sm font-black text-white hover:bg-[#27211e] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-5 sm:min-w-48"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> {statusLabel}</>
                                ) : !isConnected ? (
                                    <><Wallet className="h-4 w-4" /> Connect & create</>
                                ) : (
                                    <><Zap className="h-4 w-4 fill-white" /> Create challenge</>
                                )}
                            </button>
                        </footer>
                    </div>
                )}
            </section>

            <style jsx global>{`
                .pixel-shell .create-challenge-modal .create-challenge-composer-input,
                .pixel-shell .create-challenge-modal .create-challenge-date-input {
                    border: 0 !important;
                    border-radius: 0 !important;
                    background: transparent !important;
                    box-shadow: none !important;
                }

                .pixel-shell .create-challenge-modal .create-challenge-composer-input:focus,
                .pixel-shell .create-challenge-modal .create-challenge-date-input:focus {
                    border: 0 !important;
                    box-shadow: none !important;
                }

                .create-challenge-modal {
                    min-width: 0;
                }

                .create-challenge-date-input::-webkit-date-and-time-value {
                    min-width: 0;
                    text-align: left;
                }

                @media (max-width: 639px) {
                    .create-challenge-modal {
                        max-height: calc(100vh - 1.5rem);
                    }

                    @supports (height: 100dvh) {
                        .create-challenge-modal {
                            max-height: calc(100dvh - 1.5rem);
                        }
                    }
                }

                @media (min-width: 380px) and (max-width: 639px) {
                    .create-challenge-modal {
                        max-height: calc(100vh - 2rem);
                    }

                    @supports (height: 100dvh) {
                        .create-challenge-modal {
                            max-height: calc(100dvh - 2rem);
                        }
                    }
                }
            `}</style>

        </div>,
        document.body,
    );
}

function ComposerButton({
    icon: Icon,
    label,
    isActive,
    onClick,
}: {
    icon: typeof Coins;
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isActive}
            title={label}
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 border px-2.5 text-[10px] font-black transition-colors ${isActive ? "border-black bg-[#f5d547] text-black" : "border-black/15 bg-white text-[#6d5d55] hover:border-black hover:text-black"}`}
        >
            <Icon className="h-3.5 w-3.5" />
            <span className="max-w-24 truncate">{label}</span>
        </button>
    );
}

function VerifiedBadge({
    isModerator,
    twitterUsername,
}: {
    isModerator: boolean;
    twitterUsername: string | null;
}) {
    const label = isModerator ? "Verified creator" : `Verified on X as @${twitterUsername}`;

    return (
        <span className="inline-flex shrink-0" title={label} aria-label={label}>
            <svg className="h-4 w-4" viewBox="0 0 32 32" aria-hidden="true">
                <path
                    fill={isModerator ? "#F5B800" : "#378FDB"}
                    d="M16 1.5l2.8 2.2 3.5-1 1.6 3.2 3.6.5.1 3.7 3 2-1.4 3.4 1.4 3.4-3 2-.1 3.7-3.6.5-1.6 3.2-3.5-1L16 30.5l-2.8-2.2-3.5 1-1.6-3.2-3.6-.5-.1-3.7-3-2 1.4-3.4-1.4-3.4 3-2 .1-3.7 3.6-.5 1.6-3.2 3.5 1L16 1.5Z"
                />
                <path
                    d="m9.4 16.2 4.2 4.2 9-9"
                    fill="none"
                    stroke="white"
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
}

function ChallengePreview({
    username,
    isModerator,
    twitterUsername,
    marketType,
    isPriceFeed,
    challengeMode,
    pairTag,
    title,
    betAmount,
    duration,
    resolutionDate,
}: {
    username: string;
    isModerator: boolean;
    twitterUsername: string | null;
    marketType: MarketType;
    isPriceFeed: boolean;
    challengeMode: ChallengeMode;
    pairTag: string;
    title: string;
    betAmount: number;
    duration: { hours: number; minutes: number };
    resolutionDate: Date;
}) {
    const isVerified = isModerator || Boolean(twitterUsername);
    const poolAmount = challengeMode === "pvp" ? betAmount * 2 : betAmount;

    return (
        <div className="mx-auto w-full max-w-lg">
            <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7a72]">Card preview</p>
            <article className="overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0_#111]">
                <div className="h-1.5 bg-emerald-500" />
                <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black bg-[#f5d547] text-sm font-black text-black">
                                {username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <span className="truncate text-sm font-black text-[#17120f]">{username}</span>
                                    {isVerified && <VerifiedBadge isModerator={isModerator} twitterUsername={twitterUsername} />}
                                </div>
                                <p className="text-[10px] font-bold text-[#8b7a72]">challenges everyone</p>
                            </div>
                        </div>
                        <span className="shrink-0 border border-emerald-300 bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-800">
                            Open
                        </span>
                    </div>

                    <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 border border-black/20 bg-[#f3e1d7] px-2 py-1 text-[10px] font-black text-[#594b44]">
                                {marketType === "crypto" ? <Coins className="h-3 w-3" /> : <Trophy className="h-3 w-3" />}
                                {pairTag}
                            </span>
                            <span className="border border-black/15 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#75645c]">
                                {isPriceFeed ? "Price" : "Statement"}
                            </span>
                            <span className="border border-black/15 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#75645c]">
                                {challengeMode === "pvp" ? "1 vs 1" : "Teams"}
                            </span>
                        </div>
                        <h3 className="mt-3 break-words text-xl font-black leading-tight tracking-[-0.02em] text-[#17120f] sm:text-2xl">
                            {title}
                        </h3>
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-2 border-black bg-[#f8ede7] p-3">
                        <div className="min-w-0 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#f5d547] text-sm font-black">
                                {username.charAt(0).toUpperCase()}
                            </div>
                            <p className="mt-1.5 truncate text-[11px] font-black text-[#17120f]">{username}</p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#75645c]">Your side</p>
                        </div>
                        <div className="text-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-black text-[11px] font-black italic text-white shadow-[2px_2px_0_#e85a2d]">
                                VS
                            </div>
                            <p className="mt-2 text-[9px] font-black uppercase tracking-[0.08em] text-[#75645c]">Pool</p>
                            <p className="text-sm font-black text-emerald-700">${Number.isFinite(poolAmount) ? poolAmount.toFixed(2) : "0.00"}</p>
                        </div>
                        <div className="min-w-0 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-black/50 bg-white text-[#8b7a72]">
                                {challengeMode === "pvp" ? <Swords className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                            </div>
                            <p className="mt-1.5 text-[11px] font-black text-[#594b44]">Waiting...</p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#75645c]">
                                {challengeMode === "pvp" ? "Opponent" : "Rival team"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 divide-x divide-black/10 border-y border-black/10 py-2.5 text-center">
                        <div className="px-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8b7a72]">Stake</p>
                            <p className="mt-0.5 text-xs font-black text-black">{betAmount} USDC</p>
                        </div>
                        <div className="px-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8b7a72]">Joins close</p>
                            <p className="mt-0.5 text-xs font-black text-black">{formatDuration(duration)}</p>
                        </div>
                        <div className="min-w-0 px-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8b7a72]">Resolves</p>
                            <p className="mt-0.5 truncate text-xs font-black text-black">{formatDate(resolutionDate)}</p>
                        </div>
                    </div>

                    <div className="mt-3 flex h-10 items-center justify-center gap-2 border-2 border-black bg-[#246044] text-xs font-black uppercase tracking-[0.06em] text-white">
                        <Swords className="h-4 w-4" /> Join challenge
                    </div>
                </div>
            </article>
        </div>
    );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#75645c]">
            {children}
        </h3>
    );
}
