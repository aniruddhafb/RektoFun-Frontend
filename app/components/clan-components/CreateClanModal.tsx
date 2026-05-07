"use client";

import { useState } from "react";
import Image from "next/image";
import { countriesList, type Country } from "./CountriesList";
import { createClan, type CreateClanParams } from "../../lib/clan-service/clans";
import { blockedContentError, hasBlockedContent } from "../../lib/content-moderation";

interface CreateClanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClanCreated?: () => void;
    userId?: string;
}

// Clan logo options from earningrecords.com
const CLAN_LOGOS = Array.from({ length: 14 }, (_, i) => `https://earningrecords.com/assets/rektofun/clans/${i + 1}.webp`);

export function CreateClanModal({ isOpen, onClose, onClanCreated, userId }: CreateClanModalProps) {
    const [clanName, setClanName] = useState("");
    const [clanDescription, setClanDescription] = useState("");
    const [maxMembers, setMaxMembers] = useState(10);
    const [isPublic, setIsPublic] = useState(true);
    const [selectedLogoIndex, setSelectedLogoIndex] = useState<number>(0); // Default to first logo
    const [selectedCountry, setSelectedCountry] = useState<string>("");
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            setSubmitError("Please log in to create a clan");
            return;
        }
        if (hasBlockedContent(clanName)) {
            setSubmitError(blockedContentError("Clan name"));
            return;
        }
        if (hasBlockedContent(clanDescription)) {
            setSubmitError(blockedContentError("Description"));
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const selectedLogo = CLAN_LOGOS[selectedLogoIndex];
            const clanData: CreateClanParams = {
                clan_name: clanName,
                clan_description: clanDescription,
                clan_image: selectedLogo,
                max_members: maxMembers,
                clan_status: isPublic ? "public" : "invite_only",
                clan_region: selectedCountry || undefined,
                clan_leader: userId,
            };

            console.log("Creating clan:", clanData);
            const createdClan = await createClan(clanData);
            console.log("Clan created successfully:", createdClan);

            // Reset and close
            setClanName("");
            setClanDescription("");
            setMaxMembers(10);
            setIsPublic(true);
            setSelectedLogoIndex(0);
            setSelectedCountry("");
            setSubmitError(null);

            if (onClanCreated) {
                onClanCreated();
            }
            onClose();
        } catch (error) {
            console.error("Failed to create clan:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to create clan";
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Randomize logo function
    const randomizeLogo = () => {
        const randomIndex = Math.floor(Math.random() * CLAN_LOGOS.length);
        setSelectedLogoIndex(randomIndex);
    };

    // Filter countries based on search query
    const filteredCountries = countriesList.filter((country) =>
        country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
    );

    // Handle country selection
    const handleCountrySelect = (code: string) => {
        setSelectedCountry(code);
        setShowCountryDropdown(false);
        setCountrySearchQuery("");
    };

    // Handle dropdown toggle
    const toggleDropdown = () => {
        setShowCountryDropdown(!showCountryDropdown);
        if (!showCountryDropdown) {
            setCountrySearchQuery("");
        }
    };

    // Reset search when modal closes
    if (!isOpen) {
        setCountrySearchQuery("");
        setShowCountryDropdown(false);
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative z-10 w-full max-w-2xl bg-[#f3e1d7] rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
                <div className="p-6 overflow-y-auto flex-1">
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

                    {/* Error Message */}
                    {submitError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {submitError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Clan Logo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Clan Logo
                            </label>
                            {/* Logo Preview */}
                            <div className="flex mb-4">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white">
                                    <Image
                                        src={CLAN_LOGOS[selectedLogoIndex]}
                                        alt="Selected clan logo"
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            {/* Randomize Button */}
                            <div className="flex items-center gap-3 mb-3">
                                <button
                                    type="button"
                                    onClick={randomizeLogo}
                                    className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Randomize
                                </button>
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

                        {/* Country Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={toggleDropdown}
                                    className="w-full px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        {selectedCountry ? (
                                            <>
                                                <span className="text-xl">{countriesList.find(c => c.code === selectedCountry)?.flag}</span>
                                                <span>{countriesList.find(c => c.code === selectedCountry)?.name}</span>
                                            </>
                                        ) : (
                                            <span className="text-gray-400">Select your country</span>
                                        )}
                                    </span>
                                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showCountryDropdown && (
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden">
                                        {/* Search Input */}
                                        <div className="sticky top-0 bg-white border-b border-gray-200 p-3">
                                            <div className="relative">
                                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                <input
                                                    type="text"
                                                    value={countrySearchQuery}
                                                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    placeholder="Search country..."
                                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        {/* Country List */}
                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredCountries.length > 0 ? (
                                                filteredCountries.map((country) => (
                                                    <button
                                                        key={country.code}
                                                        type="button"
                                                        onClick={() => handleCountrySelect(country.code)}
                                                        className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedCountry === country.code ? 'bg-gray-100' : ''
                                                            }`}
                                                    >
                                                        <span className="text-xl">{country.flag}</span>
                                                        <span className="text-gray-900">{country.name}</span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-8 text-center text-gray-500">
                                                    <p>No countries found</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Max Members */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Max Members
                            </label>
                            <div className="bg-white/60 rounded-2xl p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{maxMembers}</p>
                                            <p className="text-xs text-gray-500">members max</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1.5 bg-white/80 text-gray-600 text-sm font-medium rounded-full border border-gray-300">
                                        {maxMembers >= 50 ? 'Large' : maxMembers >= 20 ? 'Medium' : 'Small'} Clan
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={5}
                                    max={100}
                                    step={5}
                                    value={maxMembers}
                                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                                    className="w-full h-3 bg-gradient-to-r from-green-200 via-orange-200 to-orange-200 rounded-full appearance-none cursor-pointer accent-gray-900"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>5</span>
                                    <span>25</span>
                                    <span>50</span>
                                    <span>75</span>
                                    <span>100</span>
                                </div>
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
                            disabled={isSubmitting}
                            className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating...
                                </>
                            ) : (
                                "Create Clan"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
