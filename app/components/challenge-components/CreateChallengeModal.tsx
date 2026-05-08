"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { DatePickerModal } from "./DatePickerModal";
import { DurationPickerModal } from "./DurationPickerModal";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import {
    buildCreateChallengeTx,
    deriveChallengePDA,
    deriveCreatorCounter,
} from "@/app/lib/rektofun-program";
import { createChallenge } from "@/app/lib/challenges-service/challenges";
import { getMarkets, Market } from "@/app/lib/markets-service/market";
import { transform } from "@/app/lib/transformation-text-ai/transform";
import { useUserStore } from "@/app/store/useUserStore";
import { blockedContentError, hasBlockedContent } from "@/app/lib/content-moderation";

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}



type TxStatus = "idle" | "building" | "signing" | "confirming" | "success" | "error";

export function CreateChallengeModal({
    isOpen,
    onClose,
    onCreated,
}: CreateChallengeModalProps) {
    const DIA_ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const [markets, setMarkets] = useState<Market[]>([]);
    const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
    const [marketsLoading, setMarketsLoading] = useState(true);
    const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);
    const [childMarkets, setChildMarkets] = useState<Market[]>([]);
    const [childMarketsLoading, setChildMarketsLoading] = useState(false);
    const [selectedChildMarket, setChildMarket] = useState<Market | null>(null);
    const [isCoinDropdownOpen, setIsCoinDropdownOpen] = useState(false);
    const [betAmount, setBetAmount] = useState(5);
    const [betAmountError, setBetAmountError] = useState<string | null>(null);
    const [predictionDirection, setPredictionDirection] = useState("Above");
    const [isDirectionDropdownOpen, setIsDirectionDropdownOpen] = useState(false);
    const [predictionPrice, setPredictionPrice] = useState("66500");
    const [basePredictionPrice, setBasePredictionPrice] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [duration, setDuration] = useState({ hours: 4, minutes: 0 });
    const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
    const [challengeMode, setChallengeMode] = useState<"pvp" | "multi">("pvp");
    const [challengeStatement, setChallengeStatement] = useState("");
    const [challengeStatementError, setChallengeStatementError] = useState<string | null>(null);
    const [validateSuggestions, setValidateSuggestions] = useState<string[]>([]);
    const [transformValid, setTransformValid] = useState(true);
    const [isValidateLoading, setIsValidateLoading] = useState(false);
    const [transformError, setTransformError] = useState<string | null>(null);
    const [selectedValidationSuggestion, setSelectedValidationSuggestion] = useState<string | null>(null);
    const [sportsResolutionConsent, setSportsResolutionConsent] = useState(false);
    const [sportsResolutionConsentError, setSportsResolutionConsentError] = useState<string | null>(null);

    const { user } = useUserStore();

    // Transaction state
    const [txStatus, setTxStatus] = useState<TxStatus>("idle");
    const [txError, setTxError] = useState<string | null>(null);
    const [txSignature, setTxSignature] = useState<string | null>(null);

    const marketDropdownRef = useRef<HTMLDivElement>(null);
    const coinDropdownRef = useRef<HTMLDivElement>(null);
    const directionDropdownRef = useRef<HTMLDivElement>(null);

    // Privy wallet hook
    const { authenticated, login, program, sendTransaction, publicKey } = useSolanaWallet();

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Reset tx state when modal opens
    useEffect(() => {
        if (isOpen) {
            setTxStatus("idle");
            setTxError(null);
            setTxSignature(null);
            setChallengeStatementError(null);
            setSportsResolutionConsentError(null);
            setSportsResolutionConsent(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchMarkets = async () => {
            try {
                setMarketsLoading(true);
                const response = await getMarkets({ parent_id: null });
                const fetchedMarkets = response.markets;

                setMarkets(fetchedMarkets);
                // Set default market to crypto if available
                const cryptoMarket = fetchedMarkets.find(m => m.symbol?.toLowerCase() === 'crypto' || m.name?.toLowerCase() === 'crypto');
                if (cryptoMarket) {
                    setSelectedMarket(cryptoMarket);
                } else if (fetchedMarkets.length > 0) {
                    setSelectedMarket(fetchedMarkets[0]);
                }

            } catch (error) {
                console.error("Error fetching markets:", error);
            } finally {
                setMarketsLoading(false);
            }
        };

        if (isOpen) {
            fetchMarkets();
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchChildMarkets = async () => {
            if (!isOpen || !selectedMarket?.id) {
                setChildMarkets([]);
                setChildMarket(null);
                return;
            }

            try {
                setChildMarketsLoading(true);
                const response = await getMarkets({ parent_id: selectedMarket.id });
                const fetchedMarkets = response.markets;

                setChildMarkets(fetchedMarkets);
                setChildMarket(fetchedMarkets[0] ?? null);
            } catch (error) {
                console.error("Error fetching child markets:", error);
                setChildMarkets([]);
                setChildMarket(null);
            } finally {
                setChildMarketsLoading(false);
            }
        };

        fetchChildMarkets();
    }, [isOpen, selectedMarket]);

    useEffect(() => {
        const resolveDiaBlockchain = (market: Market): string => {
            const symbol = (market.symbol || "").toUpperCase();
            if (symbol === "SOL") return "Solana";
            if (symbol === "ETH") return "Ethereum";
            if (symbol === "BTC") return "Bitcoin";
            return market.description || market.name || symbol;
        };

        const fetchCurrentAssetPrice = async () => {
            if (!isOpen || !selectedChildMarket) return;

            try {
                const blockchain = resolveDiaBlockchain(selectedChildMarket);
                if (!blockchain) return;

                const url = `https://api.diadata.org/v1/assetQuotation/${encodeURIComponent(blockchain)}/${DIA_ZERO_ADDRESS}`;
                const response = await fetch(url);
                if (!response.ok) return;

                const data = await response.json();
                const price = Number(data?.Price);
                if (!Number.isFinite(price) || price <= 0) return;

                setBasePredictionPrice(price);
            } catch (error) {
                console.error("Error fetching DIA asset quotation:", error);
            }
        };

        fetchCurrentAssetPrice();
    }, [isOpen, selectedChildMarket]);

    useEffect(() => {
        if (!isOpen || !basePredictionPrice || basePredictionPrice <= 0) return;

        const adjustedPrice =
            predictionDirection === "Below"
                ? basePredictionPrice * 0.9
                : basePredictionPrice * 1.1;

        setPredictionPrice(String(Math.floor(adjustedPrice)));
    }, [isOpen, basePredictionPrice, predictionDirection]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (marketDropdownRef.current && !marketDropdownRef.current.contains(event.target as Node)) {
                setIsMarketDropdownOpen(false);
            }
            if (coinDropdownRef.current && !coinDropdownRef.current.contains(event.target as Node)) {
                setIsCoinDropdownOpen(false);
            }
            if (directionDropdownRef.current && !directionDropdownRef.current.contains(event.target as Node)) {
                setIsDirectionDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isSportsSelected = selectedMarket?.symbol?.toLowerCase() === 'sports' || selectedMarket?.name?.toLowerCase() === 'sports';

    useEffect(() => {
        if (!isOpen || !selectedMarket) {
            setValidateSuggestions([]);
            setTransformValid(true);
            setIsValidateLoading(false);
            setTransformError(null);
            setSelectedValidationSuggestion(null);
            return;
        }

        if (!isSportsSelected) {
            setValidateSuggestions([]);
            setTransformValid(true);
            setTransformError(null);
            setSelectedValidationSuggestion(null);
        } else {
            // When switching to sports, disable create button until validated
            setTransformValid(false);
            setValidateSuggestions([]);
            setTransformError(null);
            setSelectedValidationSuggestion(null);
        }
    }, [isOpen, selectedMarket, selectedChildMarket, isSportsSelected]);

    const closeAllDropdowns = () => {
        setIsMarketDropdownOpen(false);
        setIsCoinDropdownOpen(false);
        setIsDirectionDropdownOpen(false);
    };

    const handleValidateChallengeStatement = async () => {
        if (!isSportsSelected) return;

        if (!challengeStatement.trim()) {
            setChallengeStatementError("Please enter a challenge statement.");
            return;
        }

        setChallengeStatementError(null);
        setTransformError(null);
        setSelectedValidationSuggestion(null);
        setTransformValid(false);
        setIsValidateLoading(true);

        try {
            const category = selectedChildMarket?.symbol || selectedChildMarket?.name || "sports";
            const response = await transform({ category, statement: challengeStatement });

            setValidateSuggestions(response.statements || []);
            setTransformValid(false);
            if (!response.valid || !response.statements?.length) {
                setTransformError("The statement could not be validated. Please rewrite the statement properly.");
            }
        } catch (error) {
            console.error("Validate transform error:", error);
            const errMessage = error instanceof Error ? error.message : "";
            setTransformError(errMessage || "Unable to validate right now. Please try again.");
            setTransformValid(false);
            setValidateSuggestions([]);
        } finally {
            setIsValidateLoading(false);
        }
    };

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
        // If wallet not connected, open login
        if (!authenticated) {
            login();
            return;
        }

        if (!program || !publicKey) {
            setTxError("Solana wallet not ready. Please wait or reconnect.");
            return;
        }

        // Validate inputs
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
            if (!selectedValidationSuggestion) {
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

        setTxStatus("building");
        setTxError(null);
        setTxSignature(null);

        try {
            const creatorPubkey = publicKey;

            // Calculate timestamps
            const nowSec = Math.floor(Date.now() / 1000);
            const expiresAt = nowSec + duration.hours * 3600 + duration.minutes * 60;
            const resolvesAt = isSportsSelected ? expiresAt : Math.floor(selectedDate.getTime() / 1000);

            // target price in USD cents (e.g. $66,500 → 6_650_000)
            const targetPriceUsdCents = Math.round(Number(predictionPrice) * 100);

            // Build the transaction
            const tx = await buildCreateChallengeTx(program, creatorPubkey, {
                asset: selectedChildMarket?.symbol || "",
                betAmountUsdc: betAmount,
                targetPriceUsdCents,
                directionAbove: predictionDirection === "Above",
                expiresAt,
                resolvesAt,
            });

            setTxStatus("signing");

            // Send transaction via Privy wallet
            const signature = await sendTransaction(tx);
            setTxSignature(signature);
            setTxStatus("confirming");

            // Derive challenge PDA to get challenge_id for backend
            const [counterPDA] = deriveCreatorCounter(creatorPubkey);
            let challengeId = 0;
            try {
                const counter = await (program.account as any).creatorCounter.fetch(counterPDA);
                // After creation, count is incremented — so current challenge_id = count - 1
                challengeId = Number(counter.count) - 1;
            } catch {
                challengeId = 0;
            }

            const [challengePDA] = deriveChallengePDA(creatorPubkey, challengeId);

            // Post to backend API — persist on-chain identifiers in metadata so
            // future joiners can look the challenge up by PDA in O(1) instead of
            // scanning every on-chain account.
            try {
                await createChallenge({
                    title: isSportsSelected ? challengeStatement : `${selectedChildMarket?.symbol} ${predictionDirection} $${predictionPrice}`,
                    description: isSportsSelected
                        ? challengeStatement
                        : `Bet ${betAmount} USDC that ${selectedChildMarket?.symbol} will be ${predictionDirection.toLowerCase()} $${predictionPrice} by ${selectedDate.toISOString()}`,
                    category: selectedChildMarket?.name || "",
                    event_type: "binary",
                    ticker: selectedChildMarket?.symbol || "",
                    asset_name: selectedChildMarket?.description || "",
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
                // Backend error is non-fatal — the on-chain tx succeeded
                console.warn("Backend API error (non-fatal):", apiErr);
            }

            setTxStatus("success");
            onCreated();
        } catch (err: any) {
            console.error("Create challenge error:", err);
            const msg =
                err?.message?.includes("User rejected")
                    ? "Transaction cancelled by user."
                    : err?.message || "Transaction failed. Please try again.";
            setTxError(msg);
            setTxStatus("error");
        }
    };

    const isLoading = txStatus === "building" || txStatus === "signing" || txStatus === "confirming";
    const hasChallengeStatement = challengeStatement.trim().length > 0;
    const hasValidationSuggestions = validateSuggestions.length > 0;
    const isSportsSelectionComplete = Boolean(selectedValidationSuggestion);

    const getButtonLabel = () => {
        if (!authenticated) return "Connect Wallet to Create";
        switch (txStatus) {
            case "building": return "Building Transaction...";
            case "signing": return "Waiting for Signature...";
            case "confirming": return "Confirming on-chain...";
            case "success": return "Challenge Created! 🎉";
            default: return "Create Challenge";
        }
    };

    const getButtonStyle = () => {
        if (!authenticated) return "cursor-pointer w-full py-4 bg-gray-900 hover:bg-gray-700 text-white rounded-full font-bold text-lg transition-colors";
        if (isLoading || (isSportsSelected && (!transformValid || !isSportsSelectionComplete))) return "cursor-pointer w-full py-4 bg-gray-400 text-white rounded-full font-bold text-lg cursor-not-allowed";
        if (txStatus === "success") return "cursor-pointer w-full py-4 bg-green-500 text-white rounded-full font-bold text-lg cursor-not-allowed";
        if (txStatus === "error") return "cursor-pointer w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-lg transition-colors";
        return "cursor-pointer w-full py-4 bg-gray-900 hover:bg-gray-700 text-white rounded-full font-bold text-lg transition-colors";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#f3e1d7] rounded-3xl w-full max-w-md md:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-[#f3e1d7] rounded-t-3xl px-6 pt-6 pb-4 border-b border-[#e8d5c8]">
                    <div className="flex items-center justify-between">
                        <div className="w-8" />
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center">Create Challenge</h2>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e8d5c8] hover:bg-[#dcc9bc] transition-colors">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-gray-600 text-sm mt-2">Set your terms and invite degenerates to challenge you.</p>
                </div>

                <div className="px-6 py-4 space-y-4 overflow-y-auto">

                    {/* challenge market  */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Challenge Market</label>
                        <div className="flex items-center gap-2 p-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl">
                            {marketsLoading ? (
                                <div className="flex-1 py-2 px-4 text-sm text-gray-500 text-center">Loading markets...</div>
                            ) : markets.length > 0 ? (
                                markets.map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMarket(m)}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${selectedMarket?.id === m.id
                                            ? "bg-gray-900 text-white"
                                            : "bg-transparent text-gray-600 hover:bg-[#f3e1d7]"
                                            }`}
                                    >
                                        {m.symbol || m.name}
                                    </button>
                                ))
                            ) : (
                                <div className="flex-1 py-2 px-4 text-sm text-gray-500 text-center">No markets available</div>
                            )}
                        </div>
                    </div>

                    {/* challenge mode selection (pvp vs multi) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Challenge Mode</label>
                        <div className="flex items-center gap-2 p-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl">
                            <button
                                onClick={() => setChallengeMode("pvp")}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${challengeMode === "pvp"
                                    ? "bg-gray-900 text-white"
                                    : "bg-transparent text-gray-600 hover:bg-[#f3e1d7]"
                                    }`}
                            >
                                PVP
                            </button>
                            <button
                                onClick={() => setChallengeMode("multi")}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${challengeMode === "multi"
                                    ? "bg-gray-900 text-white"
                                    : "bg-transparent text-gray-600 hover:bg-[#f3e1d7]"
                                    }`}
                            >
                                Multi
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            {challengeMode === "pvp"
                                ? "One opponent competes against your prediction"
                                : "Multiple opponents can compete against your prediction"}
                        </p>
                    </div>

                    {/* select token  */}
                    <div className="space-y-2">
                        {isSportsSelected ? (
                            <label className="text-sm font-medium text-gray-700">Select Sport Event</label>
                        ) : <label className="text-sm font-medium text-gray-700">Select Token</label>}
                        <div className="relative" ref={coinDropdownRef}>
                            <button onClick={() => { closeAllDropdowns(); setIsCoinDropdownOpen(!isCoinDropdownOpen); }} className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                                        {selectedChildMarket?.image ? (
                                            <Image src={selectedChildMarket.image} alt={selectedChildMarket.symbol || selectedChildMarket.name} width={24} height={24} className="w-6 h-6 object-contain" />
                                        ) : (
                                            <span className="text-xs font-bold text-white">
                                                {selectedChildMarket?.symbol?.slice(0, 2) || "?"}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-semibold text-gray-900">{selectedChildMarket?.symbol || "Select Token"}</span>
                                </div>
                                <svg className={`w-5 h-5 text-gray-500 transition-transform ${isCoinDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isCoinDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden">
                                    {childMarketsLoading ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">Loading tokens...</div>
                                    ) : childMarkets.length > 0 ? (
                                        childMarkets.map((childMarket) => (
                                            <button key={childMarket.id} onClick={() => { setChildMarket(childMarket); setIsCoinDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f3e1d7] transition-colors">
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
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-gray-500">No tokens available</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* bet amount section  */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Bet Amount</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    const newVal = Math.max(0, betAmount - 1);
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
                                    setBetAmountError(newVal < 5 ? "Min bet should be $5" : null);
                                }}
                                className="w-10 h-10 flex items-center justify-center bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:bg-[#f3e1d7] transition-colors text-gray-700 font-bold text-lg"
                            >
                                +
                            </button>
                        </div>
                        {betAmountError && (
                            <p className="text-red-500 text-sm mt-1">{betAmountError}</p>
                        )}
                    </div>

                    {/* challenge statement (for sports market) */}
                    {isSportsSelected && (
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
                                        setValidateSuggestions([]);
                                        setSelectedValidationSuggestion(null);
                                        if (challengeStatementError) setChallengeStatementError(null);
                                        if (txError) setTxError(null);
                                        // For sports, require re-validation when statement changes
                                        if (isSportsSelected) {
                                            setTransformValid(false);
                                        } else {
                                            setTransformValid(true);
                                        }
                                        if (transformError) setTransformError(null);
                                    }}
                                    placeholder={
                                        selectedChildMarket?.symbol?.toLowerCase() === 'cricket'
                                            ? "e.g. rohit sharma will hit a six in todays MI vs RCB IPL match"
                                            : selectedChildMarket?.symbol?.toLowerCase() === 'football'
                                                ? "e.g. real madrid will win fifa 2026"
                                                : "Enter your challenge statement..."
                                    }
                                    disabled={Boolean(selectedValidationSuggestion)}
                                    className={`w-full border border-[#e8d5c8] rounded-xl text-lg text-gray-900 placeholder:text-gray-400 placeholder:text-sm ${selectedValidationSuggestion ? "bg-gray-100 cursor-not-allowed px-4 py-3 pr-20" : "bg-[#faf0eb] focus:outline-none focus:border-[#d4b8a8] px-4 py-3"}`}
                                />
                                {selectedValidationSuggestion && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setChallengeStatement("");
                                            setSelectedValidationSuggestion(null);
                                            setValidateSuggestions([]);
                                            setTransformValid(false);
                                            setTransformError(null);
                                            setChallengeStatementError(null);
                                            if (txError) setTxError(null);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-700 hover:text-blue-800 underline"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                            {hasChallengeStatement && !selectedValidationSuggestion && (
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        onClick={handleValidateChallengeStatement}
                                        disabled={isValidateLoading}
                                    >
                                        {isValidateLoading && (
                                            <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                        )}
                                        <span>{isValidateLoading ? "Validating statement..." : "Validate Statement"}</span>
                                    </button>

                                    {hasValidationSuggestions && (
                                        <div className="rounded-2xl border border-[#e8d5c8] bg-white p-4 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-800">Suggested Valid Statements</span>
                                                <span className="text-xs text-gray-500">Pick one to use</span>
                                            </div>
                                            <div className="space-y-2">
                                                {validateSuggestions.map((suggestion, index) => (
                                                    <button
                                                        key={`${suggestion}-${index}`}
                                                        type="button"
                                                        className="cursor-pointer w-full text-left px-4 py-3 bg-[#fff9f5] border border-[#ead8cc] rounded-xl hover:bg-[#f7e8de] transition-colors text-sm text-gray-900"
                                                        onClick={() => {
                                                            setChallengeStatement(suggestion);
                                                            setSelectedValidationSuggestion(suggestion);
                                                            setTransformValid(true);
                                                            setTransformError(null);
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
                            {transformValid && isSportsSelectionComplete && !isValidateLoading && (
                                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                                    Your statement has been validated. Use Reset to edit again or proceed to create the challenge.
                                </div>
                            )}
                            {transformError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                                    {transformError}
                                </div>
                            )}
                            {challengeStatementError && (
                                <p className="text-red-500 text-sm mt-1">{challengeStatementError}</p>
                            )}
                        </div>
                    )}

                    {/* predict price and direction section (non-sports markets) */}
                    {!isSportsSelected && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Predict Price Movement</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1" ref={directionDropdownRef}>
                                    <button onClick={() => { closeAllDropdowns(); setIsDirectionDropdownOpen(!isDirectionDropdownOpen); }} className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors">
                                        <span className="font-semibold text-gray-900">{selectedChildMarket?.name} {predictionDirection}</span>
                                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${isDirectionDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {isDirectionDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden">
                                            {["Above", "Below"].map((dir) => (
                                                <button key={dir} onClick={() => { setPredictionDirection(dir); setIsDirectionDropdownOpen(false); }} className="w-full px-4 py-3 text-left hover:bg-[#f3e1d7] transition-colors font-medium text-gray-900">
                                                    {selectedChildMarket?.name} {dir}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative w-32">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                                    <input type="number" value={predictionPrice} onChange={(e) => setPredictionPrice(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:border-[#d4b8a8]" placeholder="66500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* challenge expires in  */}
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
                        <button onClick={() => setIsDurationPickerOpen(true)} className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors">
                            <span className="font-medium text-gray-900">{formatDuration(duration)}</span>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* challenge end date (non-sports markets) */}
                    {!isSportsSelected ? (
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
                            <button onClick={() => setIsDatePickerOpen(true)} className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors">
                                <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <p className="text-xs text-gray-500">
                                Ends in <span className="font-medium text-gray-700">{Math.floor((selectedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}</span> days <span className="font-medium text-gray-700">{Math.floor(((selectedDate.getTime() - Date.now()) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}</span> hours
                            </p>
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
                            {sportsResolutionConsentError && (
                                <p className="text-red-500 text-sm mt-1">{sportsResolutionConsentError}</p>
                            )}
                        </div>
                    )}

                    {/* summary section - adapts to sports vs non-sports */}
                    <div className="text-center py-2">
                        {isSportsSelected ? (
                            <p className="text-gray-700">
                                You win <span className="font-bold text-gray-900">${(betAmount * 2 * 0.975).toFixed(4)}</span> if your statement is correct
                            </p>
                        ) : (
                            <p className="text-gray-700">
                                You win <span className="font-bold text-gray-900">${(betAmount * 2 * 0.975).toFixed(4)}</span> if ${selectedChildMarket?.symbol} closes {predictionDirection.toLowerCase()} ${Number(predictionPrice).toLocaleString()} in {formatDuration(duration)}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">6% platform fee applies</p>
                    </div>

                    {/* Error message */}
                    {txStatus === "error" && txError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                            ⚠️ {txError}
                        </div>
                    )}

                    {/* Success message */}
                    {txStatus === "success" && txSignature && (
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

                    {/* Loading status indicator */}
                    {isLoading && (
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

                    <button
                        onClick={handleCreateChallenge}
                        disabled={isLoading || txStatus === "success" || (isSportsSelected && (!transformValid || !isSportsSelectionComplete))}
                        className={getButtonStyle()}
                    >
                        {getButtonLabel()}
                    </button>
                </div>
            </div>

            <DatePickerModal isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <DurationPickerModal isOpen={isDurationPickerOpen} onClose={() => setIsDurationPickerOpen(false)} selectedDuration={duration} onSelectDuration={setDuration} />
        </div>
    );
}

