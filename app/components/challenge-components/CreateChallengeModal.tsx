"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { DatePickerModal } from "./DatePickerModal";
import { DurationPickerModal } from "./DurationPickerModal";
import {
    buildCreateChallengeTx,
    deriveChallengePDA,
    deriveCreatorCounter,
    getRektoProgram,
    getReadonlyConnection,
} from "@/app/lib/rektofun-program";
import { createChallenge } from "@/app/lib/challenges-service/challenges";
import { getMarkets, Market } from "@/app/lib/markets-service/market";
import { transform } from "@/app/lib/transformation-text-ai/transform";
import { useUserStore } from "@/app/store/useUserStore";
import { blockedContentError, hasBlockedContent } from "@/app/lib/content-moderation";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { PublicKey, Transaction } from "@solana/web3.js";

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

type TxStatus = "idle" | "building" | "signing" | "confirming" | "success" | "error";
type CreateChallengeStep = "mode" | "category" | "details";

interface ValidationState {
    suggestions: string[];
    isValid: boolean;
    isLoading: boolean;
    error: string | null;
    selectedSuggestion: string | null;
}

interface MarketState {
    markets: Market[];
    childMarkets: Market[];
    sportsEventMarkets: Market[];
    selected: Market | null;
    selectedChild: Market | null;
    selectedSportsEvent: Market | null;
}

export function CreateChallengeModal({
    isOpen,
    onClose,
    onCreated,
}: CreateChallengeModalProps) {
    // Step and mode
    const [currentStep, setCurrentStep] = useState<CreateChallengeStep>("mode");
    const [challengeMode, setChallengeMode] = useState<"pvp" | "multi">("pvp");

    // Markets consolidated state
    const [marketState, setMarketState] = useState<MarketState>({
        markets: [],
        childMarkets: [],
        sportsEventMarkets: [],
        selected: null,
        selectedChild: null,
        selectedSportsEvent: null,
    });

    // Challenge details
    const [betAmount, setBetAmount] = useState(5);
    const [betAmountError, setBetAmountError] = useState<string | null>(null);
    const [predictionDirection, setPredictionDirection] = useState("Above");
    const [predictionPrice, setPredictionPrice] = useState("66500");
    const [selectedDate, setSelectedDate] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [duration, setDuration] = useState({ hours: 4, minutes: 0 });
    const [challengeStatement, setChallengeStatement] = useState("");
    const [challengeStatementError, setChallengeStatementError] = useState<string | null>(null);
    const [sportsResolutionConsent, setSportsResolutionConsent] = useState(false);
    const [sportsResolutionConsentError, setSportsResolutionConsentError] = useState<string | null>(null);

    // Validation state
    const [validation, setValidation] = useState<ValidationState>({
        suggestions: [],
        isValid: true,
        isLoading: false,
        error: null,
        selectedSuggestion: null,
    });

    // UI state
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);

    // Transaction state
    const [txStatus, setTxStatus] = useState<TxStatus>("idle");
    const [txError, setTxError] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    const { user } = useUserStore();
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();

    const dropdownRefs = {
        coin: useRef<HTMLDivElement>(null),
        sportsEvent: useRef<HTMLDivElement>(null),
        direction: useRef<HTMLDivElement>(null),
    };

    const isSportsSelected = marketState.selected?.symbol?.toLowerCase() === 'sports' || 
                            marketState.selected?.name?.toLowerCase() === 'sports';

    useBodyScrollLock(isOpen);

    // Reset on open
    useEffect(() => {
        if (!isOpen) return;
        setTxStatus("idle");
        setTxError(null);
        setTxSignature(null);
        setChallengeStatementError(null);
        setSportsResolutionConsentError(null);
        setSportsResolutionConsent(false);
    }, [isOpen]);

    // Fetch markets
    useEffect(() => {
        if (!isOpen) return;
        const fetchMarkets = async () => {
            try {
                const response = await getMarkets({ parent_id: null });
                const fetchedMarkets = response.markets;
                const cryptoMarket = fetchedMarkets.find(m => m.symbol?.toLowerCase() === 'crypto' || m.name?.toLowerCase() === 'crypto');
                setMarketState(prev => ({
                    ...prev,
                    markets: fetchedMarkets,
                    selected: cryptoMarket || fetchedMarkets[0] || null,
                }));
            } catch (error) {
                console.error("Error fetching markets:", error);
            }
        };
        fetchMarkets();
    }, [isOpen]);

    // Fetch child markets when parent changes
    useEffect(() => {
        if (!isOpen || !marketState.selected?.id) {
            setMarketState(prev => ({ ...prev, childMarkets: [], selectedChild: null }));
            return;
        }
        const fetchChildMarkets = async () => {
            try {
                const response = await getMarkets({ parent_id: marketState.selected!.id });
                const fetchedMarkets = response.markets;
                setMarketState(prev => ({
                    ...prev,
                    childMarkets: fetchedMarkets,
                    selectedChild: fetchedMarkets[0] ?? null,
                }));
            } catch (error) {
                console.error("Error fetching child markets:", error);
                setMarketState(prev => ({ ...prev, childMarkets: [], selectedChild: null }));
            }
        };
        fetchChildMarkets();
    }, [isOpen, marketState.selected]);

    // Fetch sports event markets
    useEffect(() => {
        if (!isOpen || !isSportsSelected || !marketState.selectedChild?.id) {
            setMarketState(prev => ({ ...prev, sportsEventMarkets: [], selectedSportsEvent: null }));
            return;
        }
        const fetchSportsEventMarkets = async () => {
            try {
                const response = await getMarkets({ parent_id: marketState.selectedChild!.id });
                const fetchedMarkets = response.markets;
                setMarketState(prev => ({
                    ...prev,
                    sportsEventMarkets: fetchedMarkets,
                    selectedSportsEvent: fetchedMarkets[0] ?? null,
                }));
            } catch (error) {
                console.error("Error fetching sports event markets:", error);
                setMarketState(prev => ({ ...prev, sportsEventMarkets: [], selectedSportsEvent: null }));
            }
        };
        fetchSportsEventMarkets();
    }, [isOpen, isSportsSelected, marketState.selectedChild]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dropdownRefs.coin.current && !dropdownRefs.coin.current.contains(target)) {
                setOpenDropdown(prev => prev === 'coin' ? null : prev);
            }
            if (dropdownRefs.sportsEvent.current && !dropdownRefs.sportsEvent.current.contains(target)) {
                setOpenDropdown(prev => prev === 'sportsEvent' ? null : prev);
            }
            if (dropdownRefs.direction.current && !dropdownRefs.direction.current.contains(target)) {
                setOpenDropdown(prev => prev === 'direction' ? null : prev);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset validation when market changes
    useEffect(() => {
        if (!isOpen || !marketState.selected) {
            setValidation({ suggestions: [], isValid: true, isLoading: false, error: null, selectedSuggestion: null });
            return;
        }
        setValidation({
            suggestions: [],
            isValid: !isSportsSelected,
            isLoading: false,
            error: null,
            selectedSuggestion: null,
        });
    }, [isOpen, marketState.selected, isSportsSelected]);

    const closeAllDropdowns = useCallback(() => setOpenDropdown(null), []);

    const resetModalState = useCallback(() => {
        setMarketState({
            markets: [],
            childMarkets: [],
            sportsEventMarkets: [],
            selected: null,
            selectedChild: null,
            selectedSportsEvent: null,
        });
        setOpenDropdown(null);
        setBetAmount(5);
        setBetAmountError(null);
        setPredictionDirection("Above");
        setPredictionPrice("66500");
        setSelectedDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
        setIsDatePickerOpen(false);
        setDuration({ hours: 4, minutes: 0 });
        setIsDurationPickerOpen(false);
        setCurrentStep("mode");
        setChallengeMode("pvp");
        setChallengeStatement("");
        setChallengeStatementError(null);
        setValidation({ suggestions: [], isValid: true, isLoading: false, error: null, selectedSuggestion: null });
        setSportsResolutionConsent(false);
        setSportsResolutionConsentError(null);
        setTxStatus("idle");
        setTxError(null);
        setTxSignature(null);
    }, []);

    const handleModalClose = useCallback(() => {
        resetModalState();
        onClose();
    }, [resetModalState, onClose]);

    const handleValidateChallengeStatement = useCallback(async () => {
        if (!isSportsSelected) return;
        if (!challengeStatement.trim()) {
            setChallengeStatementError("Please enter a challenge statement.");
            return;
        }
        setChallengeStatementError(null);
        setValidation(prev => ({ ...prev, error: null, selectedSuggestion: null, isValid: false, isLoading: true }));
        try {
            const category = marketState.selectedChild?.symbol || marketState.selectedChild?.name || "sports";
            const response = await transform({ category, statement: challengeStatement });
            setValidation(prev => ({
                ...prev,
                suggestions: response.statements || [],
                isValid: false,
                error: (!response.valid || !response.statements?.length) 
                    ? "The statement could not be validated. Please rewrite the statement properly." 
                    : null,
            }));
        } catch (error) {
            console.error("Validate transform error:", error);
            const errMessage = error instanceof Error ? error.message : "";
            setValidation(prev => ({
                ...prev,
                error: errMessage || "Unable to validate right now. Please try again.",
                isValid: false,
                suggestions: [],
            }));
        } finally {
            setValidation(prev => ({ ...prev, isLoading: false }));
        }
    }, [isSportsSelected, challengeStatement, marketState.selectedChild]);

    if (!isOpen) return null;

    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
        const timeOptions: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", hour12: true };
        return `${date.toLocaleDateString("en-US", options)} at ${date.toLocaleTimeString("en-US", timeOptions)}`;
    };

    const formatDuration = (dur: { hours: number; minutes: number }) => {
        if (dur.hours === 0 && dur.minutes === 0) return "Select duration";
        const days = Math.floor(dur.hours / 24);
        const remainingHours = dur.hours % 24;
        let result = "";
        if (days > 0) result += `${days}d `;
        if (remainingHours > 0) result += `${remainingHours}h `;
        if (dur.minutes > 0) result += `${dur.minutes}m`;
        return result.trim();
    };

    const handleCreateChallenge = async () => {
        if (!isConnected) {
            open();
            return;
        }
        if (!address) {
            setTxError("Wallet address not found.");
            return;
        }
        if (betAmount < 5) {
            setBetAmountError("Min bet should be $5");
            setTxError("Bet amount must be at least $5.");
            return;
        }
        if (isSportsSelected) {
            if (!challengeStatement.trim()) {
                setChallengeStatementError("Please enter a challenge statement.");
                setTxError("Please enter a challenge statement.");
                return;
            }
            if (!validation.selectedSuggestion) {
                setTxError("Please validate and select one suggested statement before creating the challenge.");
                return;
            }
            setChallengeStatementError(null);
            if (!sportsResolutionConsent) {
                setSportsResolutionConsentError("Please check this box to continue.");
                setTxError("Please check the box to confirm the sports challenge resolution terms.");
                return;
            }
            setSportsResolutionConsentError(null);
            if (hasBlockedContent(challengeStatement)) {
                setTxError(blockedContentError("Challenge statement"));
                return;
            }
        } else {
            if (!predictionPrice || Number(predictionPrice) <= 0) {
                setTxError("Please enter a valid prediction price.");
                return;
            }
        }
        if (duration.hours === 0 && duration.minutes === 0) {
            setTxError("Please select a challenge expiry duration.");
            return;
        }
        if (!isSportsSelected && selectedDate.getTime() <= Date.now()) {
            setTxError("Challenge end date must be in the future.");
            return;
        }
        if (!isSportsSelected) {
            const expiryTimeMs = Date.now() + (duration.hours * 60 + duration.minutes) * 60 * 1000;
            if (selectedDate.getTime() < expiryTimeMs) {
                setTxError("Challenge end date cannot be earlier than challenge expiry time.");
                return;
            }
        }

        setTxStatus("building");
        setTxError(null);
        setTxSignature(null);

        try {
            const creatorPubkey = new PublicKey(address);
            const wallet = {
                publicKey: creatorPubkey,
                signTransaction: async (tx: Transaction) => {
                    const signedTx = await (window as any).solana?.signTransaction(tx);
                    return signedTx || tx;
                },
                signAllTransactions: async (txs: Transaction[]) => {
                    return await Promise.all(txs.map(tx => (window as any).solana?.signTransaction(tx) || tx));
                }
            };
            
            const program = getRektoProgram(wallet);
            const connection = getReadonlyConnection();
            const nowSec = Math.floor(Date.now() / 1000);
            const expiresAt = nowSec + duration.hours * 3600 + duration.minutes * 60;
            const resolvesAt = isSportsSelected ? expiresAt : Math.floor(selectedDate.getTime() / 1000);
            const targetPriceUsdCents = Math.round(Number(predictionPrice) * 100);

            const tx = await buildCreateChallengeTx(program, creatorPubkey, {
                asset: marketState.selectedChild?.symbol || "",
                betAmountUsdc: betAmount,
                targetPriceUsdCents,
                directionAbove: predictionDirection === "Above",
                expiresAt,
                resolvesAt,
            });

            setTxStatus("signing");
            
            const signedTx = await wallet.signTransaction(tx);
            const signature = await connection.sendRawTransaction(signedTx.serialize());
            
            setTxSignature(signature);
            setTxStatus("confirming");

            const [counterPDA] = deriveCreatorCounter(creatorPubkey);
            let challengeId = 0;
            try {
                const counter = await (program.account as any).creatorCounter.fetch(counterPDA);
                challengeId = Number(counter.count) - 1;
            } catch {
                challengeId = 0;
            }

            const [challengePDA] = deriveChallengePDA(creatorPubkey, challengeId);

            try {
                const selectedCategory = isSportsSelected
                    ? (marketState.selectedSportsEvent?.name || marketState.selectedSportsEvent?.symbol || "")
                    : (marketState.selectedChild?.name || "");
                const selectedTicker = isSportsSelected
                    ? (marketState.selectedSportsEvent?.symbol || marketState.selectedSportsEvent?.name || "")
                    : (marketState.selectedChild?.symbol || "");
                const selectedAssetName = isSportsSelected
                    ? (marketState.selectedSportsEvent?.description || marketState.selectedSportsEvent?.name || marketState.selectedSportsEvent?.symbol || "")
                    : (marketState.selectedChild?.description || "");

                await createChallenge({
                    title: isSportsSelected ? challengeStatement : `${marketState.selectedChild?.symbol} ${predictionDirection} $${predictionPrice}`,
                    description: isSportsSelected
                        ? challengeStatement
                        : `Bet ${betAmount} USDC that ${marketState.selectedChild?.symbol} will be ${predictionDirection.toLowerCase()} $${predictionPrice} by ${selectedDate.toISOString()}`,
                    category: selectedCategory,
                    event_type: "binary",
                    ticker: selectedTicker,
                    asset_name: selectedAssetName,
                    created_by: user?.id || "",
                    mode: challengeMode,
                    initial_bet: betAmount,
                    min_accept_bet: betAmount,
                    target_price: isSportsSelected ? undefined : Number(predictionPrice),
                    bet_unit: 1,
                    resolution_source: isSportsSelected ? "manual" : "price_feed",
                    expire_time: new Date(expiresAt * 1000).toISOString(),
                    resolve_time: new Date(resolvesAt * 1000).toISOString(),
                    metadata: {
                        onchain: {
                            challenge_pda: challengePDA.toBase58(),
                            challenge_id: challengeId,
                            creator_wallet: creatorPubkey.toBase58(),
                            program_id: "4t5KYdKFmPw49yo6Bm1TV2ZDEi6k3Ns4eJLeNhgbVSzJ",
                            cluster: "devnet",
                            tx_signature: signature,
                        },
                    },
                });
            } catch (apiErr) {
                console.warn("Backend API error (non-fatal):", apiErr);
            }

            setTxStatus("success");
            onCreated();
        } catch (err: unknown) {
            console.error("Create challenge error:", err);
            const errorMessage = err instanceof Error ? err.message : "";
            const msg = errorMessage.includes("User rejected") ? "Transaction cancelled by user." : errorMessage || "Transaction failed. Please try again.";
            setTxError(msg);
            setTxStatus("error");
        }
    };

    const isLoading = txStatus === "building" || txStatus === "signing" || txStatus === "confirming";
    const hasChallengeStatement = challengeStatement.trim().length > 0;
    const isSportsSelectionComplete = Boolean(validation.selectedSuggestion);
    const stepOrder: CreateChallengeStep[] = ["mode", "category", "details"];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const isModeStep = currentStep === "mode";
    const isCategoryStep = currentStep === "category";
    const isDetailsStep = currentStep === "details";
    const stepTitle = isModeStep ? "Choose challenge mode" : isCategoryStep ? "Pick a category" : "Set the terms";
    const stepSubtitle = isModeStep
        ? "Start with how players can join your challenge."
        : isCategoryStep
            ? "Choose the market and asset or event."
            : "Add the bet, prediction, timing, and review the payout.";

    const goToNextStep = () => {
        const nextStep = stepOrder[Math.min(currentStepIndex + 1, stepOrder.length - 1)];
        setCurrentStep(nextStep);
        closeAllDropdowns();
    };

    const goToPreviousStep = () => {
        const previousStep = stepOrder[Math.max(currentStepIndex - 1, 0)];
        setCurrentStep(previousStep);
        closeAllDropdowns();
    };

    const getButtonLabel = () => {
        if (!isConnected) return "Connect Wallet to Create";
        switch (txStatus) {
            case "building": return "Building Transaction...";
            case "signing": return "Waiting for Signature...";
            case "confirming": return "Confirming on-chain...";
            case "success": return "Challenge Created! 🎉";
            default: return "Create Challenge";
        }
    };

    const getButtonStyle = () => {
        if (!isConnected) return "rekto-button cursor-pointer w-full py-3 sm:py-4 bg-gray-900 hover:bg-gray-700 text-white font-black text-base sm:text-lg transition-colors";
        if (isLoading || (isSportsSelected && (!validation.isValid || !isSportsSelectionComplete))) return "cursor-pointer w-full py-3 sm:py-4 border-2 border-black bg-gray-400 text-white font-black text-base sm:text-lg cursor-not-allowed shadow-[3px_3px_0_#111]";
        if (txStatus === "success") return "cursor-pointer w-full py-3 sm:py-4 border-2 border-black bg-green-500 text-white font-black text-base sm:text-lg cursor-not-allowed shadow-[1px_1px_0_#111]";
        if (txStatus === "error") return "cursor-pointer w-full py-3 sm:py-4 border-2 border-black bg-red-500 hover:bg-red-600 text-white font-black text-base sm:text-lg transition-colors shadow-[1px_1px_0_#111]";
        return "rekto-button cursor-pointer w-full py-3 sm:py-4 bg-gray-900 hover:bg-gray-700 text-white font-black text-base sm:text-lg transition-colors";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleModalClose} />
            <div className="rekto-modal-panel relative w-full max-w-md md:max-w-2xl max-h-[94vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-[#f3e1d7] px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b-2 border-black">
                    <div className="flex items-center justify-between">
                        <div className="w-8" />
                        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 text-center drop-shadow-[2px_2px_0_#f5d547]">Create Challenge</h2>
                        <button onClick={handleModalClose} className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0_#111] hover:bg-[#f5d54 la7] transition-colors">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-gray-600 text-xs sm:text-sm mt-2">Create a challenge in a few quick choices.</p>
                </div>

                <div className="px-4 sm:px-6 py-3 sm:py-4 space-y-4 overflow-y-auto">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            {stepOrder.map((step, index) => (
                                <button
                                    key={step}
                                    type="button"
                                    onClick={() => setCurrentStep(step)}
                                    className={`h-2 flex-1 rounded-full transition-colors ${index <= currentStepIndex ? "bg-gray-900" : "bg-[#e8d5c8]"}`}
                                    aria-label={`Go to step ${index + 1}`}
                                />
                            ))}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Step {currentStepIndex + 1} of {stepOrder.length}</p>
                            <h3 className="text-xl font-black text-gray-900">{stepTitle}</h3>
                            <p className="text-sm text-gray-600">{stepSubtitle}</p>
                        </div>
                    </div>

                    {isCategoryStep && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Challenge Market</label>
                        <div className="flex items-center gap-2 p-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl">
                            {marketState.markets.length === 0 ? (
                                <div className="flex-1 py-2 px-4 text-sm text-gray-500 text-center">Loading markets...</div>
                            ) : (
                                marketState.markets.map((m: Market) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMarketState(prev => ({ ...prev, selected: m }))}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${marketState.selected?.id === m.id
                                            ? "bg-gray-900 text-white"
                                            : "bg-transparent text-gray-600 hover:bg-[#f3e1d7]"
                                            }`}
                                    >
                                        {m.symbol || m.name}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                    )}

                    {isModeStep && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Challenge Mode</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => setChallengeMode("pvp")}
                                className={`min-h-28 rounded-xl border px-4 py-4 text-left transition-colors ${challengeMode === "pvp"
                                    ? "border-gray-900 bg-gray-900 text-white shadow-[3px_3px_0_#f5d547]"
                                    : "border-[#e8d5c8] bg-[#faf0eb] text-gray-700 hover:border-[#d4b8a8]"
                                    }`}
                            >
                                <span className="block text-base font-black">PVP</span>
                                <span className={`mt-1 block text-sm ${challengeMode === "pvp" ? "text-white/80" : "text-gray-500"}`}>One opponent accepts your exact bet.</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setChallengeMode("multi")}
                                className={`min-h-28 rounded-xl border px-4 py-4 text-left transition-colors ${challengeMode === "multi"
                                    ? "border-gray-900 bg-gray-900 text-white shadow-[3px_3px_0_#f5d547]"
                                    : "border-[#e8d5c8] bg-[#faf0eb] text-gray-700 hover:border-[#d4b8a8]"
                                    }`}
                            >
                                <span className="block text-base font-black">Multi</span>
                                <span className={`mt-1 block text-sm ${challengeMode === "multi" ? "text-white/80" : "text-gray-500"}`}>Multiple players can join the same challenge.</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">You can change this before moving forward.</p>
                    </div>
                    )}

                    {isCategoryStep && (
                    <div className="space-y-2">
                        {isSportsSelected ? (
                            <label className="text-sm font-medium text-gray-700">Select Sport Event</label>
                        ) : <label className="text-sm font-medium text-gray-700">Select Token</label>}
                        <div className="relative" ref={dropdownRefs.coin}>
                            <button 
                                onClick={() => setOpenDropdown(prev => prev === 'coin' ? null : 'coin')} 
                                className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                        {marketState.selectedChild?.image ? (
                                            <Image src={marketState.selectedChild.image} alt={marketState.selectedChild.symbol || marketState.selectedChild.name} width={24} height={24} className="w-6 h-6 object-contain" />
                                        ) : (
                                            <span className="text-xs font-bold text-white">
                                                {marketState.selectedChild?.symbol?.slice(0, 2) || "?"}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-semibold text-gray-900">{marketState.selectedChild?.symbol || "Select Token"}</span>
                                </div>
                                <svg className={`w-5 h-5 text-gray-500 transition-transform ${openDropdown === 'coin' ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openDropdown === 'coin' && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden">
                                    {marketState.childMarkets.length === 0 ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">Loading tokens...</div>
                                    ) : (
                                        marketState.childMarkets.map((childMarket: Market) => (
                                            <button 
                                                key={childMarket.id} 
                                                onClick={() => { 
                                                    setMarketState(prev => ({ ...prev, selectedChild: childMarket })); 
                                                    setOpenDropdown(null); 
                                                }} 
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f3e1d7] transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                                    {childMarket.image ? (
                                                        <Image src={childMarket.image} alt={childMarket.symbol || childMarket.name} width={24} height={24} className="w-6 h-6 object-contain" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-white">
                                                            {childMarket.symbol?.slice(0, 2) || "?"}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-medium text-gray-900">{childMarket.symbol}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {isSportsSelected && (
                            <div className="space-y-2 pt-2">
                                <label className="text-sm font-medium text-gray-700">Select Market</label>
                                <div className="relative" ref={dropdownRefs.sportsEvent}>
                                    <button 
                                        onClick={() => setOpenDropdown(prev => prev === 'sportsEvent' ? null : 'sportsEvent')} 
                                        className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                                {marketState.selectedSportsEvent?.image ? (
                                                    <Image src={marketState.selectedSportsEvent.image} alt={marketState.selectedSportsEvent.symbol || marketState.selectedSportsEvent.name} width={24} height={24} className="w-6 h-6 object-contain" />
                                                ) : (
                                                    <span className="text-xs font-bold text-white">
                                                        {marketState.selectedSportsEvent?.symbol?.slice(0, 2) || "?"}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-semibold text-gray-900">{marketState.selectedSportsEvent?.symbol || marketState.selectedSportsEvent?.name || "Select Market"}</span>
                                        </div>
                                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${openDropdown === 'sportsEvent' ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {openDropdown === 'sportsEvent' && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden">
                                            {marketState.sportsEventMarkets.length === 0 ? (
                                                <div className="px-4 py-3 text-sm text-gray-500">Loading markets...</div>
                                            ) : (
                                                marketState.sportsEventMarkets.map((market: Market) => (
                                                    <button 
                                                        key={market.id} 
                                                        onClick={() => { 
                                                            setMarketState(prev => ({ ...prev, selectedSportsEvent: market })); 
                                                            setOpenDropdown(null); 
                                                        }} 
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f3e1d7] transition-colors"
                                                    >
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                                            {market.image ? (
                                                                <Image src={market.image} alt={market.symbol || market.name} width={24} height={24} className="w-6 h-6 object-contain" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-white">
                                                                    {market.symbol?.slice(0, 2) || "?"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="font-medium text-gray-900">{market.symbol || market.name}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    )}

                    {isDetailsStep && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Bet Amount</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const newVal = Math.max(5, betAmount - 1);
                                    setBetAmount(newVal);
                                    setBetAmountError(newVal < 5 ? "Min bet should be $5" : null);
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:bg-[#f3e1d7] transition-colors text-gray-700 font-bold text-lg"
                            >
                                -
                            </button>
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">$</span>
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setBetAmount(val);
                                        setBetAmountError(val < 5 ? "Min bet should be $5" : null);
                                    }}
                                    step="1"
                                    min="5"
                                    className="w-full pl-8 pr-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:border-[#d4b8a8]"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const newVal = betAmount + 1;
                                    setBetAmount(newVal);
                                    setBetAmountError(null);
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:bg-[#f3e1d7] transition-colors text-gray-700 font-bold text-lg"
                            >
                                +
                            </button>
                        </div>
                        {betAmountError && <p className="text-red-500 text-sm mt-1">{betAmountError}</p>}
                    </div>
                    )}

                    {isDetailsStep && isSportsSelected && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Challenge Statement</label>
                                <span className="relative group/info">
                                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="absolute left-0 bottom-full mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-20 w-max max-w-[260px]">
                                        This is the statement on which you are taking a bet, it can be any prediction or outcome conviction related to the selected sport.
                                    </span>
                                </span>
                            </div>
                            <div className="relative">
                                <input
                                    required
                                    type="text"
                                    value={challengeStatement}
                                    onChange={(e) => {
                                        setChallengeStatement(e.target.value);
                                        setValidation(prev => ({ ...prev, suggestions: [], selectedSuggestion: null, isValid: false }));
                                        if (challengeStatementError) setChallengeStatementError(null);
                                        if (txError) setTxError(null);
                                    }}
                                    placeholder={
                                        marketState.selectedChild?.symbol?.toLowerCase() === 'cricket'
                                            ? "e.g. rohit sharma will hit a six in todays MI vs RCB IPL match"
                                            : marketState.selectedChild?.symbol?.toLowerCase() === 'football'
                                                ? "e.g. real madrid will win fifa 2026"
                                                : "Enter your challenge statement..."
                                    }
                                    disabled={Boolean(validation.selectedSuggestion)}
                                    className={`w-full border border-[#e8d5c8] rounded-xl text-base sm:text-lg text-gray-900 placeholder:text-gray-400 placeholder:text-xs sm:placeholder:text-sm ${validation.selectedSuggestion ? "bg-gray-100 cursor-not-allowed px-3 sm:px-4 py-3 pr-16 sm:pr-20" : "bg-[#faf0eb] focus:outline-none focus:border-[#d4b8a8] px-3 sm:px-4 py-3"}`}
                                />
                                {validation.selectedSuggestion && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setChallengeStatement("");
                                            setValidation(prev => ({ ...prev, selectedSuggestion: null, suggestions: [], isValid: false, error: null }));
                                            setChallengeStatementError(null);
                                            if (txError) setTxError(null);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-700 hover:text-blue-800 underline"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                            {hasChallengeStatement && !validation.selectedSuggestion && (
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        onClick={handleValidateChallengeStatement}
                                        disabled={validation.isLoading}
                                    >
                                        {validation.isLoading && (
                                            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                        )}
                                        <span>{validation.isLoading ? "Validating statement..." : "Validate Statement"}</span>
                                    </button>

                                    {validation.suggestions.length > 0 && (
                                        <div className="rounded-2xl border border-[#e8d5c8] bg-white p-4 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-800">Suggested Valid Statements</span>
                                                <span className="text-xs text-gray-500">Pick one to use</span>
                                            </div>
                                            <div className="space-y-2">
                                                {validation.suggestions.map((suggestion: string, index: number) => (
                                                    <button
                                                        key={`${suggestion}-${index}`}
                                                        type="button"
                                                        className="cursor-pointer w-full text-left px-4 py-3 bg-[#fff9f5] border border-[#ead8cc] rounded-xl hover:bg-[#f7e8de] transition-colors text-sm text-gray-900"
                                                        onClick={() => {
                                                            setChallengeStatement(suggestion);
                                                            setValidation(prev => ({ ...prev, selectedSuggestion: suggestion, isValid: true, error: null }));
                                                        }}
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {validation.isValid && isSportsSelectionComplete && !validation.isLoading && (
                                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                                    Your statement has been validated. Use Reset to edit again or proceed to create the challenge.
                                </div>
                            )}
                            {validation.error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                                    {validation.error}
                                </div>
                            )}
                            {challengeStatementError && <p className="text-red-500 text-sm mt-1">{challengeStatementError}</p>}
                        </div>
                    )}

                    {isDetailsStep && !isSportsSelected && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Predict Price Movement</label>
                            <div className="flex flex-col min-[380px]:flex-row gap-2">
                                <div className="relative flex-1" ref={dropdownRefs.direction}>
                                    <button 
                                        onClick={() => setOpenDropdown(prev => prev === 'direction' ? null : 'direction')} 
                                        className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors"
                                    >
                                        <span className="font-semibold text-sm sm:text-base text-gray-900 truncate pr-2">{marketState.selectedChild?.name} {predictionDirection}</span>
                                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${openDropdown === 'direction' ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {openDropdown === 'direction' && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden">
                                            {["Above", "Below"].map((dir) => (
                                                <button 
                                                    key={dir} 
                                                    onClick={() => { 
                                                        setPredictionDirection(dir); 
                                                        setOpenDropdown(null); 
                                                    }} 
                                                    className="w-full px-4 py-3 text-left hover:bg-[#f3e1d7] transition-colors font-medium text-gray-900"
                                                >
                                                    {marketState.selectedChild?.name} {dir}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative w-full min-[380px]:w-32">
                                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base sm:text-lg">$</span>
                                    <input 
                                        type="number" 
                                        value={predictionPrice} 
                                        onChange={(e) => setPredictionPrice(e.target.value)} 
                                        className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-base sm:text-lg font-semibold text-gray-900 focus:outline-none focus:border-[#d4b8a8]" 
                                        placeholder="66500" 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {isDetailsStep && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Challenge Expires In</label>
                            <span className="relative group/info">
                                <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="absolute left-0 bottom-full mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-20 w-max max-w-[200px]">
                                    Your challenge will expire in the selected time. If not accepted, your bet amount will be refunded.
                                </span>
                            </span>
                        </div>
                        <button onClick={() => setIsDurationPickerOpen(true)} className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors">
                            <span className="font-medium text-sm sm:text-base text-gray-900 pr-2 break-words">{formatDuration(duration)}</span>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    )}

                    {isDetailsStep && (!isSportsSelected ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Challenge End Date</label>
                                <span className="relative group/info">
                                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="absolute left-0 bottom-full mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-20 w-max max-w-[200px]">
                                        The challenges will get resolved on this exact selected date and time OR when the price event is triggered whichever comes first.
                                    </span>
                                </span>
                            </div>
                            <button onClick={() => setIsDatePickerOpen(true)} className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors gap-2">
                                <span className="font-medium text-sm sm:text-base text-gray-900 break-words text-left">{formatDate(selectedDate)}</span>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <label className="flex items-start gap-2 p-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sportsResolutionConsent}
                                    onChange={(e) => {
                                        setSportsResolutionConsent(e.target.checked);
                                        if (e.target.checked) setSportsResolutionConsentError(null);
                                        if (txError) setTxError(null);
                                    }}
                                    className="mt-0.5 h-4 w-4 rounded border-[#d4b8a8] text-gray-900 focus:ring-gray-700"
                                />
                                <span className="text-xs font-medium text-gray-700">
                                    Challenge will end after the selected sport event is completed and will be resolved by the community based on the outcome of the challenge statement posted by you.
                                </span>
                            </label>
                            {sportsResolutionConsentError && <p className="text-red-500 text-sm mt-1">{sportsResolutionConsentError}</p>}
                        </div>
                    ))}

                    {isDetailsStep && (
                    <div className="text-center py-2 px-1 sm:px-2">
                        {isSportsSelected ? (
                            <p className="text-sm sm:text-base text-gray-700 break-words">
                                You win <span className="font-bold text-gray-900">${(betAmount * 2 * 0.975).toFixed(4)}</span> if your statement is correct
                            </p>
                        ) : (
                            <p className="text-sm sm:text-base text-gray-700 break-words">
                                You win <span className="font-bold text-gray-900">${(betAmount * 2 * 0.975).toFixed(4)}</span> if {marketState.selectedChild?.symbol} closes {predictionDirection.toLowerCase()} ${Number(predictionPrice).toLocaleString()} in {formatDuration(duration)}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">6% platform fee applies</p>
                    </div>
                    )}

                    {isDetailsStep && txStatus === "error" && txError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                            ⚠️ {txError}
                        </div>
                    )}

                    {isDetailsStep && txStatus === "success" && txSignature && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                            <p className="font-semibold">✅ Challenge created on-chain!</p>
                            <a
                                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 underline break-all text-xs mt-1 block"
                            >
                                View on Solana Explorer ↗
                            </a>
                        </div>
                    )}

                    {isDetailsStep && isLoading && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>
                                {txStatus === "building" && "Building transaction..."}
                                {txStatus === "signing" && "Please approve in your wallet..."}
                                {txStatus === "confirming" && "Confirming on Solana devnet..."}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        {!isModeStep && (
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                disabled={isLoading}
                                className="w-full sm:w-32 py-3 border-2 border-black bg-white text-gray-900 font-black text-base shadow-[2px_2px_0_#111] hover:bg-[#f3e1d7] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Back
                            </button>
                        )}
                        {!isDetailsStep ? (
                            <button
                                type="button"
                                onClick={goToNextStep}
                                disabled={!marketState.selected && isCategoryStep}
                                className="rekto-button cursor-pointer w-full py-3 sm:py-4 bg-gray-900 hover:bg-gray-700 text-white font-black text-base sm:text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateChallenge}
                                disabled={isLoading || txStatus === "success" || (isSportsSelected && (!validation.isValid || !isSportsSelectionComplete))}
                                className={getButtonStyle()}
                            >
                                {getButtonLabel()}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <DatePickerModal isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <DurationPickerModal isOpen={isDurationPickerOpen} onClose={() => setIsDurationPickerOpen(false)} selectedDuration={duration} onSelectDuration={setDuration} />
        </div>
    );
}
