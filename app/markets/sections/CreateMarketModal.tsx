"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSolanaWallet } from "../../lib/useSolanaWallet";

interface Coin {
    symbol: string;
    name: string;
    logo: string;
}

interface CreateMarketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const coins: Coin[] = [
    { symbol: "BTC", name: "Bitcoin", logo: "/scribbles/btc.png" },
    { symbol: "ETH", name: "Ethereum", logo: "/scribbles/coins.png" },
    { symbol: "SOL", name: "Solana", logo: "/scribbles/sol.png" },
    { symbol: "PEPE", name: "Pepe", logo: "/scribbles/pepe.png" },
    { symbol: "BONK", name: "Bonk", logo: "/scribbles/doge.png" },
];

export function CreateMarketModal({ isOpen, onClose }: CreateMarketModalProps) {
    const { authenticated, login } = useSolanaWallet();

    const [selectedCoin, setSelectedCoin] = useState<Coin>(coins[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [marketName, setMarketName] = useState("");
    const [description, setDescription] = useState("");
    const [prizePool, setPrizePool] = useState(1);
    const [duration, setDuration] = useState({ hours: 24, minutes: 0 });
    const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txError, setTxError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "unset";
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    if (!isOpen) return null;

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

    async function handleCreate() {
        if (!authenticated) { login(); return; }

        setIsSubmitting(true);
        setTxError(null);

        try {
            // Simulate market creation
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log("Market created:", {
                name: marketName,
                coin: selectedCoin.symbol,
                prizePool: prizePool,
                duration: duration,
            });
            onClose();
            setMarketName("");
            setDescription("");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setTxError(msg);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#f3e1d7] rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-[#f3e1d7] rounded-t-3xl px-6 pt-6 pb-4 border-b border-[#e8d5c8]">
                    <div className="flex items-center justify-between">
                        <div className="flex-1" />
                        <h2 className="cursor-pointer text-xl font-bold text-gray-900 flex-1 text-center whitespace-nowrap">Create Market</h2>
                        <div className="flex-1 flex justify-end">
                            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e8d5c8] hover:bg-[#dcc9bc] transition-colors">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-8 flex flex-col items-center justify-center">
                    <p className="text-center text-gray-700 text-lg font-medium">only admins can create new markets as of now, stay tuned!</p>
                </div>
            </div>
        </div>
    );
}