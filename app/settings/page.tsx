"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useAccounts, useModal } from "@phantom/react-sdk";

const PROFILE_SVGS = Array.from({ length: 31 }, (_, i) => `/profiles/${i + 1}.svg`);

export default function SettingsPage() {
    const [username, setUsername] = useState("trader_123");
    const [description, setDescription] = useState("Crypto enthusiast | DeFi degen | Prediction markets warrior");
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [editProfileIndex, setEditProfileIndex] = useState(0);
    const [copiedAddress, setCopiedAddress] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { open: openPhantomModal } = useModal();
    const accounts = useAccounts();

    const connectedAccount = accounts?.[0];
    const walletAddress = connectedAccount?.address;
    const shortAddress = walletAddress
        ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
        : null;
    const displayAddress = shortAddress ?? "Wallet not connected";

    const copyAddress = async () => {
        if (walletAddress) {
            await navigator.clipboard.writeText(walletAddress);
            setCopiedAddress(true);
            setTimeout(() => setCopiedAddress(false), 2000);
        }
    };

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

    const saveProfile = () => {
        console.log("Saving profile:", { username, description, profileIndex: editProfileIndex });
    };

    const randomizeProfile = () => {
        const randomIndex = Math.floor(Math.random() * 31);
        setEditProfileIndex(randomIndex);
    };

    return (
        <div className="min-h-screen bg-[#f3e1d7] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-600 mt-1">Manage your local profile preferences and view your connected wallet.</p>
                </div>

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
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                    {profilePhoto ? (
                                        <Image src={profilePhoto} alt="Profile" width={96} height={96} className="w-full h-full object-cover" />
                                    ) : (
                                        <Image
                                            src={PROFILE_SVGS[editProfileIndex]}
                                            alt="Profile"
                                            width={96}
                                            height={96}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <button
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
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Click to upload image</p>
                        </div>

                        <div className="flex-1 space-y-4">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent"
                                    placeholder="Enter username"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent resize-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <button
                                onClick={saveProfile}
                                className="w-full px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer font-medium"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </section>

                {/* Wallet Section */}
                <section className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-300/50 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Wallet</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Wallet Address Display */}
                        <div className="bg-white/70 border border-gray-300 rounded-xl p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Connected Wallet Address</label>
                            {walletAddress ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 px-4 py-3 bg-white/80 rounded-xl border border-gray-300/50">
                                        <code className="text-sm font-mono text-gray-800">{walletAddress}</code>
                                    </div>
                                    <button
                                        onClick={copyAddress}
                                        className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        {copiedAddress ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="hidden sm:inline">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <span className="hidden sm:inline">Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <div className="flex-1 px-4 py-3 bg-white/80 rounded-xl border border-gray-300/50">
                                        <code className="text-sm font-mono text-gray-500">{displayAddress}</code>
                                    </div>
                                    <button
                                        onClick={openPhantomModal}
                                        className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span>Connect Wallet</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
