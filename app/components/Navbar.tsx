"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivy } from '@privy-io/react-auth';
import Image from "next/image";
import { usePathname } from "next/navigation";
import { DepositModal } from "./DepositModal";

const PROFILE_SVGS = Array.from({ length: 31 }, (_, i) => `/profiles/${i + 1}.svg`);

export default function Navbar() {
    const { login, authenticated, user, logout, ready } = usePrivy();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [editUsername, setEditUsername] = useState("");
    const [editProfileIndex, setEditProfileIndex] = useState(0);
    const [editInviteCode, setEditInviteCode] = useState("");
    const pathname = usePathname();

    const handleAuth = () => {
        login();
    };

    const handleLogout = () => {
        logout();
    };

    // Get wallet address from user object (handles both embedded and external wallets)
    const getWalletAddress = () => {
        if (!user) return null;
        // Check for embedded wallet first, then external wallet
        return user.wallet?.address || null;
    };

    const walletAddress = getWalletAddress();
    const displayAddress = walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : null;

    // Get username from user object
    const getUsername = () => {
        if (!user) return null;
        // Try to get username from email or use wallet address
        return user.email?.address?.split('@')[0] || displayAddress || 'User';
    };

    const username = getUsername();

    // Randomize profile function
    const randomizeProfile = () => {
        const randomIndex = Math.floor(Math.random() * 31);
        setEditProfileIndex(randomIndex);
    };

    // Initialize edit values when modal opens
    useEffect(() => {
        if (isProfileModalOpen) {
            setEditUsername(username || "");
            setEditInviteCode("");
        }
    }, [isProfileModalOpen, username]);

    // Helper function to check if link is active
    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    // Navigation links data
    const navLinks = [
        { href: "/challenges", label: "Challenges" },
        { href: "/markets", label: "Markets" },
        { href: "/leaderboard", label: "Leaderboard" },
        { href: "/referral", label: "Referral" },
        { href: "/activity", label: "Activity" },
        { href: "https://rektofun.gitbook.io/rektofun/roadmap/whats-next", label: "Roadmap" },
    ];

    return (
        <>
            {/* Development Mode Banner */}
            <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-100 border-b border-amber-300">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-amber-900 font-medium text-center hidden md:block">
                        Development Mode — Dummy data is displayed on this website
                    </p>
                    <p className="text-sm text-amber-900 font-medium text-center md:hidden">
                        Development Mode
                    </p>
                </div>
            </div>

            {/* Main Navbar - Sticky at top */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f3e1d7]/80 backdrop-blur-md border-b border-white-100 pt-8">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo - Smaller on mobile */}
                        <div className="flex items-center gap-2 relative">
                            {/* Beta Badge */}
                            <div className="absolute -top-3 -left-[-128px] hidden md:block">
                                <div className="relative w-10 h-10">
                                    <svg viewBox="0 0 80 80" className="w-full h-full rotate-12">
                                        <polygon
                                            points="40,0 45,15 60,10 52,25 65,35 50,40 55,55 40,48 25,55 30,40 15,35 28,25 20,10 35,15"
                                            fill="#e85a2d"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 mb-1 flex items-center justify-center text-white text-[8px] font-bold rotate-12">
                                        Beta
                                    </span>
                                </div>
                            </div>
                            <Link href="/" className="hover:opacity-80 transition-opacity">
                                <Image
                                    src="/logos/mainlogo.png"
                                    alt="REKTO"
                                    width={220}
                                    height={60}
                                    className="h-6 sm:h-8 w-auto"
                                    priority
                                />
                            </Link>
                        </div>

                        {/* Desktop Search Bar & How it Works */}
                        <div className="hidden md:flex items-center gap-6 flex-1 justify-center max-w-2xl mx-8">
                            <div className="relative flex-1 max-w-md">
                                <input
                                    type="text"
                                    placeholder="Search Challenges..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2.5 pl-10 bg-white/50 border border-gray-300 rounded-full text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
                                />
                                <svg
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <Link
                                href="https://rektofun.gitbook.io/rektofun/introduction/how-it-works"
                                target="_blank"
                                className="text-sm font-medium text-gray-700 hover:text-black transition-colors whitespace-nowrap"
                            >
                                How it works?
                            </Link>
                        </div>

                        {/* Auth Buttons - Desktop & Mobile */}
                        <div className="flex items-center gap-2 sm:gap-4">
                            {authenticated ? (
                                <div className="flex items-center gap-3">
                                    {/* Deposit Button */}
                                    <button
                                        onClick={() => setIsDepositModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-gray-400 hover:bg-white/80 text-black text-sm font-medium rounded-full transition-colors cursor-pointer"
                                    >
                                        $
                                        Deposit
                                    </button>

                                    {/* Profile Dropdown Container */}
                                    <div
                                        className="relative"
                                        onMouseEnter={() => setIsDropdownOpen(true)}
                                        onMouseLeave={() => setIsDropdownOpen(false)}
                                    >
                                        {/* Profile Icon Button */}
                                        <button className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white/50 border border-gray-300 hover:bg-white/80 transition-all cursor-pointer">
                                            {/* Circular Profile Avatar */}
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                                                {username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                                                {username}
                                            </span>
                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {isDropdownOpen && (
                                            <div className="absolute right-0 top-full pt-2 w-72">
                                                <div className="bg-white rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
                                                    {/* User Info Section */}
                                                    <div className="p-4 bg-white from-gray-50 to-gray-100 border-b border-gray-300">
                                                        <Link href="/profile/0x45454" className="flex items-center gap-3">
                                                            {/* Large Profile Avatar */}
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                                                                {username?.charAt(0).toUpperCase() || 'U'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-900 truncate">{username}</p>
                                                                <p className="text-xs text-gray-500 font-mono truncate">{displayAddress}</p>
                                                            </div>
                                                        </Link>
                                                    </div>

                                                    {/* Menu Items */}
                                                    <div className="py-2">
                                                        {/* View Profile */}
                                                        <Link
                                                            href={`/profile/${walletAddress}`}
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-black transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            View Profile
                                                        </Link>

                                                        {/* Deposit Funds */}
                                                        <button
                                                            onClick={() => {
                                                                setIsDropdownOpen(false);
                                                                setIsDepositModalOpen(true);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-black transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Deposit Funds
                                                        </button>

                                                        {/* Refer and Earn */}
                                                        <Link
                                                            href="/referral"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-black transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                                            </svg>
                                                            Refer & Earn
                                                        </Link>

                                                        {/* Settings */}
                                                        <Link
                                                            href="/settings"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-black transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            Settings
                                                        </Link>

                                                        {/* Divider */}
                                                        <div className="my-2 border-t border-gray-300" />

                                                        {/* Terms */}
                                                        <Link
                                                            href="/terms"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-black transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            Terms
                                                        </Link>

                                                        {/* Privacy */}
                                                        <Link
                                                            href="/privacy"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-black transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Privacy
                                                        </Link>

                                                        {/* Docs */}
                                                        <a
                                                            href="https://rektofun.gitbook.io/rektofun/"
                                                            target="_blank"
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:text-black transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                            </svg>
                                                            Docs
                                                        </a>

                                                        {/* Divider */}
                                                        <div className="my-2 border-t border-gray-300" />

                                                        {/* Social Links */}
                                                        <div className="px-4 py-2">
                                                            <p className="text-xs text-gray-500 mb-2">Follow Us</p>
                                                            <div className="flex gap-3">
                                                                {/* Twitter */}
                                                                <a
                                                                    href="https://x.com/Rektofun"
                                                                    target="_blank"
                                                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-black hover:text-white transition-colors cursor-pointer"
                                                                    aria-label="Twitter"
                                                                >
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                                                    </svg>
                                                                </a>
                                                                {/* GitHub */}
                                                                <a
                                                                    href="https://github.com/aniruddhafb/RektoFun"
                                                                    target="_blank"
                                                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-black hover:text-white transition-colors cursor-pointer"
                                                                    aria-label="GitHub"
                                                                >
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                                                    </svg>
                                                                </a>
                                                                {/* Discord */}
                                                                <a
                                                                    href="https://discord.gg/Uk22qDtzcQ"
                                                                    target="_blank"
                                                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#5865F2] hover:text-white transition-colors cursor-pointer"
                                                                    aria-label="Discord"
                                                                >
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.248.195.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                                                    </svg>
                                                                </a>
                                                            </div>
                                                        </div>

                                                        {/* Divider */}
                                                        <div className="my-2 border-t border-gray-200" />

                                                        {/* Logout */}
                                                        <button
                                                            onClick={handleLogout}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                            </svg>
                                                            Logout
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleAuth}
                                        className="px-4 sm:px-6 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer border border-gray-700 rounded-full"
                                    >
                                        Log In
                                    </button>
                                    <button
                                        onClick={handleAuth}
                                        className="px-4 sm:px-6 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                                    >
                                        Sign Up
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {/* Sub Navbar - Desktop & Mobile Navigation Links */}
                <div className="bg-[#f3e1d7]/60 border-b border-gray-200/50 mt-[-12px]">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        {/* Desktop: centered */}
                        <div className="hidden md:flex items-center justify-center gap-8 h-12">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium transition-colors cursor-pointer ${isActive(link.href)
                                        ? "text-black font-semibold"
                                        : "text-gray-700 hover:text-black"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        {/* Mobile: horizontally scrollable with hidden scrollbar */}
                        <div
                            className="flex md:hidden items-center gap-6 h-12 overflow-x-auto whitespace-nowrap"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium transition-colors cursor-pointer flex-shrink-0 ${isActive(link.href)
                                        ? "text-black font-semibold"
                                        : "text-gray-700 hover:text-black"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Spacer for fixed navbar */}
            <div className="h-[128px] md:h-[128px]" />

            {/* Hide scrollbar for WebKit browsers */}
            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <DepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
            />

            {/* Profile Edit Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setIsProfileModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-md bg-[#f3e1d7] rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-300">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Profile Photo Section */}
                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                                    <img
                                        src={PROFILE_SVGS[editProfileIndex]}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    onClick={randomizeProfile}
                                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Randomize
                                </button>
                            </div>

                            {/* Username Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Username</label>
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Invite Code Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Invite Code (Optional)</label>
                                <input
                                    type="text"
                                    value={editInviteCode}
                                    onChange={(e) => setEditInviteCode(e.target.value)}
                                    placeholder="Enter invite code"
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
                                />
                                <p className="text-xs text-gray-500">Enter an invite code to get bonus rewards</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 p-4 border-t border-gray-300 bg-white/50">
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Handle save - TODO: integrate with backend
                                    console.log("Saving profile:", {
                                        username: editUsername,
                                        profileIndex: editProfileIndex,
                                        inviteCode: editInviteCode
                                    });
                                    setIsProfileModalOpen(false);
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation - Fixed at bottom */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f3e1d7]/95 backdrop-blur-md border-t border-gray-200/50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="flex items-center justify-around h-14">
                    {/* Home */}
                    <Link
                        href="/"
                        className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 ${isActive("/") && !isActive("/challenges") && !isActive("/markets") && !isActive("/leaderboard") && !isActive("/referral") && !isActive("/activity") && !isActive("/roadmap") && !isActive("/profile")
                            ? "text-black"
                            : "text-gray-500"
                            }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[10px] font-medium truncate">Home</span>
                    </Link>

                    {/* Markets */}
                    <Link
                        href="/markets"
                        className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 ${isActive("/markets")
                            ? "text-black"
                            : "text-gray-500"
                            }`}
                    >
                        <Image
                            src="/Icons/discover.png"
                            alt="Markets"
                            width={20}
                            height={20}
                            className="w-5 h-5 flex-shrink-0"
                        />
                        <span className="text-[10px] font-medium truncate">Markets</span>
                    </Link>

                    {/* Search */}
                    <button
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 text-gray-500"
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-[10px] font-medium truncate">Search</span>
                    </button>

                    {/* Leaderboard */}
                    <Link
                        href="/leaderboard"
                        className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 ${isActive("/leaderboard")
                            ? "text-black"
                            : "text-gray-500"
                            }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-[10px] font-medium truncate">Leaderboard</span>
                    </Link>

                    {/* Profile */}
                    <Link
                        href="/profile/test"
                        className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 ${isActive("/profile")
                            ? "text-black"
                            : "text-gray-500"
                            }`}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-[10px] font-medium truncate">Profile</span>
                    </Link>
                </div>
            </div>
        </>
    );
}
