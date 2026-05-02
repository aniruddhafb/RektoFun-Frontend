"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ClanData } from "./types";
import {
    ChevronLeftIcon,
    ShareIcon,
    UserPlusIcon,
    VerifiedIcon,
    TrophyIcon,
    SwordsIcon,
    TrendingUpIcon,
    StarIcon,
    ShieldIcon,
    UsersIcon,
    SettingsIcon,
    ChevronDownIcon
} from "./icons";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import { joinClan, leaveClan, updateClan, type UpdateClanParams } from "@/app/lib/clan-service/clans";
import { getUserByWallet } from "@/app/lib/users-service/users";
import { getClanMembers } from "@/app/lib/clan-service/clanMembers";
import { countriesList, type Country } from "../clan-components/CountriesList";

interface ClanHeaderProps {
    clanData: ClanData;
    onClanMembershipChange?: (newMemberCount: number) => void;
    onClanDataUpdate?: () => void;
    onMembershipStatusChange?: (isMember: boolean) => void;
}

const ClanHeader = ({ clanData, onClanMembershipChange, onClanDataUpdate, onMembershipStatusChange }: ClanHeaderProps) => {
    const { publicKey } = useSolanaWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isMember, setIsMember] = useState(false);
    const [isClanLeader, setIsClanLeader] = useState(false);
    const [checkingMembership, setCheckingMembership] = useState(true);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Clan Settings state
    const CLAN_LOGOS = Array.from({ length: 14 }, (_, i) => `https://earningrecords.com/assets/clans/${i + 1}.webp`);
    const getInitialLogoIndex = () => {
        const currentLogo = clanData.logo;
        for (let i = 0; i < CLAN_LOGOS.length; i++) {
            const logoUrl = CLAN_LOGOS[i];
            const logoMatch = logoUrl.match(/clans\/(\d+)\.webp/);
            const currentLogoMatch = currentLogo.match(/clans\/(\d+)\.webp/);
            if (logoMatch && currentLogoMatch && logoMatch[1] === currentLogoMatch[1]) {
                return i;
            }
            if (logoUrl.includes(currentLogo) || currentLogo.includes(logoUrl.split('/').pop() || '')) {
                return i;
            }
        }
        return 0;
    };
    const [selectedLogoIndex, setSelectedLogoIndex] = useState<number>(getInitialLogoIndex());
    const [selectedCountry, setSelectedCountry] = useState<string>(clanData.country || "");
    const [maxMembers, setMaxMembers] = useState(clanData.maxMembers);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [countrySearchQuery, setCountrySearchQuery] = useState("");
    const [clanName, setClanName] = useState(clanData.name);
    const [description, setDescription] = useState(clanData.description);
    const [clanType, setClanType] = useState<"Public" | "Invite Only">(clanData.type);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Check if the current user is a member of this clan and if they are the leader
    useEffect(() => {
        const checkMembership = async () => {
            if (!publicKey || !clanData.slug) {
                setCheckingMembership(false);
                return;
            }

            try {
                const walletAddress = publicKey.toBase58();
                const userData = await getUserByWallet(walletAddress);
                const userId = userData.id;

                // Fetch clan members and check if user is in the list
                const membersResponse = await getClanMembers(clanData.slug);
                const isUserMember = membersResponse.members.some(member => member.id === userId);
                setIsMember(isUserMember);

                // Check if the user is the clan leader
                // The leader's username is stored in clanData.leader, we need to compare with the member who has role "Leader"
                const clanLeader = membersResponse.members.find(member => member.role === "Leader");
                setIsClanLeader(clanLeader?.id === userId);
            } catch (err) {
                console.error("Failed to check clan membership:", err);
                setIsMember(false);
                setIsClanLeader(false);
            } finally {
                setCheckingMembership(false);
            }
        };

        checkMembership();
    }, [publicKey, clanData.slug]);

    // Reset settings state when clanData changes
    useEffect(() => {
        setClanName(clanData.name);
        setDescription(clanData.description);
        setMaxMembers(clanData.maxMembers);
        setSelectedCountry(clanData.country || "");
        setClanType(clanData.type);
        setSelectedLogoIndex(getInitialLogoIndex());
    }, [clanData]);

    // Filter countries based on search query
    const filteredCountries = countriesList.filter((country: Country) =>
        country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
    );

    // Randomize logo function
    const randomizeLogo = () => {
        const randomIndex = Math.floor(Math.random() * CLAN_LOGOS.length);
        setSelectedLogoIndex(randomIndex);
    };

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

    // Handle save changes
    const handleSave = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            const updateParams: UpdateClanParams = {
                clan_name: clanName,
                clan_description: description,
                clan_image: CLAN_LOGOS[selectedLogoIndex],
                max_members: maxMembers,
                clan_status: clanType === "Public" ? "public" : "invite_only",
                clan_region: selectedCountry || undefined,
            };

            await updateClan(clanData.slug, updateParams);
            setSubmitSuccess(true);
            // Notify parent to refresh clan data
            onClanDataUpdate?.();
            setTimeout(() => {
                setIsSettingsModalOpen(false);
                setSubmitSuccess(false);
            }, 1500);
        } catch (error) {
            console.error("Failed to update clan:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to update clan";
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenSettings = () => {
        setIsSettingsModalOpen(true);
        setSubmitError(null);
        setSubmitSuccess(false);
    };

    const handleJoinClan = async () => {
        if (!publicKey) {
            setError("Please connect your wallet to join a clan");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get user ID from wallet address
            const walletAddress = publicKey.toBase58();
            const userData = await getUserByWallet(walletAddress);
            const userId = userData.id;

            // Join the clan
            const response = await joinClan(clanData.slug, userId);

            if (response.success) {
                setIsMember(true);
                // Notify parent component about membership change
                onClanMembershipChange?.(clanData.members + 1);
                onMembershipStatusChange?.(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to join clan");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveClan = async () => {
        if (!publicKey) {
            setError("Please connect your wallet to leave a clan");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get user ID from wallet address
            const walletAddress = publicKey.toBase58();
            const userData = await getUserByWallet(walletAddress);
            const userId = userData.id;

            // Leave the clan
            const response = await leaveClan(clanData.slug, userId);

            if (response.success) {
                setIsMember(false);
                // Notify parent component about membership change
                onClanMembershipChange?.(clanData.members - 1);
                onMembershipStatusChange?.(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to leave clan");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <>
            {/* ── Top Action Bar ── */}
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/clans"
                    className="group flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-all duration-300"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/60 border border-gray-200/60 group-hover:bg-white/80 group-hover:border-gray-300/80 transition-all duration-300 shadow-sm">
                        <ChevronLeftIcon className="w-4 h-4" />
                    </div>
                    <span className="hidden sm:inline">Back to Clans</span>
                </Link>
                <button
                    onClick={() => {
                        const shareUrl = window.location.href;
                        if (navigator.share) {
                            navigator.share({
                                title: `Join ${clanData.name}`,
                                text: `Check out ${clanData.name} on RektoFun!`,
                                url: shareUrl,
                            }).catch(() => console.log('Error sharing'));
                        } else {
                            navigator.clipboard.writeText(shareUrl);
                            alert('Clan link copied to clipboard!');
                        }
                    }}
                    className="cursor-pointer group flex items-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white/90 border border-gray-200/60 hover:border-gray-300/80 rounded-xl text-sm font-semibold text-gray-700 transition-all duration-300 shadow-sm hover:shadow-md"
                    aria-label="Share Clan"
                >
                    <ShareIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span className="hidden sm:inline">Share</span>
                </button>
            </div>

            {/* ── Clan Header Card ── */}
            <div className="relative bg-gradient-to-br from-white/80 via-white/60 to-white/70 backdrop-blur-md rounded-3xl border border-white/80 shadow-lg p-6 sm:p-8 mb-6 overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-100/30 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-50/40 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative flex flex-col xl:flex-row gap-6 xl:gap-8">
                    {/* Left Column - Logo & Badge - Centered on mobile */}
                    <div className="flex flex-col items-center xl:items-start gap-4 flex-shrink-0">
                        {/* Logo */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white shadow-xl">
                                <Image
                                    src={clanData.logo}
                                    alt={clanData.name}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            {clanData.verified && (
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                                    <VerifiedIcon className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Clan Type Badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-50/80 text-green-700 border border-green-200/60 backdrop-blur-sm">
                            <ShieldIcon className="w-3.5 h-3.5" />
                            {clanData.type}
                        </div>
                    </div>

                    {/* Middle Column - Info & Stats */}
                    <div className="flex-1 min-w-0 text-center xl:text-left">
                        {/* Title & Tagline */}
                        <div className="mb-3">
                            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-2.5 mb-1.5">
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                                    {clanData.name}
                                </h1>
                            </div>
                            <p className="text-base sm:text-lg font-bold text-gray-700">{clanData.tagline}</p>
                        </div>

                        {/* Leader & Members */}
                        <div className="flex flex-wrap items-center justify-center xl:justify-start gap-4 mt-4">
                            {/* leader option  */}
                            <Link
                                href={`/profile/${clanData.leaderWallet}`}
                                className="flex items-center gap-2.5 px-3 py-1.5 bg-orange-50/60 rounded-xl border border-orange-100/60 backdrop-blur-sm hover:bg-orange-100/80 transition-colors duration-300"
                            >
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ring-2 ring-orange-200/50">
                                    <Image
                                        src={clanData.leaderAvatar}
                                        alt={clanData.leader}
                                        width={24}
                                        height={24}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-sm font-bold text-orange-600">{clanData.leader}</span>
                                <span className="text-xs text-gray-400 font-medium">Leader</span>
                            </Link>
                            {/* member option  */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="flex -space-x-2">
                                </div>
                                <UsersIcon className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold">{clanData.members}</span>
                                <span className="text-gray-400">/</span>
                                <span className="font-medium">{clanData.maxMembers}</span>
                                <span className="text-gray-500">Members</span>
                            </div>
                        </div>

                        {/* Stats Row - Centered on mobile, start on desktop */}
                        <div className="flex flex-wrap items-center justify-center xl:justify-start gap-3 mt-5">
                            {/* Wins */}
                            <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-br from-amber-50/80 to-yellow-50/80 hover:from-amber-100/80 hover:to-yellow-100/80 border border-amber-100/60 hover:border-amber-200/80 transition-all duration-300 shadow-sm hover:shadow-md">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100/80 group-hover:scale-110 transition-transform duration-300">
                                    <TrophyIcon className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-gray-900 leading-none">{clanData.totalWins}</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight mt-0.5">Wins</span>
                                </div>
                            </div>

                            {/* Rekts */}
                            <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-br from-red-50/80 to-rose-50/80 hover:from-red-100/80 hover:to-rose-100/80 border border-red-100/60 hover:border-red-200/80 transition-all duration-300 shadow-sm hover:shadow-md">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-100/80 group-hover:scale-110 transition-transform duration-300">
                                    <SwordsIcon className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-gray-900 leading-none">{clanData.totalRekts.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight mt-0.5">Rekts</span>
                                </div>
                            </div>

                            {/* Win Rate */}
                            <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-br from-emerald-50/80 to-green-50/80 hover:from-emerald-100/80 hover:to-green-100/80 border border-emerald-100/60 hover:border-emerald-200/80 transition-all duration-300 shadow-sm hover:shadow-md">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100/80 group-hover:scale-110 transition-transform duration-300">
                                    <TrendingUpIcon className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-gray-900 leading-none">{clanData.winRate}%</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight mt-0.5">Win Rate</span>
                                </div>
                            </div>

                            {/* REKT Points */}
                            <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-br from-orange-50/80 to-amber-50/80 hover:from-orange-100/80 hover:to-amber-100/80 border border-orange-100/60 hover:border-orange-200/80 transition-all duration-300 shadow-sm hover:shadow-md">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-100/80 group-hover:scale-110 transition-transform duration-300">
                                    <StarIcon className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-orange-600 leading-none">{clanData.rektPoints}</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight mt-0.5">REKT Points</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Action Buttons */}
                    <div className="flex flex-col items-center xl:items-end gap-2.5 xl:min-w-[170px] flex-shrink-0">
                        {checkingMembership ? (
                            // Loading state while checking membership
                            <button
                                disabled
                                className="group w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-400 text-white rounded-xl text-sm font-bold cursor-not-allowed"
                            >
                                Loading...
                            </button>
                        ) : isClanLeader ? (
                            // User is the clan leader - show Manage Clan and Leave Clan buttons
                            <>
                                <button onClick={handleOpenSettings} className="group w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                    <SettingsIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                    Manage Clan
                                </button>
                                <button
                                    onClick={handleLeaveClan}
                                    disabled={isLoading}
                                    className="group w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50/80 hover:bg-red-100/80 disabled:bg-red-50/50 text-red-600 border border-red-200/60 hover:border-red-300/80 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "Leaving..." : "Leave Clan"}
                                </button>
                            </>
                        ) : isMember ? (
                            // User is a member but not the leader - only show Leave Clan button
                            <>
                                <button
                                    onClick={handleLeaveClan}
                                    disabled={isLoading}
                                    className="group w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50/80 hover:bg-red-100/80 disabled:bg-red-50/50 text-red-600 border border-red-200/60 hover:border-red-300/80 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
                                >
                                    {isLoading ? "Leaving..." : "Leave Clan"}
                                </button>
                            </>
                        ) : clanData.isOpenToJoin ? (
                            // User is not a member and clan is open to join
                            <>
                                <button
                                    onClick={handleJoinClan}
                                    disabled={isLoading}
                                    className="group w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed"
                                >
                                    <UserPlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                                    {isLoading ? "Joining..." : "Join Clan"}
                                </button>
                            </>
                        ) : (
                            // Clan is invite-only and user is not a member
                            <button
                                disabled
                                className="group w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-400 text-white rounded-xl text-sm font-bold cursor-not-allowed"
                            >
                                Invite Only
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-600">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setIsSettingsModalOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-2xl bg-[#f3e1d7] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Clan Settings
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Manage your clan settings
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsSettingsModalOpen(false)}
                                    className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5 text-gray-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Success Message */}
                            {submitSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                                    Clan settings updated successfully!
                                </div>
                            )}

                            {/* Error Message */}
                            {submitError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                    {submitError}
                                </div>
                            )}

                            <div className="space-y-5 max-w-xl">
                                {/* Clan Logo */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Clan Name</label>
                                    <input
                                        type="text"
                                        value={clanName}
                                        onChange={(e) => setClanName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#faf8f5] border border-gray-300/70 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-[#faf8f5] border border-gray-300/70 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Country Selection */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Country
                                    </label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={toggleDropdown}
                                            className="w-full px-4 py-2.5 bg-[#faf8f5] border border-gray-300/70 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent flex items-center justify-between"
                                        >
                                            <span className="flex items-center gap-2">
                                                {selectedCountry ? (
                                                    <>
                                                        <span className="text-xl">{countriesList.find((c: Country) => c.code === selectedCountry)?.flag}</span>
                                                        <span>{countriesList.find((c: Country) => c.code === selectedCountry)?.name}</span>
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
                                                        filteredCountries.map((country: Country) => (
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                                        Max Members
                                    </label>
                                    <div className="bg-[#faf8f5] rounded-2xl p-4 border border-gray-300/70">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <p className="text-2xl font-bold text-gray-900">{maxMembers}</p>
                                                    <p className="text-xs text-gray-500">members max</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 bg-white/90 text-gray-600 text-sm font-medium rounded-full border border-gray-300">
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
                                            className="w-full h-3 bg-gradient-to-r from-green-100 via-amber-100 to-amber-200 rounded-full appearance-none cursor-pointer accent-gray-900"
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

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Clan Type</label>
                                    <div className="relative">
                                        <select
                                            value={clanType}
                                            onChange={(e) => setClanType(e.target.value as "Public" | "Invite Only")}
                                            className="w-full appearance-none pl-4 pr-9 py-2.5 bg-[#faf8f5] border border-gray-300/70 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent cursor-pointer"
                                        >
                                            <option>Public</option>
                                            <option>Invite Only</option>
                                        </select>
                                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setIsSettingsModalOpen(false)}
                                        className="px-5 py-2.5 bg-white/70 hover:bg-white/90 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ClanHeader;
