"use client";

import { useState, useRef, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import { getUserByWallet, updateUser } from "@/app/lib/users-service/users";
import { blockedContentError, hasBlockedContent } from "@/app/lib/content-moderation";


const PROFILE_SVGS = Array.from({ length: 31 }, (_, i) => `/profiles/${i + 1}.svg`);

export default function SettingsPage() {
    const { user, authenticated, logout, login, linkWallet, linkTwitter, linkGoogle } = usePrivy();

    // Profile state
    const [username, setUsername] = useState("");
    const [description, setDescription] = useState("");
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [editProfileIndex, setEditProfileIndex] = useState(0);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const { publicKey } = useSolanaWallet();
    const walletAddress = publicKey?.toBase58() ?? null;

    // Fetch user data on mount
    useEffect(() => {
        const fetchUserData = async () => {
            if (!authenticated || !publicKey) {
                setIsLoadingProfile(false);
                return;
            }

            try {
                const walletAddress = publicKey.toBase58();
                const userData = await getUserByWallet(walletAddress);
                setUsername(userData.username || "");
                setDescription(userData.description || "");
                if (userData.profile_image) {
                    const profileMatch = userData.profile_image.match(/profiles\/(\d+)\.svg/);
                    if (profileMatch) {
                        setEditProfileIndex(parseInt(profileMatch[1]) - 1);
                    }
                }
            } catch (error) {
                console.log('[Settings] Could not fetch user data:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        fetchUserData();
    }, [authenticated, publicKey]);

    // Get wallet address
    // const walletAddress = user?.wallet?.address || null;
    const displayAddress = walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : "Not connected";

    // Get linked accounts
    const linkedTwitter = user?.linkedAccounts?.find(acc => acc.type === "twitter_oauth");
    const linkedGoogle = user?.linkedAccounts?.find(acc => acc.type === "google_oauth");
    const linkedWallet = user?.linkedAccounts?.find(acc => acc.type === "wallet");

    // Determine current login method
    const getLoginMethod = () => {
        if (linkedWallet) return "wallet";
        if (linkedTwitter) return "twitter";
        if (linkedGoogle) return "google";
        return "email";
    };
    const currentLoginMethod = getLoginMethod();

    // Handle photo upload
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Copy wallet address
    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

    // Save profile changes
    const saveProfile = async () => {
        if (!publicKey) return;
        if (hasBlockedContent(username)) {
            setSaveError(blockedContentError("Username"));
            return;
        }
        if (hasBlockedContent(description)) {
            setSaveError(blockedContentError("Bio"));
            return;
        }

        setSaveError(null);
        setIsSavingProfile(true);
        try {
            const walletAddress = publicKey.toBase58();
            const existingUser = await getUserByWallet(walletAddress);
            const profileIndex = editProfileIndex + 1;

            await updateUser(existingUser.id, {
                username: username,
                description: description,
                profile_image: `https://earningrecords.com/assets/profiles/${profileIndex}.svg`,
            });
            console.log('[Settings] Profile saved successfully');
            setIsEditingProfile(false);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
        } catch (error) {
            console.error('[Settings] Failed to save profile:', error);
            const errorMessage = 'Failed to save profile, username already exists!!';
            setSaveError(errorMessage);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Randomize profile function
    const randomizeProfile = () => {
        const randomIndex = Math.floor(Math.random() * 31);
        setEditProfileIndex(randomIndex);
    };

    // Show login prompt if not authenticated
    if (!authenticated) {
        return (
            <div className="min-h-screen bg-[#f3e1d7] py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-300 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
                    <p className="text-gray-600 mb-6">
                        Please login to access the settings page and manage your profile.
                    </p>
                    <button
                        onClick={login}
                        className="w-full py-3 px-6 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        Login to Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3e1d7] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your profile, wallet, and connected accounts</p>
                </div>

                {/* Profile Section */}
                <section className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-300/50 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Profile Photo Section */}
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                    {profilePhoto ? (
                                        <Image src={profilePhoto} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
                                    ) : (
                                        <img
                                            src={PROFILE_SVGS[editProfileIndex]}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                {/* <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                /> */}
                            </div>
                            {/* <p className="text-xs text-gray-500 mt-2">Click to upload image</p> */}
                        </div>

                        {/* Profile Editor */}
                        <div className="flex-1 space-y-4">
                            {/* Profile Options */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Or choose a character</label>
                                <button
                                    onClick={randomizeProfile}
                                    className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Randomize Character
                                </button>
                            </div>

                            {/* Username Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username*</label>
                                <input
                                    maxLength={18}
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (saveError) setSaveError(null);
                                    }}
                                    className={`w-full px-4 py-2 bg-white/80 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent ${saveError ? 'border-red-300' : 'border-gray-300'}`}
                                    placeholder="Enter username"
                                />
                                {saveError && (
                                    <div className="flex items-center gap-2 mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {saveError}
                                    </div>
                                )}
                            </div>

                            {/* Bio Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio*</label>
                                <textarea
                                    maxLength={100}
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        if (saveError) setSaveError(null);
                                    }}
                                    rows={2}
                                    className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={saveProfile}
                                disabled={isSavingProfile}
                                className="w-full px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingProfile ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Saving...
                                    </span>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>

                            {/* Success Message */}
                            {showSuccessMessage && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Changes saved successfully!
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Social Connections Section */}
                <section className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-300/50 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Connected Accounts</h2>
                    </div>

                    <div className="space-y-3">
                        {/* Twitter */}
                        <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${linkedTwitter
                            ? "bg-blue-50/50 border-blue-300"
                            : "bg-white/50 border-gray-300 hover:border-gray-400"
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Twitter / X</p>
                                    <p className="text-sm text-gray-500">
                                        {linkedTwitter
                                            ? `@${linkedTwitter.username || "connected"}`
                                            : "Not connected"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {currentLoginMethod === "twitter" && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                        Current Login
                                    </span>
                                )}
                                {linkedTwitter ? (
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => linkTwitter()}
                                        className="px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Google */}
                        <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${linkedGoogle
                            ? "bg-red-50/50 border-red-300"
                            : "bg-white/50 border-gray-300 hover:border-gray-400"
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Google</p>
                                    <p className="text-sm text-gray-500">
                                        {linkedGoogle
                                            ? linkedGoogle.email
                                            : "Not connected"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {currentLoginMethod === "google" && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                        Current Login
                                    </span>
                                )}
                                {linkedGoogle ? (
                                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => linkGoogle()}
                                        className="px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                                    >
                                        Connect
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Wallet Login Indicator */}
                        {currentLoginMethod === "wallet" && (
                            <div className="flex items-center justify-between p-4 rounded-xl border-2 bg-orange-50/50 border-orange-300">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Crypto Wallet</p>
                                        <p className="text-sm text-gray-500">{displayAddress}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    Current Login
                                </span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Logout Section */}
                <section className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-300/50 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Account</h2>
                    </div>

                    <button
                        onClick={() => logout()}
                        className="w-full py-3 px-4 bg-red-50 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log Out
                    </button>
                </section>
            </div>

            {/* Export Wallet Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#f3e1d7] rounded-2xl border border-gray-300 p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Export Wallet</h3>
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-sm text-yellow-800">
                                    <strong>Security Warning:</strong> Exporting your private key gives full access to your wallet.
                                    Never share it with anyone and store it securely.
                                </p>
                            </div>
                        </div>

                        <p className="text-gray-600 mb-4">
                            This will export your Privy wallet's private key. Make sure you're in a secure environment.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // TODO: Implement actual wallet export
                                    alert("Wallet export functionality would be implemented here with Privy's export API");
                                    setShowExportModal(false);
                                }}
                                className="flex-1 py-3 px-4 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
