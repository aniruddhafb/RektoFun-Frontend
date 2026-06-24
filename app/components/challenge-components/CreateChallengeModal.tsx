"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DatePickerModal } from "./DatePickerModal";
import { DurationPickerModal } from "./DurationPickerModal";
import { useUserStore } from "@/app/store/useUserStore";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { getParentCategories, getCategoriesByParent, Category } from "@/app/lib/category-service/category";
import { createChallenge } from "@/app/lib/challenges-service/challenges";
import { Transaction } from "@solana/web3.js";
import { getReadonlyConnection } from "@/app/lib/rektofun-program";

interface CreateChallengeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

type TxStatus = "idle" | "building" | "signing" | "confirming" | "success" | "error";
type CreateChallengeStep = "mode" | "category" | "details";


export function CreateChallengeModal({
    isOpen,
    onClose,
    onCreated,
}: CreateChallengeModalProps) {
    // Step and mode
    const [currentStep, setCurrentStep] = useState<CreateChallengeStep>("mode");
    const [challengeMode, setChallengeMode] = useState<"pvp" | "multi">("pvp");

    // Challenge details
    const [betAmount, setBetAmount] = useState(5);
    const [betAmountError, setBetAmountError] = useState<string | null>(null);
    const [predictionDirection, setPredictionDirection] = useState("Above");
    const [predictionPrice, setPredictionPrice] = useState("66500");
    const [selectedDate, setSelectedDate] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [duration, setDuration] = useState({ hours: 4, minutes: 0 });
    const [sportsResolutionConsent, setSportsResolutionConsent] = useState(false);
    const [sportsResolutionConsentError, setSportsResolutionConsentError] = useState<string | null>(null);

    // UI state
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);

    // Transaction state
    const [txStatus, setTxStatus] = useState<TxStatus>("idle");
    const [txSignature, setTxSignature] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Category state
    const [parentCategories, setParentCategories] = useState<Category[]>([]);
    const [childCategories, setChildCategories] = useState<Category[]>([]);
    const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
    const [selectedChildCategory, setSelectedChildCategory] = useState<Category | null>(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);

    const { user } = useUserStore();
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("solana");

    const dropdownRefs = {
        direction: useRef<HTMLDivElement>(null),
        parentCategory: useRef<HTMLDivElement>(null),
        childCategory: useRef<HTMLDivElement>(null),
    };

    useBodyScrollLock(isOpen);



    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (dropdownRefs.direction.current && !dropdownRefs.direction.current.contains(target)) {
                setOpenDropdown(prev => prev === 'direction' ? null : prev);
            }
            if (dropdownRefs.parentCategory.current && !dropdownRefs.parentCategory.current.contains(target)) {
                setOpenDropdown(prev => prev === 'parentCategory' ? null : prev);
            }
            if (dropdownRefs.childCategory.current && !dropdownRefs.childCategory.current.contains(target)) {
                setOpenDropdown(prev => prev === 'childCategory' ? null : prev);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const closeAllDropdowns = useCallback(() => setOpenDropdown(null), []);

    // Fetch parent categories when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchParentCategories();
        }
    }, [isOpen]);

    // Fetch child categories when parent category is selected
    useEffect(() => {
        if (selectedParentCategory) {
            fetchChildCategories(selectedParentCategory.category);
        } else {
            setChildCategories([]);
            setSelectedChildCategory(null);
        }
    }, [selectedParentCategory]);

    const fetchParentCategories = async () => {
        setIsLoadingCategories(true);
        setCategoryError(null);
        try {
            const categories = await getParentCategories();
            setParentCategories(categories);
        } catch (error) {
            setCategoryError("Failed to load categories. Please try again.");
            console.error("Error fetching parent categories:", error);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const fetchChildCategories = async (parentCategory: string) => {
        setIsLoadingCategories(true);
        setCategoryError(null);
        try {
            const categories = await getCategoriesByParent(parentCategory);
            setChildCategories(categories);
        } catch (error) {
            setCategoryError("Failed to load subcategories. Please try again.");
            console.error("Error fetching child categories:", error);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const handleParentCategorySelect = (category: Category) => {
        setSelectedParentCategory(category);
        setSelectedChildCategory(null);
        setOpenDropdown(null);
    };

    const handleChildCategorySelect = (category: Category) => {
        setSelectedChildCategory(category);
        setOpenDropdown(null);
    };

    const handleModalClose = () => {
        onClose();
    };

    const getButtonLabel = () => {
        if (txStatus === "success") return "Created!";
        if (isSubmitting) return "Creating...";
        return "Create Challenge";
    };

    const getButtonStyle = () => {
        const base =
            "rekto-button cursor-pointer w-full py-3 sm:py-4 font-black text-base sm:text-lg transition-colors shadow-[2px_2px_0_#111] ";
        if (txStatus === "success") {
            return base + "bg-green-600 hover:bg-green-700 text-white";
        }
        if (isSubmitting) {
            return base + "bg-gray-500 text-white cursor-not-allowed";
        }
        return base + "bg-gray-900 hover:bg-gray-700 text-white";
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

    const validateDetails = () => {
        let isValid = true;
        if (betAmount < 5) {
            setBetAmountError("Min bet should be $5");
            isValid = false;
        }
        if (!selectedParentCategory || !selectedChildCategory) {
            setCategoryError("Please select a category and subcategory.");
            isValid = false;
        }
        if (!sportsResolutionConsent) {
            setSportsResolutionConsentError("You must agree to the resolution terms.");
            isValid = false;
        }
        return isValid;
    };

    const handleCreateChallenge = async () => {
        if (!validateDetails()) return;
        if (!address || !isConnected) { open(); return; }
        if (!walletProvider) { setTxStatus("error"); return; }

        setIsSubmitting(true);
        setTxStatus("building");
        setTxSignature(null);

        try {
            const nowSec = Math.floor(Date.now() / 1000);
            const expiresAt = nowSec + duration.hours * 3600 + duration.minutes * 60;
            const resolvesAt = Math.max(Math.floor(selectedDate.getTime() / 1000), expiresAt);
            const targetPriceUsdCents = Math.floor(Number(predictionPrice) * 100);
            const asset = (selectedChildCategory?.category ?? "").trim().slice(0, 10);

            // Build the transaction server-side (admin signs as fee payer) and get it back partially signed
            const response = await fetch("/api/challenges/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userWallet: address,
                    asset,
                    betAmountUsdc: betAmount,
                    targetPriceUsdCents,
                    directionAbove: predictionDirection === "Above",
                    expiresAt,
                    resolvesAt,
                    challengeType: challengeMode === "pvp" ? "pvp" : "team",
                    // For TEAM: 0 means no limit (capped at 50 on-chain). PVP ignores this.
                    maxTeamSize: 0,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to create challenge");

            // User signs the partially-signed transaction (authorises USDC transfer from their ATA)
            setTxStatus("signing");
            const tx = Transaction.from(Buffer.from(data.serializedTx, "base64"));
            const signedTx = await (walletProvider as any).signTransaction(tx);

            // Broadcast and confirm
            setTxStatus("confirming");
            const connection = getReadonlyConnection();
            const signature = await connection.sendRawTransaction(signedTx.serialize(), {
                skipPreflight: false,
                preflightCommitment: "confirmed",
            });
            await connection.confirmTransaction(
                { signature, blockhash: data.blockhash, lastValidBlockHeight: data.lastValidBlockHeight },
                "confirmed"
            );

            // Persist the challenge to the backend database
            await createChallenge({
                statement: `${selectedChildCategory?.category ?? asset} will be ${predictionDirection} $${predictionPrice}`,
                ticker: asset,
                trading_pair: `${asset}`,
                target: Number(predictionPrice),
                initial_bet: betAmount,
                pool_size: betAmount,
                resolution_source: "PRICE_FEED",
                metadata: {},
                creator: user?.id ?? 0,
                resolution_method: "PRICE_FEED",
                participants: 1,
                status: "OPEN",
                mode: challengeMode === "pvp" ? "PVP" : "MULTI",
                result: "TEAM_A",
                direction: predictionDirection === "Above" ? "UP" : "DOWN",
                expiry: new Date(expiresAt * 1000).toISOString().split("T")[0],
                resolution_date: new Date(resolvesAt * 1000).toISOString().split("T")[0],
                final_price: 0,
            });

            setTxStatus("success");
            setTxSignature(signature);
            onCreated();
        } catch (error: any) {
            console.error("Error creating challenge:", error);
            setTxStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const stepOrder: CreateChallengeStep[] = ["mode", "category", "details"];
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const isModeStep = currentStep === "mode";
    const isCategoryStep = currentStep === "category";
    const isDetailsStep = currentStep === "details";
    const stepTitle = isModeStep ? "Choose challenge mode" : isCategoryStep ? "Pick a category" : "Set the terms";
    const stepSubtitle = isModeStep
        ? "Start with how players can join your challenge."
        : isCategoryStep
            ? "Choose the asset or event."
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
                        <div className="space-y-4">
                            {/* Parent Category Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Category</label>
                                <div className="relative" ref={dropdownRefs.parentCategory}>
                                    <button
                                        onClick={() => setOpenDropdown(prev => prev === 'parentCategory' ? null : 'parentCategory')}
                                        disabled={isLoadingCategories}
                                        className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <span className={`font-medium text-sm sm:text-base truncate pr-2 ${selectedParentCategory ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {selectedParentCategory ? selectedParentCategory.category : "Select a category"}
                                        </span>
                                        {isLoadingCategories ? (
                                            <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                        ) : (
                                            <svg className={`w-5 h-5 text-gray-500 transition-transform ${openDropdown === 'parentCategory' ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </button>
                                    {openDropdown === 'parentCategory' && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden max-h-60 overflow-y-auto">
                                            {parentCategories.length === 0 ? (
                                                <div className="px-4 py-3 text-gray-500 text-sm">No categories available</div>
                                            ) : (
                                                parentCategories.map((category) => (
                                                    <button
                                                        key={category.id}
                                                        onClick={() => handleParentCategorySelect(category)}
                                                        className="w-full px-4 py-3 text-left hover:bg-[#f3e1d7] transition-colors font-medium text-gray-900 flex items-center gap-2"
                                                    >
                                                        {category.image_url && (
                                                            <img src={category.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                        )}
                                                        <span>{category.category}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                {categoryError && <p className="text-red-500 text-sm mt-1">{categoryError}</p>}
                            </div>

                            {/* Child Category Selection */}
                            {selectedParentCategory && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Subcategory</label>
                                    <div className="relative" ref={dropdownRefs.childCategory}>
                                        <button
                                            onClick={() => setOpenDropdown(prev => prev === 'childCategory' ? null : 'childCategory')}
                                            disabled={isLoadingCategories || childCategories.length === 0}
                                            className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            <span className={`font-medium text-sm sm:text-base truncate pr-2 ${selectedChildCategory ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {selectedChildCategory ? selectedChildCategory.category : childCategories.length === 0 ? "Loading subcategories..." : "Select a subcategory"}
                                            </span>
                                            {isLoadingCategories ? (
                                                <svg className="animate-spin w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                            ) : (
                                                <svg className={`w-5 h-5 text-gray-500 transition-transform ${openDropdown === 'childCategory' ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </button>
                                        {openDropdown === 'childCategory' && (
                                            <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden max-h-60 overflow-y-auto">
                                                {childCategories.length === 0 ? (
                                                    <div className="px-4 py-3 text-gray-500 text-sm">No subcategories available</div>
                                                ) : (
                                                    childCategories.map((category) => (
                                                        <button
                                                            key={category.id}
                                                            onClick={() => handleChildCategorySelect(category)}
                                                            className="w-full px-4 py-3 text-left hover:bg-[#f3e1d7] transition-colors font-medium text-gray-900 flex items-center gap-2"
                                                        >
                                                            {category.image_url && (
                                                                <img src={category.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                            )}
                                                            <span>{category.category}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Selected Category Summary */}
                            {selectedParentCategory && selectedChildCategory && (
                                <div className="bg-[#faf0eb] border border-[#e8d5c8] rounded-xl p-3 sm:p-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Selected</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-gray-900">{selectedParentCategory.category}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-semibold text-gray-900">{selectedChildCategory.category}</span>
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

                    {isDetailsStep && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Predict Price Movement</label>
                            <div className="flex flex-col min-[380px]:flex-row gap-2">
                                <div className="relative flex-1" ref={dropdownRefs.direction}>
                                    <button 
                                        onClick={() => setOpenDropdown(prev => prev === 'direction' ? null : 'direction')} 
                                        className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors"
                                    >
                                        <span className="font-semibold text-sm sm:text-base text-gray-900 truncate pr-2">Token {predictionDirection}</span>
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
                                                    Token {dir}
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

                    {isDetailsStep && (
                        <>
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
                        <div className="space-y-1">
                            <label className="flex items-start gap-2 p-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={sportsResolutionConsent}
                                    onChange={(e) => {
                                        setSportsResolutionConsent(e.target.checked);
                                        if (e.target.checked) setSportsResolutionConsentError(null);

                                    }}
                                    className="mt-0.5 h-4 w-4 rounded border-[#d4b8a8] text-gray-900 focus:ring-gray-700"
                                />
                                <span className="text-xs font-medium text-gray-700">
                                    Challenge will end after the selected sport event is completed and will be resolved by the community based on the outcome of the challenge statement posted by you.
                                </span>
                            </label>
                            {sportsResolutionConsentError && <p className="text-red-500 text-sm mt-1">{sportsResolutionConsentError}</p>}
                        </div>
                        </>
                    )}

                    {isDetailsStep && (
                    <div className="text-center py-2 px-1 sm:px-2">
                        <p className="text-sm sm:text-base text-gray-700 break-words">
                            You win <span className="font-bold text-gray-900">${(betAmount * 2 * 0.975).toFixed(4)}</span> if your statement is correct
                        </p>
                        <p className="text-xs text-gray-500 mt-1">6% platform fee applies</p>
                    </div>
                    )}


                    {/* {isDetailsStep && txStatus === "success" && txSignature && (
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
                    )} */}

                    {isDetailsStep && txStatus !== "idle" && txStatus !== "success" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                            {isSubmitting && (
                                <svg className="animate-spin w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                            )}
                            <span>
                                {txStatus === "building" && "Preparing challenge transaction..."}
                                {txStatus === "signing" && "Waiting for wallet signature..."}
                                {txStatus === "confirming" && "Confirming on-chain..."}
                                {txStatus === "error" && "Something went wrong. Please try again."}
                            </span>
                        </div>
                    )}

                    {isDetailsStep && txStatus === "success" && txSignature && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                            <p className="font-semibold">Challenge created on-chain!</p>
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

                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        {!isModeStep && (
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                // disabled={}
                                className="w-full sm:w-32 py-3 border-2 border-black bg-white text-gray-900 font-black text-base shadow-[2px_2px_0_#111] hover:bg-[#f3e1d7] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Back
                            </button>
                        )}
                        {!isDetailsStep ? (
                            <button
                                type="button"
                                onClick={goToNextStep}
                                className="rekto-button cursor-pointer w-full py-3 sm:py-4 bg-gray-900 hover:bg-gray-700 text-white font-black text-base sm:text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleCreateChallenge}
                                disabled={isSubmitting || txStatus === "success" || !selectedParentCategory || !selectedChildCategory}
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
