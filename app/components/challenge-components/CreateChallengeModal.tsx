"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
    Activity,
    ArrowLeft,
    CalendarDays,
    Check,
    ChevronDown,
    CircleDollarSign,
    Clock3,
    Coins,
    Crosshair,
    Info,
    Loader2,
    Lock,
    MessageSquareText,
    ShieldCheck,
    Swords,
    Trophy,
    TrendingDown,
    TrendingUp,
    Eye,
    Users,
    Wallet,
    X,
    Zap,
} from "lucide-react";
import { useUserStore } from "@/app/store/useUserStore";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    CandlestickSeries,
    ColorType,
    createChart,
    CrosshairMode,
    LineSeries,
    LineStyle,
    type IPriceLine,
    type ISeriesApi,
    type UTCTimestamp,
} from "lightweight-charts";
import { getParentCategories, getCategoriesByParent, Category } from "@/app/lib/category-service/category";
import { createChallenge, type Challenge } from "@/app/lib/challenges-service/challenges";
import { Transaction } from "@solana/web3.js";
import { getReadonlyConnection } from "@/app/lib/rektofun-program";
import { stripUsdcQuote } from "@/app/lib/format-market-label";
import { ChallengeCard } from "./ChallengeCard";
import type { User } from "@/app/lib/users-service/users";
import { announceChallengeCreated } from "@/app/lib/realtime-events";
import { fetchUsdcBalance } from "@/app/lib/token-balances";
import {
    DEFAULT_SITE_SETTINGS,
    getSiteSettings,
    type SiteSettings,
} from "@/app/lib/site-settings";
import {
    getChallengeActionError,
    type ChallengeActionStage,
} from "@/app/lib/challenge-action-errors";

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
    recipient?: Pick<User, "id" | "username" | "wallet_address" | "profile_image"> | null;
}

type TxStatus = "idle" | "building" | "signing" | "confirming" | "success" | "error";
type MarketType = "crypto" | "sports";
type ChallengeFormat = "price" | "statement";
type ChallengeMode = "pvp" | "team";
type ChartRange = "24H" | "7D" | "30D" | "3M";
type ComposerPanel = "topic" | "stake" | "window" | "resolution" | "players" | null;
type MarketCandle = {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
};
type AssetPriceState = {
    key: string;
    asset: string;
    currentPrice: number | null;
    candles: MarketCandle[];
    status: "ready" | "failed";
};

const MAX_STATEMENT_LENGTH = 220;
const MIN_DURATION_MINUTES = 15;
const MAX_JOIN_WINDOW_MINUTES = 7 * 24 * 60;
const MAX_RESOLUTION_DELAY_MINUTES = 14 * 24 * 60;
const DEFAULT_BET_AMOUNT = 5;
const DEFAULT_DURATION_MINUTES = 15;
const DEFAULT_RESOLUTION_DELAY_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_CHART_RANGE: ChartRange = "3M";
const CREATE_SETTINGS_KEY = "rektofun:create-challenge-settings";

type SavedCreateSettings = {
    marketType: MarketType;
    challengeFormat: ChallengeFormat;
    challengeMode: ChallengeMode;
    assetCategory: string;
    betAmount: number;
    durationMinutes: number;
    resolutionDelayMinutes: number;
};

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

const toDateInputValue = (date: Date) => toDateTimeLocalValue(date).slice(0, 10);
const toTimeInputValue = (date: Date) => toDateTimeLocalValue(date).slice(11, 16);

const durationFromMinutes = (totalMinutes: number) => ({
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
});

const getDefaultResolutionDate = (now: number) => {
    const date = new Date(now + DEFAULT_RESOLUTION_DELAY_MS);
    date.setHours(5, 30, 0, 0);
    return date;
};

const getTimeUntilResolutionMinutes = (resolutionDate: Date, now: number) =>
    Math.max(0, Math.floor((resolutionDate.getTime() - now) / (60 * 1000)));

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

const getCategoryImage = (category: Category | null | undefined) =>
    category?.image_url || category?.metadata?.image_url || "";

const ASSET_GROUPS = [
    { type: "crypto", label: "Crypto" },
    { type: "stock", label: "Stocks" },
    { type: "rwa", label: "RWA" },
] as const;

export function CreateChallengeModal({ isOpen, onClose, onCreated, recipient = null }: CreateChallengeModalProps) {
    const [marketType, setMarketType] = useState<MarketType>("crypto");
    const [challengeFormat, setChallengeFormat] = useState<ChallengeFormat>("price");
    const [challengeMode, setChallengeMode] = useState<ChallengeMode>("pvp");
    const [statement, setStatement] = useState("");
    const [betAmount, setBetAmount] = useState(DEFAULT_BET_AMOUNT);
    const [predictionDirection, setPredictionDirection] = useState<"Above" | "Below">("Above");
    const [predictionPrice, setPredictionPrice] = useState("");
    const [chartRange, setChartRange] = useState<ChartRange>(DEFAULT_CHART_RANGE);
    const [isAdvancedPickerOpen, setIsAdvancedPickerOpen] = useState(false);
    const [assetPriceState, setAssetPriceState] = useState<AssetPriceState>({
        key: "",
        asset: "",
        currentPrice: null,
        candles: [],
        status: "failed",
    });
    const [composerNow] = useState(() => Date.now());
    const [selectedDate, setSelectedDate] = useState(() => getDefaultResolutionDate(composerNow));
    const [duration, setDuration] = useState(() => durationFromMinutes(DEFAULT_DURATION_MINUTES));

    const [activePanel, setActivePanel] = useState<ComposerPanel>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [childCategories, setChildCategories] = useState<Category[]>([]);
    const [selectedChildCategory, setSelectedChildCategory] = useState<Category | null>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [balanceShortfall, setBalanceShortfall] = useState<number | null>(null);
    const [rememberSettings, setRememberSettings] = useState(false);
    const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

    const [txStatus, setTxStatus] = useState<TxStatus>("idle");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const statementRef = useRef<HTMLTextAreaElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);
    const setupPanelRef = useRef<HTMLDivElement>(null);
    const savedAssetCategoryRef = useRef<string | null>(null);
    const { user } = useUserStore();
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("solana");

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen) return;
        let active = true;
        void getSiteSettings().then((settings) => {
            if (!active) return;
            setSiteSettings(settings);
            setMarketType((current) => {
                if (current === "crypto" && settings.cryptoCreationLocked && !settings.sportsCreationLocked) return "sports";
                if (current === "sports" && settings.sportsCreationLocked && !settings.cryptoCreationLocked) return "crypto";
                return current;
            });
            setChallengeFormat((current) => {
                if (current === "price" && settings.priceChallengesLocked && !settings.statementChallengesLocked) return "statement";
                if (current === "statement" && settings.statementChallengesLocked && !settings.priceChallengesLocked) return "price";
                return current;
            });
            setChallengeMode((current) => {
                if (recipient) return "pvp";
                if (current === "pvp" && settings.pvpChallengesLocked && !settings.teamChallengesLocked) return "team";
                if (current === "team" && settings.teamChallengesLocked && !settings.pvpChallengesLocked) return "pvp";
                return current;
            });
        }).catch(() => {
            if (active) setSiteSettings(DEFAULT_SITE_SETTINGS);
        });
        return () => {
            active = false;
        };
    }, [isOpen, recipient]);

    /* eslint-disable react-hooks/set-state-in-effect -- restoring an explicitly saved form snapshot when the modal opens */
    useEffect(() => {
        if (!isOpen) return;
        try {
            const rawSettings = window.localStorage.getItem(CREATE_SETTINGS_KEY);
            if (!rawSettings) {
                setRememberSettings(false);
                return;
            }
            const saved = JSON.parse(rawSettings) as Partial<SavedCreateSettings>;
            const savedMarketAvailable = (saved.marketType === "crypto" && !siteSettings.cryptoCreationLocked)
                || (saved.marketType === "sports" && !siteSettings.sportsCreationLocked);
            if (savedMarketAvailable && (saved.marketType === "crypto" || saved.marketType === "sports")) {
                setMarketType(saved.marketType);
                const savedFormat = saved.marketType === "sports" ? "statement" : saved.challengeFormat === "statement" ? "statement" : "price";
                const savedFormatAvailable = (savedFormat === "price" && !siteSettings.priceChallengesLocked)
                    || (savedFormat === "statement" && !siteSettings.statementChallengesLocked);
                if (savedFormatAvailable) setChallengeFormat(savedFormat);
            }
            if (!recipient && (
                (saved.challengeMode === "pvp" && !siteSettings.pvpChallengesLocked)
                || (saved.challengeMode === "team" && !siteSettings.teamChallengesLocked)
            )) {
                setChallengeMode(saved.challengeMode);
            }
            if (typeof saved.betAmount === "number" && Number.isFinite(saved.betAmount) && saved.betAmount > 0) setBetAmount(saved.betAmount);
            if (typeof saved.durationMinutes === "number" && saved.durationMinutes >= MIN_DURATION_MINUTES) {
                setDuration(durationFromMinutes(Math.min(saved.durationMinutes, MAX_JOIN_WINDOW_MINUTES)));
            }
            if (typeof saved.resolutionDelayMinutes === "number" && saved.resolutionDelayMinutes >= MIN_DURATION_MINUTES) {
                const safeDelay = Math.min(saved.resolutionDelayMinutes, MAX_RESOLUTION_DELAY_MINUTES);
                setSelectedDate(new Date(Date.now() + safeDelay * 60 * 1000));
            }
            savedAssetCategoryRef.current = typeof saved.assetCategory === "string" ? saved.assetCategory : null;
            setRememberSettings(true);
        } catch {
            window.localStorage.removeItem(CREATE_SETTINGS_KEY);
            setRememberSettings(false);
        }
    }, [isOpen, recipient, siteSettings]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        if (!rememberSettings || !isOpen) return;
        const settings: SavedCreateSettings = {
            marketType,
            challengeFormat,
            challengeMode,
            assetCategory: selectedChildCategory?.category ?? savedAssetCategoryRef.current ?? "",
            betAmount,
            durationMinutes: duration.hours * 60 + duration.minutes,
            resolutionDelayMinutes: Math.max(MIN_DURATION_MINUTES, Math.round((selectedDate.getTime() - Date.now()) / 60000)),
        };
        window.localStorage.setItem(CREATE_SETTINGS_KEY, JSON.stringify(settings));
    }, [betAmount, challengeFormat, challengeMode, duration, isOpen, marketType, rememberSettings, selectedChildCategory, selectedDate]);

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
            setIsAdvancedPickerOpen(false);
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
                        : children.find((category) => category.category === savedAssetCategoryRef.current) ?? (currentMarket === "crypto"
                            ? children.find((category) => stripUsdcQuote(category.category).trim().toUpperCase() === "BTC") ?? children[0] ?? null
                            : children[0] ?? null),
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
        if (
            (nextMarket === "crypto" && siteSettings.cryptoCreationLocked)
            || (nextMarket === "sports" && siteSettings.sportsCreationLocked)
        ) return;
        if (nextMarket === marketType) return;
        setMarketType(nextMarket);
        setChallengeFormat(nextMarket === "sports" ? "statement" : "price");
        savedAssetCategoryRef.current = null;
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

    useEffect(() => {
        if (!isOpen || !activePanel || !window.matchMedia("(max-width: 639px)").matches) return;
        const frame = window.requestAnimationFrame(() => {
            setupPanelRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [activePanel, isOpen]);

    const handleDurationChange = (nextDuration: { hours: number; minutes: number }) => {
        const totalMinutes = Math.min(
            MAX_JOIN_WINDOW_MINUTES,
            Math.max(0, nextDuration.hours * 60 + nextDuration.minutes),
        );
        setDuration(durationFromMinutes(totalMinutes));
        setFormError(null);
    };

    const handleCustomDurationChange = (part: "days" | "hours" | "minutes", rawValue: string) => {
        const value = Math.max(0, Number.parseInt(rawValue || "0", 10) || 0);
        const currentDays = Math.floor(totalDurationMinutes / 1440);
        const currentHours = Math.floor((totalDurationMinutes % 1440) / 60);
        const currentMinutes = totalDurationMinutes % 60;
        const days = part === "days" ? Math.min(value, 7) : currentDays;
        const hours = part === "hours" ? Math.min(value, 23) : currentHours;
        const minutes = part === "minutes" ? Math.min(value, 59) : currentMinutes;
        handleDurationChange(durationFromMinutes(Math.min(
            MAX_JOIN_WINDOW_MINUTES,
            days * 1440 + hours * 60 + minutes,
        )));
    };

    const handleResolutionDateChange = (nextDate: Date) => {
        if (!Number.isFinite(nextDate.getTime())) return;
        setSelectedDate(nextDate);
        setFormError(null);
    };

    const handleResolutionDayChange = (value: string) => {
        if (!value) return;
        const [year, month, day] = value.split("-").map(Number);
        const nextDate = new Date(selectedDate);
        nextDate.setFullYear(year, month - 1, day);
        handleResolutionDateChange(nextDate);
    };

    const handleResolutionTimeChange = (value: string) => {
        if (!value) return;
        const [hours, minutes] = value.split(":").map(Number);
        const nextDate = new Date(selectedDate);
        nextDate.setHours(hours, minutes, 0, 0);
        handleResolutionDateChange(nextDate);
    };

    const selectResolutionOffset = (days: number) => {
        const nextDate = new Date(composerNow + days * 24 * 60 * 60 * 1000);
        nextDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
        handleResolutionDateChange(nextDate);
    };

    const isPriceFeed = marketType === "crypto" && challengeFormat === "price";
    const rawTopicLabel = selectedChildCategory?.category ?? (marketType === "sports" ? "All sports" : "Choose asset");
    const topicLabel = stripUsdcQuote(rawTopicLabel);
    const selectedCategoryImage = getCategoryImage(selectedChildCategory);
    const selectedMarketPair = (selectedChildCategory?.category ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 20);
    const selectedAssetSymbol = (selectedChildCategory?.category ?? "")
        .split("/", 1)[0]
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
    const assetPriceRequestKey = `${selectedMarketPair}:${chartRange}`;
    const isAssetPriceLoading = isPriceFeed
        && Boolean(selectedAssetSymbol)
        && assetPriceState.key !== assetPriceRequestKey;
    const hasAssetPriceError = isPriceFeed
        && Boolean(selectedAssetSymbol)
        && assetPriceState.key === assetPriceRequestKey
        && assetPriceState.status === "failed";
    const generatedStatement = `${stripUsdcQuote(selectedChildCategory?.category) || "Asset"} ${predictionDirection.toLowerCase()} ${formatPrice(predictionPrice)}`;
    const totalDurationMinutes = duration.hours * 60 + duration.minutes;
    const timeUntilResolutionMinutes = getTimeUntilResolutionMinutes(selectedDate, composerNow);
    const minResolutionDate = new Date(composerNow + MIN_DURATION_MINUTES * 60 * 1000);
    const maxResolutionDate = new Date(composerNow + MAX_RESOLUTION_DELAY_MINUTES * 60 * 1000);

    useEffect(() => {
        if (!isOpen || !isPriceFeed || !selectedAssetSymbol || !selectedMarketPair) return;
        let cancelled = false;

        fetch(`/api/market-chart?pair=${encodeURIComponent(selectedChildCategory?.category ?? "")}&range=${chartRange}`)
            .then(async (response) => {
                if (!response.ok) throw new Error("Asset price unavailable");
                return response.json() as Promise<{ candles: MarketCandle[] }>;
            })
            .then((data) => {
                const currentPrice = Number(data.candles.at(-1)?.close);
                if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
                    throw new Error("Invalid asset price");
                }
                if (cancelled) return;

                setPredictionPrice((currentTarget) => {
                    const parsedTarget = Number(currentTarget);
                    return Number.isFinite(parsedTarget) && parsedTarget > 0
                        ? currentTarget
                        : targetPriceInputValue(currentPrice * 1.1);
                });
                setAssetPriceState({
                    key: assetPriceRequestKey,
                    asset: selectedAssetSymbol,
                    currentPrice,
                    candles: data.candles,
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
                    candles: [],
                    status: "failed",
                });
            });

        return () => {
            cancelled = true;
        };
    }, [assetPriceRequestKey, chartRange, isOpen, isPriceFeed, selectedAssetSymbol, selectedMarketPair, selectedChildCategory?.category]);

    const validateForm = ({ requireProfile = true }: { requireProfile?: boolean } = {}) => {
        if (siteSettings.siteMaintenance) return "Challenge creation is unavailable during maintenance.";
        if (marketType === "crypto" && siteSettings.cryptoCreationLocked) return "Crypto challenge creation is temporarily locked.";
        if (marketType === "sports" && siteSettings.sportsCreationLocked) return "Sports challenge creation is temporarily locked.";
        if (challengeFormat === "price" && siteSettings.priceChallengesLocked) return "Price challenges are temporarily locked.";
        if (challengeFormat === "statement" && siteSettings.statementChallengesLocked) return "Statement challenges are temporarily locked.";
        if (challengeMode === "pvp" && siteSettings.pvpChallengesLocked) return "PvP challenge creation is temporarily locked.";
        if (challengeMode === "team" && siteSettings.teamChallengesLocked) return "Team challenge creation is temporarily locked.";
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
        if (isPriceFeed) {
            const currentPrice = assetPriceState.key === assetPriceRequestKey
                && assetPriceState.status === "ready"
                ? assetPriceState.currentPrice
                : null;
            if (!currentPrice) {
                return "Wait for the current market price before continuing.";
            }

            const targetPrice = Number(predictionPrice);
            if (predictionDirection === "Above" && targetPrice <= currentPrice) {
                window.setTimeout(() => priceRef.current?.focus(), 0);
                return `An above target must be greater than the current price (${formatPrice(String(currentPrice))}).`;
            }
            if (predictionDirection === "Below" && targetPrice >= currentPrice) {
                window.setTimeout(() => priceRef.current?.focus(), 0);
                return `A below target must be less than the current price (${formatPrice(String(currentPrice))}).`;
            }
        }
        if (!Number.isFinite(betAmount) || betAmount < 1) {
            setActivePanel("stake");
            return "Minimum stake is 1 USDC.";
        }
        if (selectedDate.getTime() < minResolutionDate.getTime() || selectedDate.getTime() > maxResolutionDate.getTime()) {
            setActivePanel("resolution");
            return "Resolution must be between 15 minutes and 14 days from now.";
        }
        if (
            totalDurationMinutes < MIN_DURATION_MINUTES
            || totalDurationMinutes > MAX_JOIN_WINDOW_MINUTES
            || totalDurationMinutes > timeUntilResolutionMinutes
        ) {
            setActivePanel("window");
            return "Join window must be between 15 minutes and 7 days, and cannot extend beyond the resolution time.";
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
            onClose();
            window.setTimeout(() => void open({ view: "Connect" }), 50);
            return;
        }
        if (!walletProvider) {
            setFormError("Wallet isn’t ready. Reconnect and try again.");
            return;
        }

        setIsSubmitting(true);
        setTxStatus("building");
        setFormError(null);
        setBalanceShortfall(null);

        let createStage: ChallengeActionStage = "validation";
        try {
            const usdcBalance = await fetchUsdcBalance(address);
            if (usdcBalance < betAmount) {
                setBalanceShortfall(Math.max(betAmount - usdcBalance, 0));
                setFormError(
                    usdcBalance <= 0
                        ? "You don’t have enough USDC to create this challenge."
                        : `Your balance is ${usdcBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC, but this challenge requires ${betAmount.toLocaleString()} USDC.`,
                );
                setTxStatus("idle");
                setIsPreviewOpen(false);
                return;
            }

            // Transaction timestamps must be calculated at submission time, not at render time.
            // eslint-disable-next-line react-hooks/purity
            const nowSec = Math.floor(Date.now() / 1000);
            const expiresAt = nowSec + duration.hours * 3600 + duration.minutes * 60;
            const resolvesAt = Math.max(Math.floor(selectedDate.getTime() / 1000), expiresAt);
            const topic = selectedChildCategory?.category?.trim() || (marketType === "sports" ? "SPORTS" : "CRYPTO");
            // The program's asset label is capped at 10 characters. Store the
            // base ticker there, while preserving the complete pair in
            // `tradingPair`/`trading_pair` for charts and price settlement.
            const ticker = topic.split("/", 1)[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase()
                || marketType.toUpperCase();
            const onchainAsset = ticker;
            const targetPrice = isPriceFeed ? Number(predictionPrice) : 0;
            const challengeStatement = isPriceFeed ? generatedStatement : statement.trim();

            createStage = "prepare";
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
                    maxTeamSize: 20,
                    statement: challengeStatement,
                    ticker,
                    tradingPair: topic,
                    target: targetPrice,
                    resolutionMethod: isPriceFeed ? "PRICE_FEED" : "COMMUNITY",
                    resolutionDate: new Date(resolvesAt * 1000).toISOString().split("T")[0],
                    marketType,
                    challengeFormat,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create challenge");

            setTxStatus("signing");
            createStage = "sign";
            const transaction = Transaction.from(Buffer.from(data.serializedTx, "base64"));
            const signedTransaction = await (walletProvider as {
                signTransaction: (transaction: Transaction) => Promise<Transaction>;
            }).signTransaction(transaction);

            setTxStatus("confirming");
            createStage = "submit";
            const connection = getReadonlyConnection();
            const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
                skipPreflight: false,
                preflightCommitment: "confirmed",
            });
            createStage = "confirm";
            const confirmation = await connection.confirmTransaction(
                {
                    signature,
                    blockhash: data.blockhash,
                    lastValidBlockHeight: data.lastValidBlockHeight,
                },
                "confirmed",
            );
            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
            }

            createStage = "save";
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
                        category_image: selectedChildCategory?.image_url || "",
                        resolves_at: new Date(resolvesAt * 1000).toISOString(),
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
                visibility: recipient ? "DIRECT" : "PUBLIC",
                challenged_user_id: recipient?.id,
                invitation_status: recipient ? "PENDING" : undefined,
            });

            setTxStatus("idle");
            if (!rememberSettings) {
                setMarketType("crypto");
                setChallengeFormat("price");
                setChallengeMode("pvp");
                setBetAmount(DEFAULT_BET_AMOUNT);
                setSelectedChildCategory(null);
                const nextResolutionDate = getDefaultResolutionDate(composerNow);
                setSelectedDate(nextResolutionDate);
                setDuration(durationFromMinutes(DEFAULT_DURATION_MINUTES));
            }
            setStatement("");
            setPredictionPrice("");
            setChartRange(DEFAULT_CHART_RANGE);
            setIsAdvancedPickerOpen(false);
            setActivePanel(null);
            setIsPreviewOpen(false);
            announceChallengeCreated();
            onCreated();
        } catch (error) {
            console.error("Error creating challenge:", error);
            setTxStatus("error");
            setFormError(getChallengeActionError(error, "create", createStage));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeposit = () => {
        onClose();
        window.setTimeout(() => {
            window.dispatchEvent(new Event("rektofun:open-deposit"));
        }, 0);
    };

    if (!isOpen) return null;

    const statusLabel = getStatusLabel();

    return createPortal(
        <div className="create-challenge-overlay fixed inset-0 z-[250] flex items-end justify-center p-0 sm:items-center sm:p-5">
            <button
                type="button"
                className="absolute inset-0 h-full w-full cursor-default bg-black/45 backdrop-blur-[2px]"
                onClick={() => {
                    if (isSubmitting) return;
                    setIsPreviewOpen(false);
                    setIsAdvancedPickerOpen(false);
                    setActivePanel(null);
                    onClose();
                }}
                aria-label="Close create challenge"
            />

            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-challenge-title"
                className="create-challenge-modal relative flex h-[100dvh] max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border-2 border-black bg-[#fffaf6] sm:h-auto sm:max-h-[92vh]"
            >
                <header className="flex shrink-0 items-center justify-between border-b-2 border-black px-3 py-2.5 sm:px-5 sm:py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center border-2 border-black bg-[#f5d547] sm:h-9 sm:w-9">
                            <Zap className="h-4.5 w-4.5 fill-black" />
                        </div>
                        <div>
                            <h2 id="create-challenge-title" className="text-base font-black tracking-tight text-[#17120f] sm:text-lg">
                                {recipient ? `Challenge @${recipient.username}` : "Create challenge"}
                            </h2>
                            <p className="text-[11px] font-bold text-[#7a6961]">Make your call.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (isSubmitting) return;
                            setIsPreviewOpen(false);
                            setIsAdvancedPickerOpen(false);
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
                                    disabled={siteSettings.cryptoCreationLocked}
                                    className={`inline-flex h-8 items-center justify-center gap-1.5 px-3 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${marketType === "crypto" ? "bg-black text-white" : "text-[#594b44] hover:bg-white/70"}`}
                                    aria-pressed={marketType === "crypto"}
                                    title={siteSettings.cryptoCreationLocked ? "Locked by admin" : undefined}
                                >
                                    {siteSettings.cryptoCreationLocked && <Lock className="h-3 w-3" />}
                                    <Coins className="h-3.5 w-3.5" /> Crypto
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchMarket("sports")}
                                    disabled={siteSettings.sportsCreationLocked}
                                    className={`inline-flex h-8 items-center justify-center gap-1.5 px-3 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${marketType === "sports" ? "bg-black text-white" : "text-[#594b44] hover:bg-white/70"}`}
                                    aria-pressed={marketType === "sports"}
                                    title={siteSettings.sportsCreationLocked ? "Locked by admin" : undefined}
                                >
                                    {siteSettings.sportsCreationLocked && <Lock className="h-3 w-3" />}
                                    <Trophy className="h-3.5 w-3.5" /> Sports
                                </button>
                            </div>

                            {marketType === "crypto" && (
                                <div className="grid w-full grid-cols-2 border border-black/20 bg-white p-0.5 min-[430px]:inline-flex min-[430px]:w-auto" aria-label="Challenge format">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (siteSettings.priceChallengesLocked) return;
                                            setChallengeFormat("price");
                                            setFormError(null);
                                        }}
                                        disabled={siteSettings.priceChallengesLocked}
                                        title={siteSettings.priceChallengesLocked ? "Locked by admin" : undefined}
                                        className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-[11px] font-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${challengeFormat === "price" ? "bg-[#e85a2d] text-white" : "text-[#6d5d55] hover:bg-[#f3e1d7]"}`}
                                        aria-pressed={challengeFormat === "price"}
                                    >
                                        {siteSettings.priceChallengesLocked && <Lock className="h-3 w-3" />}
                                        <Activity className="h-3.5 w-3.5" /> Price
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (siteSettings.statementChallengesLocked) return;
                                            setChallengeFormat("statement");
                                            setFormError(null);
                                        }}
                                        disabled={siteSettings.statementChallengesLocked}
                                        title={siteSettings.statementChallengesLocked ? "Locked by admin" : undefined}
                                        className={`inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-[11px] font-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${challengeFormat === "statement" ? "bg-[#e85a2d] text-white" : "text-[#6d5d55] hover:bg-[#f3e1d7]"}`}
                                        aria-pressed={challengeFormat === "statement"}
                                    >
                                        {siteSettings.statementChallengesLocked && <Lock className="h-3 w-3" />}
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
                                            <span className="inline-flex min-w-0 items-center gap-2">
                                                {selectedCategoryImage && (
                                                    <Image
                                                        src={selectedCategoryImage}
                                                        alt=""
                                                        width={28}
                                                        height={28}
                                                        unoptimized
                                                        className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7"
                                                    />
                                                )}
                                                <span className="min-w-0 truncate">{topicLabel || "This asset"}</span>
                                            </span>
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
                                                    disabled={isAssetPriceLoading}
                                                    onChange={(event) => {
                                                        setPredictionPrice(event.target.value);
                                                        setFormError(null);
                                                    }}
                                                    className="create-challenge-composer-input min-w-0 flex-1 border-0 bg-transparent px-1 py-1 text-xl font-black text-black outline-none placeholder:text-[#b7a9a2] disabled:cursor-not-allowed disabled:opacity-60 sm:text-2xl"
                                                    placeholder={isAssetPriceLoading ? "loading" : "target"}
                                                    aria-label="Target price"
                                                    aria-busy={isAssetPriceLoading}
                                                />
                                                {isAssetPriceLoading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#8b7a72]" />}
                                                {hasAssetPriceError && <span className="shrink-0 text-xs font-black text-[#e85a2d]" title="Price unavailable">!</span>}
                                            </label>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!selectedAssetSymbol) {
                                                    setActivePanel("topic");
                                                    return;
                                                }
                                                setIsAdvancedPickerOpen((current) => !current);
                                            }}
                                            aria-expanded={isAdvancedPickerOpen}
                                            className={`mt-3 flex w-full items-center justify-between gap-3 border px-3 py-2 text-left transition-colors ${isAdvancedPickerOpen ? "border-black bg-[#f5d547] text-black" : "border-black/15 bg-[#f8ede7] text-[#594b44] hover:border-black"}`}
                                        >
                                            <span className="flex min-w-0 items-center gap-2">
                                                <Activity className="h-3.5 w-3.5 shrink-0" />
                                                <span>
                                                    <span className="block text-[10px] font-black uppercase tracking-[0.1em]">Advanced mode</span>
                                                    <span className="mt-0.5 block text-[9px] font-bold opacity-65">
                                                        {selectedAssetSymbol ? "Analyze candles and place a visual target" : "Choose an asset to open the chart"}
                                                    </span>
                                                </span>
                                            </span>
                                            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isAdvancedPickerOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        {isAdvancedPickerOpen && selectedAssetSymbol && (
                                            <div className="mt-4">
                                                {isAssetPriceLoading ? (
                                                    <div className="flex h-44 items-center justify-center border-2 border-black/15 bg-[#f8ede7] text-[#8b7a72]">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <span className="ml-2 text-xs font-black">Loading market chart</span>
                                                    </div>
                                                ) : assetPriceState.status === "ready" && assetPriceState.currentPrice ? (
                                                    <TargetPricePicker
                                                        asset={selectedAssetSymbol}
                                                        candles={assetPriceState.candles}
                                                        currentPrice={assetPriceState.currentPrice}
                                                        targetPrice={Number(predictionPrice)}
                                                        direction={predictionDirection}
                                                        range={chartRange}
                                                        onRangeChange={setChartRange}
                                                        onTargetChange={(nextTarget) => {
                                                            setPredictionPrice(targetPriceInputValue(nextTarget));
                                                            setPredictionDirection(nextTarget >= assetPriceState.currentPrice! ? "Above" : "Below");
                                                            setFormError(null);
                                                        }}
                                                    />
                                                ) : null}
                                            </div>
                                        )}
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

                                <div className="mt-3 border-t-2 border-black/15 pt-3" aria-label="Challenge setup options">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#302722]">Challenge setup</p>
                                        <p className="text-[9px] font-bold text-[#8b7a72]">Tap an option to edit</p>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                        <ComposerButton
                                            icon={marketType === "crypto" ? Coins : Trophy}
                                            imageSrc={selectedCategoryImage}
                                            caption="Asset"
                                            label={topicLabel}
                                            isActive={activePanel === "topic"}
                                            onClick={() => togglePanel("topic")}
                                            layoutClassName="col-span-2"
                                        />
                                        <ComposerButton
                                            icon={CircleDollarSign}
                                            caption="Stake"
                                            label={`${betAmount || 0} USDC`}
                                            isActive={activePanel === "stake"}
                                            onClick={() => togglePanel("stake")}
                                            layoutClassName="col-span-2"
                                        />
                                        <ComposerButton
                                            icon={Clock3}
                                            caption="Window"
                                            label={formatDuration(duration)}
                                            isActive={activePanel === "window"}
                                            onClick={() => togglePanel("window")}
                                            layoutClassName="col-span-2"
                                        />
                                        <ComposerButton
                                            icon={CalendarDays}
                                            caption="Resolves by"
                                            label={formatDate(selectedDate)}
                                            isActive={activePanel === "resolution"}
                                            onClick={() => togglePanel("resolution")}
                                            layoutClassName="col-span-3"
                                        />
                                        <ComposerButton
                                            icon={challengeMode === "pvp" ? Swords : Users}
                                            caption="Mode"
                                            label={challengeMode === "pvp" ? "1 vs 1" : "Teams"}
                                            isActive={activePanel === "players"}
                                            onClick={() => togglePanel("players")}
                                            layoutClassName="col-span-3"
                                        />
                                    </div>
                                    <label className="mt-2.5 inline-flex cursor-pointer items-center gap-2 text-[10px] font-bold text-[#6d5d55] hover:text-[#302722]">
                                        <input
                                            type="checkbox"
                                            checked={rememberSettings}
                                            onChange={(event) => {
                                                const shouldRemember = event.target.checked;
                                                setRememberSettings(shouldRemember);
                                                if (!shouldRemember) {
                                                    window.localStorage.removeItem(CREATE_SETTINGS_KEY);
                                                }
                                            }}
                                            className="h-3.5 w-3.5 cursor-pointer accent-[#11895a]"
                                        />
                                        Remember these settings for my next challenge
                                    </label>
                                </div>
                            </div>
                        </div>

                        {activePanel && (
                            <div ref={setupPanelRef} className="mt-3 scroll-mt-3 border-2 border-black bg-[#f8ede7] p-3 sm:mt-4 sm:p-4">
                                {activePanel === "topic" && (
                                    <div>
                                        <PanelHeading>{marketType === "crypto" ? "Asset" : "Sport"}</PanelHeading>
                                        {isLoadingCategories ? (
                                            <div className="flex h-16 items-center justify-center text-[#7b6a62]">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            </div>
                                        ) : childCategories.length > 0 ? (
                                            <div className="create-asset-scroll max-h-36 space-y-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-40">
                                                {(marketType === "crypto" ? ASSET_GROUPS : [{ type: "sports", label: "Sports" }] as const).map((group) => {
                                                    const groupCategories = childCategories.filter((category) =>
                                                        group.type === "sports"
                                                            ? true
                                                            : (category.asset_type ?? "crypto") === group.type,
                                                    );
                                                    if (groupCategories.length === 0) return null;
                                                    return (
                                                        <section key={group.type}>
                                                            {marketType === "crypto" && (
                                                                <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#7b6a62]">
                                                                    {group.label}
                                                                </p>
                                                            )}
                                                            <div className="flex flex-wrap gap-2">
                                                                {groupCategories.map((category) => {
                                                    const isSelected = selectedChildCategory?.id === category.id;
                                                    const categoryImage = getCategoryImage(category);
                                                    return (
                                                        <button
                                                            key={category.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedChildCategory(category);
                                                                if (marketType === "crypto" && category.id !== selectedChildCategory?.id) {
                                                                    setPredictionPrice("");
                                                                    setPredictionDirection("Above");
                                                                }
                                                                setFormError(null);
                                                                setActivePanel(null);
                                                            }}
                                                            className={`inline-flex max-w-full items-center gap-1.5 break-words border-2 px-3 py-2 text-left text-xs font-black transition-all ${isSelected ? "border-black bg-[#f5d547] text-black shadow-[2px_2px_0_#111]" : "border-black/20 bg-white text-[#594b44] hover:border-black"}`}
                                                        >
                                                            {isSelected && <Check className="h-3.5 w-3.5" />}
                                                            {categoryImage && (
                                                                <Image
                                                                    src={categoryImage}
                                                                    alt=""
                                                                    width={20}
                                                                    height={20}
                                                                    unoptimized
                                                                    className="h-5 w-5 shrink-0 object-contain"
                                                                />
                                                            )}
                                                            {stripUsdcQuote(category.category)}
                                                        </button>
                                                    );
                                                                })}
                                                            </div>
                                                        </section>
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
                                                        setBalanceShortfall(null);
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
                                                        setBalanceShortfall(null);
                                                    }}
                                                    className="h-11 w-full border-2 border-black bg-white pl-7 pr-14 text-base font-black outline-none sm:h-10 sm:text-sm"
                                                    aria-label="Custom stake"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#8b7a72]">USDC</span>
                                            </label>
                                        </div>
                                        {/* <p className="mt-3 text-[11px] font-bold text-[#77675f]">
                                            {challengeMode === "pvp"
                                                ? `${estimatedPvpPool.toFixed(2)} USDC pot · ${estimatedPayout.toFixed(2)} to winner`
                                                : `Pool starts at ${Number.isFinite(betAmount) ? betAmount : 0} USDC`}
                                        </p> */}
                                    </div>
                                )}

                                {activePanel === "window" && (
                                    <div>
                                        <PanelHeading info="After this window closes, nobody new can join. The maximum is 7 days.">
                                            Join window
                                        </PanelHeading>
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
                                        <div className="mt-3 border-t-2 border-black/10 pt-3">
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#594b44]">Custom time</p>
                                                <p className="text-[10px] font-bold text-[#8b7a72]">15 min – 7 days</p>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {([
                                                    { part: "days", label: "Days", value: Math.floor(totalDurationMinutes / 1440), max: 7 },
                                                    { part: "hours", label: "Hours", value: Math.floor((totalDurationMinutes % 1440) / 60), max: 23 },
                                                    { part: "minutes", label: "Minutes", value: totalDurationMinutes % 60, max: 59 },
                                                ] as const).map((field) => (
                                                    <label key={field.part} className="min-w-0">
                                                        <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.08em] text-[#7b6a62]">{field.label}</span>
                                                        <input
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={0}
                                                            max={field.max}
                                                            value={field.value}
                                                            onChange={(event) => handleCustomDurationChange(field.part, event.target.value)}
                                                            className="h-11 w-full border-2 border-black bg-white px-2 text-center text-base font-black outline-none focus:bg-[#fff9d9]"
                                                            aria-label={`Custom join window ${field.label.toLowerCase()}`}
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 bg-[#163f31] px-3 py-2 text-white">
                                                <Clock3 className="h-4 w-4 shrink-0 text-[#f5d547]" />
                                                <span className="text-[10px] font-bold">Open for</span>
                                                <span className="ml-auto text-xs font-black">{formatDuration(duration)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activePanel === "resolution" && (
                                    <div>
                                        <PanelHeading info="The challenge will resolve on or before the selected time.">
                                            Resolves by
                                        </PanelHeading>
                                        <div className="mb-3 grid grid-cols-3 gap-2" aria-label="Quick resolution dates">
                                            {[
                                                { label: "Tomorrow", days: 1 },
                                                { label: "In 3 days", days: 3 },
                                                { label: "In 7 days", days: 7 },
                                            ].map((option) => (
                                                <button
                                                    key={option.days}
                                                    type="button"
                                                    onClick={() => selectResolutionOffset(option.days)}
                                                    className="min-h-9 border-2 border-black/20 bg-white px-1 text-[10px] font-black text-[#594b44] hover:border-black hover:bg-[#f5d547]"
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
                                            <label className="col-span-3 min-w-0">
                                                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.08em] text-[#7b6a62]">Date</span>
                                                <span className="flex h-12 items-center gap-2 border-2 border-black bg-white px-3 focus-within:bg-[#fff9d9]">
                                                    <CalendarDays className="h-4 w-4 shrink-0 text-[#e85a2d]" />
                                                    <input
                                                        type="date"
                                                        required
                                                        value={toDateInputValue(selectedDate)}
                                                        min={toDateInputValue(minResolutionDate)}
                                                        max={toDateInputValue(maxResolutionDate)}
                                                        onChange={(event) => handleResolutionDayChange(event.target.value)}
                                                        className="create-challenge-date-input h-full w-full min-w-0 border-0 bg-transparent text-xs font-black text-black outline-none"
                                                        aria-label="Resolution date"
                                                    />
                                                </span>
                                            </label>
                                            <label className="col-span-2 min-w-0">
                                                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.08em] text-[#7b6a62]">Time</span>
                                                <span className="flex h-12 items-center gap-2 border-2 border-black bg-white px-2 focus-within:bg-[#fff9d9]">
                                                    <Clock3 className="hidden h-4 w-4 shrink-0 text-[#11895a] min-[390px]:block" />
                                                    <input
                                                        type="time"
                                                        required
                                                        step={60}
                                                        value={toTimeInputValue(selectedDate)}
                                                        onChange={(event) => handleResolutionTimeChange(event.target.value)}
                                                        className="create-challenge-date-input h-full w-full min-w-0 border-0 bg-transparent text-xs font-black text-black outline-none"
                                                        aria-label="Resolution time"
                                                    />
                                                </span>
                                            </label>
                                        </div>
                                        <div className="mt-3 flex items-center gap-3 border-2 border-black bg-[#f5d547] px-3 py-2.5 shadow-[2px_2px_0_#111]">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-black text-[#f5d547]">
                                                <CalendarDays className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-[9px] font-black uppercase tracking-[0.1em] text-black/55">Your challenge resolves on or before</span>
                                                <span className="block truncate text-sm font-black text-black">{formatDate(selectedDate)}</span>
                                            </span>
                                            <span className="ml-auto shrink-0 text-right text-[9px] font-bold text-black/60">
                                                in {formatDuration(durationFromMinutes(timeUntilResolutionMinutes))}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-[10px] font-bold text-[#7b6a62]">
                                            Pick any time from 15 minutes to 14 days from now.
                                        </p>
                                    </div>
                                )}

                                {activePanel === "players" && (
                                    <div>
                                        <PanelHeading>Select mode</PanelHeading>
                                        <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                                            <button
                                                type="button"
                                                disabled={siteSettings.pvpChallengesLocked}
                                                title={siteSettings.pvpChallengesLocked ? "Locked by admin" : undefined}
                                                onClick={() => {
                                                    setChallengeMode("pvp");
                                                    setActivePanel(null);
                                                }}
                                                className={`flex items-center gap-3 border-2 p-3 text-left disabled:cursor-not-allowed disabled:opacity-40 ${challengeMode === "pvp" ? "border-black bg-black text-white shadow-[3px_3px_0_#f5d547]" : "border-black/20 bg-white text-black hover:border-black"}`}
                                            >
                                                <Swords className="h-5 w-5 shrink-0" />
                                                <span>
                                                    <span className="block text-xs font-black">1 vs 1</span>
                                                    <span className={`text-[10px] font-bold ${challengeMode === "pvp" ? "text-white/65" : "text-[#8b7a72]"}`}>
                                                        {siteSettings.pvpChallengesLocked ? "Locked" : "PvP Mode"}
                                                    </span>
                                                </span>
                                                {siteSettings.pvpChallengesLocked && <Lock className="ml-auto h-4 w-4 shrink-0" />}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={Boolean(recipient) || siteSettings.teamChallengesLocked}
                                                title={siteSettings.teamChallengesLocked ? "Locked by admin" : undefined}
                                                onClick={() => {
                                                    setChallengeMode("team");
                                                    setActivePanel(null);
                                                }}
                                                className={`flex items-center gap-3 border-2 p-3 text-left disabled:cursor-not-allowed disabled:opacity-40 ${challengeMode === "team" ? "border-black bg-black text-white shadow-[3px_3px_0_#f5d547]" : "border-black/20 bg-white text-black hover:border-black"}`}
                                            >
                                                <Users className="h-5 w-5 shrink-0" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-xs font-black">Team</span>
                                                    <span className={`text-[10px] font-bold ${challengeMode === "team" ? "text-white/65" : "text-[#8b7a72]"}`}>
                                                        {siteSettings.teamChallengesLocked ? "Locked" : "Team mode"}
                                                    </span>
                                                </span>
                                                {siteSettings.teamChallengesLocked && <Lock className="h-4 w-4 shrink-0" />}
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
                        {balanceShortfall !== null && (
                            <div className="mt-3 flex flex-col gap-3 border-2 border-black bg-amber-50 px-3 py-3 sm:flex-row sm:items-center">
                                <CircleDollarSign className="h-5 w-5 shrink-0 text-amber-700" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-amber-950">Deposit USDC to continue</p>
                                    <p className="text-xs font-medium text-amber-800">
                                        Add at least {balanceShortfall.toLocaleString(undefined, { maximumFractionDigits: 6 })} USDC, then create the challenge again.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDeposit}
                                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border-2 border-black bg-black px-3 py-2 text-xs font-black text-white transition hover:bg-[#27211e] hover:shadow-[2px_2px_0_#e85a2d]"
                                >
                                    <CircleDollarSign className="h-4 w-4" />
                                    Deposit funds
                                </button>
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
                                user={user}
                                marketType={marketType}
                                isPriceFeed={isPriceFeed}
                                challengeMode={challengeMode}
                                pairTag={rawTopicLabel}
                                categoryImage={selectedChildCategory?.image_url}
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

                .create-challenge-modal .create-asset-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: #8b7355 rgba(139, 115, 85, 0.12);
                }

                .create-challenge-modal .create-asset-scroll::-webkit-scrollbar {
                    width: 4px;
                }

                .create-challenge-modal .create-asset-scroll::-webkit-scrollbar-track {
                    background: rgba(139, 115, 85, 0.12);
                    border-radius: 999px;
                }

                .create-challenge-modal .create-asset-scroll::-webkit-scrollbar-thumb {
                    background: #8b7355;
                    border-radius: 999px;
                }

                .create-challenge-modal .create-asset-scroll::-webkit-scrollbar-thumb:hover {
                    background: #594b44;
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
    imageSrc,
    caption,
    label,
    isActive,
    onClick,
    layoutClassName,
}: {
    icon: typeof Coins;
    imageSrc?: string;
    caption: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
    layoutClassName?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={isActive}
            title={`${caption}: ${label}`}
            className={`group relative inline-flex min-h-16 min-w-0 items-center gap-2 border-2 px-2.5 py-2 text-left transition-all ${layoutClassName ?? ""} ${isActive
                ? "border-black bg-[#f5d547] text-black shadow-[3px_3px_0_#111]"
                : "border-black/30 bg-[#fffaf7] text-[#302722] hover:border-black hover:bg-[#fff5c2]"
                }`}
        >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center border ${isActive ? "border-black bg-black text-[#f5d547]" : "border-black/20 bg-white text-[#e85a2d] group-hover:border-black"}`}>
                {imageSrc ? (
                    <Image
                        src={imageSrc}
                        alt=""
                        width={20}
                        height={20}
                        unoptimized
                        className="h-5 w-5 object-contain"
                    />
                ) : (
                    <Icon className="h-4 w-4" strokeWidth={2.4} />
                )}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block whitespace-nowrap text-[9px] font-black uppercase leading-none tracking-[0.08em] text-[#75655d]">
                    {caption}
                </span>
                <span className="mt-1.5 block break-words text-[11px] font-black leading-tight text-[#17120f]">
                    {label}
                </span>
            </span>
            {isActive ? <span className="absolute right-1 top-1 h-1.5 w-1.5 bg-black" aria-hidden="true" /> : null}
        </button>
    );
}

function TargetPricePicker({
    asset,
    candles,
    currentPrice,
    targetPrice,
    direction,
    range,
    onRangeChange,
    onTargetChange,
}: {
    asset: string;
    candles: MarketCandle[];
    currentPrice: number;
    targetPrice: number;
    direction: "Above" | "Below";
    range: ChartRange;
    onRangeChange: (range: ChartRange) => void;
    onTargetChange: (target: number) => void;
}) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartApiRef = useRef<ReturnType<typeof createChart> | null>(null);
    const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const targetLineRef = useRef<IPriceLine | null>(null);
    const onTargetChangeRef = useRef(onTargetChange);
    const [interactionMode, setInteractionMode] = useState<"analyze" | "target">("analyze");
    const selectedTarget = Number.isFinite(targetPrice) && targetPrice > 0 ? targetPrice : currentPrice;
    const targetChange = currentPrice > 0 ? ((selectedTarget - currentPrice) / currentPrice) * 100 : 0;
    const targetStateRef = useRef({ price: selectedTarget, direction });
    const bounds = getTargetPriceBounds(candles, currentPrice);

    useEffect(() => {
        onTargetChangeRef.current = onTargetChange;
    }, [onTargetChange]);

    useEffect(() => {
        targetStateRef.current = { price: selectedTarget, direction };
        targetLineRef.current?.applyOptions({
            price: selectedTarget,
            title: `${direction.toUpperCase()} TARGET`,
        });
    }, [direction, selectedTarget]);

    useEffect(() => {
        const container = chartContainerRef.current;
        const priceBounds = getTargetPriceBounds(candles, currentPrice);
        if (!container || !priceBounds) return;

        const validCandles = candles
            .filter((candle) => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite))
            .map((candle) => ({
                time: Math.floor(candle.time / 1000) as UTCTimestamp,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
            }));
        if (validCandles.length < 2) return;

        const chartApi = createChart(container, {
            autoSize: true,
            layout: {
                background: { type: ColorType.Solid, color: "#163f31" },
                textColor: "rgba(255,255,255,.58)",
                fontFamily: "inherit",
                attributionLogo: true,
            },
            grid: {
                vertLines: { color: "rgba(255,255,255,.07)" },
                horzLines: { color: "rgba(255,255,255,.09)" },
            },
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: { color: "rgba(255,255,255,.35)", labelBackgroundColor: "#246044" },
                horzLine: { color: "rgba(255,255,255,.35)", labelBackgroundColor: "#246044" },
            },
            rightPriceScale: {
                borderColor: "rgba(255,255,255,.15)",
            },
            timeScale: {
                borderColor: "rgba(255,255,255,.15)",
                timeVisible: true,
                secondsVisible: false,
                rightOffset: 1,
                barSpacing: 12,
                minBarSpacing: 1,
            },
            handleScroll: true,
            handleScale: true,
            localization: {
                priceFormatter: (price: number) => formatPrice(String(price)),
            },
        });
        chartApiRef.current = chartApi;
        const candleSeries = chartApi.addSeries(CandlestickSeries, {
            upColor: "#34d399",
            downColor: "#fb7185",
            borderUpColor: "#a7f3d0",
            borderDownColor: "#fecdd3",
            wickUpColor: "#6ee7b7",
            wickDownColor: "#fda4af",
            priceLineVisible: false,
            lastValueVisible: false,
        });
        candleSeries.setData(validCandles);

        const rangeSeries = chartApi.addSeries(LineSeries, {
            color: "rgba(0,0,0,0)",
            lineVisible: false,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
            lastValueVisible: false,
        });
        rangeSeries.setData([
            { time: validCandles[0].time, value: priceBounds.minPrice },
            { time: validCandles.at(-1)!.time, value: priceBounds.maxPrice },
        ]);

        candleSeries.createPriceLine({
            price: currentPrice,
            color: "rgba(255,255,255,.48)",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "CURRENT",
        });
        const initialTarget = targetStateRef.current;
        targetLineRef.current = candleSeries.createPriceLine({
            price: initialTarget.price,
            color: "#f5d547",
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `${initialTarget.direction.toUpperCase()} TARGET`,
        });
        candleSeriesRef.current = candleSeries;
        chartApi.timeScale().fitContent();

        return () => {
            chartApiRef.current = null;
            candleSeriesRef.current = null;
            targetLineRef.current = null;
            chartApi.remove();
        };
    }, [candles, currentPrice]);

    const selectTargetFromPointer = (clientY: number) => {
        const container = chartContainerRef.current;
        const candleSeries = candleSeriesRef.current;
        if (!container || !candleSeries || !bounds) return;
        const coordinate = clientY - container.getBoundingClientRect().top;
        const price = candleSeries.coordinateToPrice(coordinate);
        if (typeof price !== "number" || !Number.isFinite(price)) return;
        onTargetChangeRef.current(Math.max(bounds.minPrice, Math.min(bounds.maxPrice, price)));
    };

    const handleTargetPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        selectTargetFromPointer(event.clientY);
    };

    const handleTargetPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) selectTargetFromPointer(event.clientY);
    };

    const zoomChart = (factor: number) => {
        const timeScale = chartApiRef.current?.timeScale();
        const visibleRange = timeScale?.getVisibleLogicalRange();
        if (!timeScale || !visibleRange) return;
        const center = (visibleRange.from + visibleRange.to) / 2;
        const halfRange = ((visibleRange.to - visibleRange.from) * factor) / 2;
        timeScale.setVisibleLogicalRange({ from: center - halfRange, to: center + halfRange });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!bounds || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        const change = currentPrice * 0.01 * (event.key === "ArrowUp" ? 1 : -1);
        onTargetChange(Math.max(bounds.minPrice, Math.min(bounds.maxPrice, selectedTarget + change)));
    };

    if (!bounds) return null;

    return (
        <section className="overflow-hidden border-2 border-black bg-[#163f31] text-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 px-3 py-2.5 sm:px-4">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/20 bg-white/10">
                        <Crosshair className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/55">
                            {interactionMode === "analyze" ? "Analyze the market" : "Pick your target"}
                        </p>
                        <p className="text-xs font-black sm:text-sm">
                            {interactionMode === "analyze" ? "Pan, zoom and inspect the candles" : "Click or drag to move the target"}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/50">Current {asset}</p>
                    <p className="text-sm font-black">{formatPrice(String(currentPrice))}</p>
                </div>
            </div>

            <div className="grid gap-2 border-b border-white/15 bg-black/10 px-3 py-2 min-[460px]:grid-cols-2 sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="hidden text-[9px] font-black uppercase tracking-[0.1em] text-white/50 min-[430px]:inline">Range</span>
                    <div className="grid min-w-0 flex-1 grid-cols-4 border border-white/20 bg-black/15 p-0.5" aria-label="Market chart range">
                        {(["24H", "7D", "30D", "3M"] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => onRangeChange(option)}
                                aria-pressed={range === option}
                                className={`h-8 min-w-0 px-1 text-[9px] font-black transition-colors ${range === option ? "bg-white text-[#163f31]" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid min-w-0 grid-cols-2 border border-white/20 bg-black/15 p-0.5" aria-label="Chart interaction mode">
                    {(["analyze", "target"] as const).map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setInteractionMode(mode)}
                            aria-pressed={interactionMode === mode}
                            className={`inline-flex h-8 min-w-0 items-center justify-center gap-1 px-1 text-[9px] font-black uppercase transition-colors ${interactionMode === mode ? mode === "target" ? "bg-[#f5d547] text-black" : "bg-white text-[#163f31]" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                        >
                            {mode === "analyze" ? <Activity className="h-3 w-3" /> : <Crosshair className="h-3 w-3" />}
                            {mode === "analyze" ? "Analyze" : "Set target"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-4 border-b border-white/15 bg-black/10 p-1.5">
                {[-10, -5, 5, 10].map((percentage) => {
                    const isActive = Math.abs(targetChange - percentage) < 0.15;
                    const isUp = percentage > 0;
                    return (
                        <button
                            key={percentage}
                            type="button"
                            onClick={() => onTargetChange(currentPrice * (1 + percentage / 100))}
                            className={`flex h-8 items-center justify-center gap-1 text-[10px] font-black transition-colors ${isActive ? "bg-[#f5d547] text-black" : "text-white/65 hover:bg-white/10 hover:text-white"}`}
                            aria-label={`Set target ${Math.abs(percentage)} percent ${isUp ? "above" : "below"} current price`}
                        >
                            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {percentage > 0 ? "+" : ""}{percentage}%
                        </button>
                    );
                })}
            </div>

            <div className="relative h-48 min-w-0 select-none min-[400px]:h-52 sm:h-56">
                <div ref={chartContainerRef} className="h-full w-full" />
                {interactionMode === "analyze" && (
                    <div className="absolute bottom-2 right-2 z-20 flex border border-white/20 bg-[#163f31]/90 p-0.5 shadow-sm sm:bottom-auto sm:right-14 sm:top-2" aria-label="Chart zoom controls">
                        <button
                            type="button"
                            onClick={() => zoomChart(1.35)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center text-sm font-black text-white/70 hover:bg-white/10 hover:text-white"
                            aria-label="Zoom out"
                            title="Zoom out"
                        >
                            −
                        </button>
                        <button
                            type="button"
                            onClick={() => zoomChart(0.72)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center border-x border-white/15 text-sm font-black text-white/70 hover:bg-white/10 hover:text-white"
                            aria-label="Zoom in"
                            title="Zoom in"
                        >
                            +
                        </button>
                        <button
                            type="button"
                            onClick={() => chartApiRef.current?.timeScale().fitContent()}
                            className="flex h-7 cursor-pointer items-center justify-center px-2 text-[8px] font-black uppercase text-white/70 hover:bg-white/10 hover:text-white"
                            aria-label="Fit all candles"
                            title="Fit all candles"
                        >
                            Fit
                        </button>
                    </div>
                )}
                {interactionMode === "target" && (
                    <div
                        role="slider"
                        tabIndex={0}
                        aria-label={`${asset} target price`}
                        aria-valuemin={bounds.minPrice}
                        aria-valuemax={bounds.maxPrice}
                        aria-valuenow={selectedTarget}
                        aria-valuetext={`${direction} ${formatPrice(String(selectedTarget))}`}
                        onPointerDown={handleTargetPointerDown}
                        onPointerMove={handleTargetPointerMove}
                        onPointerUp={(event) => {
                            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                event.currentTarget.releasePointerCapture(event.pointerId);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        className="absolute inset-0 z-20 touch-none cursor-ns-resize outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#f5d547]"
                    />
                )}
                <span
                    className="pointer-events-none absolute left-2 top-2 z-10 max-w-[70%] border border-black bg-[#f5d547] px-2 py-1 text-[9px] font-black text-black shadow-[2px_2px_0_#111]"
                >
                    {direction} {formatPrice(String(selectedTarget))} · {targetChange >= 0 ? "+" : ""}{targetChange.toFixed(1)}%
                </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-white/15 px-3 py-2 text-[8px] font-bold text-white/50 sm:px-4 sm:text-[9px]">
                <span className="min-w-0">
                    <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="pointer-events-auto text-white/65 hover:text-white">Charts by TradingView</a>
                    {` · ${range}`}
                </span>
                <span>{interactionMode === "analyze" ? "Wheel/pinch to zoom" : "↑↓ keys adjust by 1%"}</span>
            </div>
        </section>
    );
}

function getTargetPriceBounds(candles: MarketCandle[], currentPrice: number) {
    const validCandles = candles.filter((candle) => Number.isFinite(candle.close) && candle.close > 0);
    if (validCandles.length < 2 || !Number.isFinite(currentPrice) || currentPrice <= 0) return null;

    const lows = validCandles.map((candle) => Number.isFinite(candle.low) && candle.low > 0 ? candle.low : candle.close);
    const highs = validCandles.map((candle) => Number.isFinite(candle.high) && candle.high > 0 ? candle.high : candle.close);
    const observedMin = Math.min(...lows);
    const observedMax = Math.max(...highs);
    const baseSpread = Math.max(observedMax - observedMin, currentPrice * 0.08);
    let minPrice = Math.max(0, Math.min(observedMin - baseSpread * 0.15, currentPrice * 0.75));
    let maxPrice = Math.max(observedMax + baseSpread * 0.15, currentPrice * 1.25);
    const padding = Math.max((maxPrice - minPrice) * 0.04, currentPrice * 0.005);
    minPrice = Math.max(0, minPrice - padding);
    maxPrice += padding;

    return { minPrice, maxPrice };
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
    user,
    marketType,
    isPriceFeed,
    challengeMode,
    pairTag,
    categoryImage,
    title,
    betAmount,
    duration,
    resolutionDate,
}: {
    user: User | null;
    marketType: MarketType;
    isPriceFeed: boolean;
    challengeMode: ChallengeMode;
    pairTag: string;
    categoryImage?: string;
    title: string;
    betAmount: number;
    duration: { hours: number; minutes: number };
    resolutionDate: Date;
}) {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + (duration.hours * 60 + duration.minutes) * 60 * 1000);
    const username = user?.username || "You";
    const profileImage = user?.profile_image || "/scribbles/btc.png";
    const creatorId = user?.id ?? -1;
    const pair = pairTag.trim();
    const ticker = pair.split("/", 1)[0].toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || marketType.toUpperCase();
    const safeBetAmount = Number.isFinite(betAmount) ? betAmount : 0;

    const previewChallenge: Challenge = {
        id: -1,
        views: 0,
        title,
        statement: title,
        ticker,
        trading_pair: pair,
        target: 0,
        initial_bet: safeBetAmount,
        pool_size: safeBetAmount,
        total_pool: safeBetAmount,
        category_image: categoryImage || null,
        resolution_source: isPriceFeed ? "PRICE_FEED" : "COMMUNITY",
        metadata: {
            composer: {
                market: marketType,
                format: isPriceFeed ? "price" : "statement",
                topic: pair,
                category_image: categoryImage || "",
                resolves_at: resolutionDate.toISOString(),
            },
        },
        creator: creatorId as Challenge["creator"],
        creator_id: creatorId,
        creator_details: user,
        resolution_method: isPriceFeed ? "PRICE_FEED" : "COMMUNITY",
        participants: 1,
        total_challengers: 1,
        total_opponents: 0,
        status: "OPEN",
        mode: challengeMode === "pvp" ? "PVP" : "TEAM",
        result: "TEAM_A",
        direction: "UP",
        expiry: expiryDate.toISOString(),
        expire_time: expiryDate.toISOString(),
        resolution_date: resolutionDate.toISOString().split("T")[0],
        resolve_time: resolutionDate.toISOString(),
        resolved_at: "",
        final_price: 0,
        category: marketType === "crypto" ? "Crypto" : "Sports",
        created_at: now.toISOString(),
        bet_info: {
            highest_bet: {
                TEAM_A: {
                    id: creatorId,
                    username,
                    profile_image: profileImage,
                    pubkey: user?.pubkey || user?.wallet_address || "",
                    bet: safeBetAmount,
                    twitter_username: user?.twitter_username ?? null,
                    user_type: user?.user_type ?? "user",
                },
            },
            team_count: {
                TEAM_A: {
                    total_bets: 1,
                    total_amount: safeBetAmount,
                },
            },
        },
        market: {
            name: pair,
            icon: "",
            image: "",
            parent_market_id: "",
            parent_id: "",
        },
    };

    return (
        <div className="mx-auto w-full max-w-[392px]">
            <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.12em] text-[#8b7a72]">Challenge preview</p>
            <div inert className="pointer-events-none select-none" aria-label="Challenge card preview">
                <ChallengeCard challenge={previewChallenge} showPin={false} />
            </div>
            <div className="mt-3 border-2 border-black bg-[#f5d547] px-3 py-2.5 text-[10px] font-bold leading-relaxed text-[#17120f] shadow-[2px_2px_0_#111]">
                <span className="font-black uppercase">Important:</span>{" "}
                You can cancel the challenge and receive a refund only before the join window closes. Once someone accepts the challenge, it can no longer be cancelled.
            </div>
        </div>
    );
}

function PanelHeading({ children, info }: { children: React.ReactNode; info?: string }) {
    return (
        <h3 className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#75645c]">
            <span>{children}</span>
            {info && (
                <span
                    className="group relative inline-flex shrink-0 cursor-help animate-pulse"
                    tabIndex={0}
                    aria-label={info}
                >
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                    <span
                        role="tooltip"
                        className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-64 max-w-[calc(100vw-4rem)] border border-black bg-black px-2.5 py-2 text-[10px] font-bold normal-case leading-relaxed tracking-normal text-white opacity-0 shadow-[2px_2px_0_#e85a2d] transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                    >
                        {info}
                    </span>
                </span>
            )}
        </h3>
    );
}
