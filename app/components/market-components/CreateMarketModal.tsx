"use client";

import { useState, useRef, useEffect } from "react";
import { createMarket, getMarkets, type Market } from "@/app/lib/markets-service/market";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

interface CreateMarketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

type TxStatus = "idle" | "creating" | "success" | "error";

export function CreateMarketModal({ isOpen, onClose, onCreated }: CreateMarketModalProps) {
    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [description, setDescription] = useState("");
    const [icon, setIcon] = useState("");
    const [parentMarkets, setParentMarkets] = useState<Market[]>([]);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
    const [marketsLoading, setMarketsLoading] = useState(true);
    const [txStatus, setTxStatus] = useState<TxStatus>("idle");
    const [txError, setTxError] = useState<string | null>(null);
    const [marketType, setMarketType] = useState("crypto");

    const parentDropdownRef = useRef<HTMLDivElement>(null);

    useBodyScrollLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setTxStatus("idle");
            setTxError(null);
            setName("");
            setSymbol("");
            setDescription("");
            setIcon("");
            setSelectedParentId(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchParentMarkets = async () => {
            try {
                setMarketsLoading(true);
                const response = await getMarkets({ parent_id: null });
                setParentMarkets(response.markets);
            } catch (error) {
                console.error("Error fetching parent markets:", error);
            } finally {
                setMarketsLoading(false);
            }
        };

        if (isOpen) {
            fetchParentMarkets();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (parentDropdownRef.current && !parentDropdownRef.current.contains(event.target as Node)) {
                setIsParentDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isOpen) return null;

    const handleCreateMarket = async () => {
        if (!name.trim()) {
            setTxError("Market name is required.");
            return;
        }
        if (!symbol.trim()) {
            setTxError("Market symbol is required.");
            return;
        }

        setTxStatus("creating");
        setTxError(null);

        try {
            await createMarket({
                name: name.trim(),
                symbol: symbol.trim().toUpperCase(),
                description: description.trim() || undefined,
                icon: icon.trim() || undefined,
                parent_id: selectedParentId,
                market_type: marketType,
            });

            setTxStatus("success");
            onCreated();
        } catch (err: any) {
            console.error("Create market error:", err);
            const msg = err?.message || "Failed to create market. Please try again.";
            setTxError(msg);
            setTxStatus("error");
        }
    };

    const getButtonLabel = () => {
        switch (txStatus) {
            case "creating": return "Creating...";
            case "success": return "Market Created! 🎉";
            default: return "Create Market";
        }
    };

    const getButtonStyle = () => {
        if (txStatus === "creating") return "rekto-button w-full py-4 bg-gray-400 text-white rounded-full font-bold text-lg cursor-not-allowed";
        if (txStatus === "success") return "rekto-button w-full py-4 bg-green-500 text-white rounded-full font-bold text-lg cursor-not-allowed";
        if (txStatus === "error") return "rekto-button w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-lg transition-colors";
        return "rekto-button w-full py-4 bg-gray-900 hover:bg-gray-700 text-white rounded-full font-bold text-lg transition-colors";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="rekto-modal-panel relative rounded-3xl w-full max-w-md md:max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-[#f3e1d7] rounded-t-3xl px-6 pt-6 pb-4 border-b-2 border-black">
                    <div className="flex items-center justify-between">
                        <div className="w-8" />
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 text-center drop-shadow-[2px_2px_0_rgba(232,90,45,0.22)]">Create Market</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-black bg-white shadow-[2px_2px_0_#111] hover:bg-[#dcc9bc] transition-colors"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-center text-gray-600 text-sm mt-2">
                        Add a new market for traders to compete in.
                    </p>
                </div>

                <div className="px-6 py-4 space-y-4 overflow-y-auto">
                    {/* Market Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Market Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Crypto, Sports, Stocks"
                            className="w-full px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-base text-gray-900 focus:outline-none focus:border-[#d4b8a8] placeholder:text-gray-400"
                        />
                    </div>

                    {/* Market Symbol */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Market Symbol *</label>
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            placeholder="e.g. BTC, SPORTS, STOCKS"
                            className="w-full px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-base text-gray-900 focus:outline-none focus:border-[#d4b8a8] placeholder:text-gray-400"
                        />
                    </div>

                    {/* Market Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Market Type</label>
                        <div className="flex items-center gap-2 p-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl">
                            {["crypto", "sports", "stocks", "other"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setMarketType(type)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors capitalize ${marketType === type
                                            ? "bg-gray-900 text-white"
                                            : "bg-transparent text-gray-600 hover:bg-[#f3e1d7]"
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Parent Market (optional) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Parent Market (optional)</label>
                        <div className="relative" ref={parentDropdownRef}>
                            <button
                                onClick={() => setIsParentDropdownOpen(!isParentDropdownOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors"
                            >
                                <span className="font-medium text-gray-900">
                                    {selectedParentId
                                        ? parentMarkets.find((m) => m.id === selectedParentId)?.name || "Unknown"
                                        : "No parent (top-level market)"}
                                </span>
                                <svg
                                    className={`w-5 h-5 text-gray-500 transition-transform ${isParentDropdownOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isParentDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden max-h-48 overflow-y-auto">
                                    {marketsLoading ? (
                                        <div className="px-4 py-3 text-sm text-gray-500">Loading markets...</div>
                                    ) : parentMarkets.length > 0 ? (
                                        <>
                                            <button
                                                onClick={() => { setSelectedParentId(null); setIsParentDropdownOpen(false); }}
                                                className="w-full px-4 py-3 text-left hover:bg-[#f3e1d7] transition-colors font-medium text-gray-700 text-sm"
                                            >
                                                No parent (top-level market)
                                            </button>
                                            {parentMarkets.map((market) => (
                                                <button
                                                    key={market.id}
                                                    onClick={() => { setSelectedParentId(market.id); setIsParentDropdownOpen(false); }}
                                                    className="w-full px-4 py-3 text-left hover:bg-[#f3e1d7] transition-colors font-medium text-gray-900"
                                                >
                                                    {market.name} ({market.symbol})
                                                </button>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-gray-500">No parent markets available</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description (optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this market..."
                            rows={2}
                            className="w-full px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-base text-gray-900 focus:outline-none focus:border-[#d4b8a8] placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    {/* Icon URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Icon URL (optional)</label>
                        <input
                            type="text"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            placeholder="https://example.com/icon.png"
                            className="w-full px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-base text-gray-900 focus:outline-none focus:border-[#d4b8a8] placeholder:text-gray-400"
                        />
                    </div>

                    {/* Error message */}
                    {txStatus === "error" && txError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                            ⚠️ {txError}
                        </div>
                    )}

                    {/* Success message */}
                    {txStatus === "success" && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                            ✅ Market created successfully!
                        </div>
                    )}

                    <button
                        onClick={handleCreateMarket}
                        disabled={txStatus === "creating" || txStatus === "success"}
                        className={getButtonStyle()}
                    >
                        {getButtonLabel()}
                    </button>
                </div>
            </div>
        </div>
    );
}
