"use client";

import { useState } from "react";
import Image from "next/image";

interface CreateClanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateClanModal({ isOpen, onClose }: CreateClanModalProps) {
    const [clanName, setClanName] = useState("");
    const [clanDescription, setClanDescription] = useState("");
    const [maxMembers, setMaxMembers] = useState(50);
    const [isPublic, setIsPublic] = useState(true);
    const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

    const logoOptions = [
        "/scribbles/coins.png",
        "/scribbles/btc.png",
        "/scribbles/shiba.png",
        "/scribbles/doge.png",
        "/scribbles/dollars.png",
        "/scribbles/pepe.png",
        "/scribbles/sol.png",
        "/scribbles/bags.png",
        "/scribbles/stars.png",
    ];

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Creating clan:", {
            name: clanName,
            description: clanDescription,
            maxMembers,
            isPublic,
            logo: selectedLogo,
        });
        // Reset and close
        setClanName("");
        setClanDescription("");
        setMaxMembers(50);
        setIsPublic(true);
        setSelectedLogo(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-md mx-4 bg-[#f3e1d7] rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Create New Clan</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Clan Logo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Clan Logo
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {logoOptions.map((logo, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setSelectedLogo(logo)}
                                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${selectedLogo === logo
                                            ? "border-gray-900 ring-2 ring-gray-900/20"
                                            : "border-gray-200 hover:border-gray-400"
                                            }`}
                                    >
                                        <Image
                                            src={logo}
                                            alt={`Logo option ${index + 1}`}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clan Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Clan Name
                            </label>
                            <input
                                type="text"
                                value={clanName}
                                onChange={(e) => setClanName(e.target.value)}
                                placeholder="Enter clan name"
                                className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Clan Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={clanDescription}
                                onChange={(e) => setClanDescription(e.target.value)}
                                placeholder="Enter clan description"
                                rows={3}
                                className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                                required
                            />
                        </div>

                        {/* Max Members */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Members: {maxMembers}
                            </label>
                            <input
                                type="range"
                                min={5}
                                max={100}
                                step={5}
                                value={maxMembers}
                                onChange={(e) => setMaxMembers(Number(e.target.value))}
                                className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-gray-900"
                            />
                            <div className="flex justify-between text-xs text-gray-700 mt-1">
                                <span>5</span>
                                <span>100</span>
                            </div>
                        </div>

                        {/* Public / Invite Only Toggle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Clan Type
                            </label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPublic(true)}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${isPublic
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : "bg-white/50 text-gray-600 border-gray-200 hover:bg-white/70"
                                        }`}
                                >
                                    Public
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPublic(false)}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${!isPublic
                                        ? "bg-orange-50 text-orange-600 border-orange-200"
                                        : "bg-white/50 text-gray-600 border-gray-200 hover:bg-white/70"
                                        }`}
                                >
                                    Invite Only
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors mt-2"
                        >
                            Create Clan
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}