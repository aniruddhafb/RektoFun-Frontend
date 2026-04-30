"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePathname } from "next/navigation";
import { DepositModal } from "./DepositModal";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import * as components from "./navbar-components";
import { createUser } from "@/app/lib/users-service/users";

export default function Navbar() {
    const { login, authenticated, user, logout, ready } = usePrivy();
    const { solanaWallet, publicKey, usdcBalance } = useSolanaWallet();
    const walletAddress = publicKey?.toBase58() ?? null;
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [editUsername, setEditUsername] = useState("");
    const [editProfileIndex, setEditProfileIndex] = useState(0);
    const [editInviteCode, setEditInviteCode] = useState("");
    const [hasCalledCreateUser, setHasCalledCreateUser] = useState(false);
    const pathname = usePathname();

    const handleAuth = () => {
        console.log('[Navbar] handleAuth called - login() invoked');
        login();
    };

    const handleLogout = () => {
        console.log('[Navbar] handleLogout called - logout() invoked');
        setHasCalledCreateUser(false);
        logout();
    };

    const displayAddress = walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : null;

    // Get username from user object
    const getUsername = () => {
        if (!publicKey) return null;
        return (
            displayAddress ||
            "User"
        );
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

    // Call createUser when user authenticates (only once per session)
    useEffect(() => {
        const handleCreateUser = async () => {
            if (!authenticated || !publicKey || hasCalledCreateUser) {
                console.log('[Navbar] createUser skipped:', {
                    authenticated,
                    hasUser: !!publicKey,
                    hasCalledCreateUser
                });
                return;
            }

            const walletAddress = publicKey?.toBase58();
            if (!walletAddress) {
                console.log('[Navbar] createUser skipped - no wallet address');
                return;
            }

            console.log('[Navbar] Calling createUser for wallet:', walletAddress);

            try {
                const userData = await createUser({
                    wallet_address: walletAddress,
                    username: `user-${walletAddress}`,
                    login_type: user?.email ? 'email' : 'wallet',
                });
                console.log('[Navbar] createUser success:', userData);
            } catch (error) {
                // If user already exists (409), that's fine - backend returns existing user
                if (error instanceof Error && error.message.includes('409')) {
                    console.log('[Navbar] createUser - user already exists (expected)');
                } else {
                    console.error('[Navbar] createUser error:', error);
                }
            } finally {
                setHasCalledCreateUser(true);
            }
        };

        handleCreateUser();
    }, [authenticated, user, hasCalledCreateUser, username]);

    // Helper function to check if link is active
    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(`${href}/`);
    };

    const profileHref = walletAddress
        ? `/profile/${walletAddress}`
        : "/settings";

    return (
        <>
            {/* Development Mode Banner */}
            <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-100 border-b border-amber-300">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
                    <svg
                        className="w-4 h-4 text-amber-700 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <p className="text-sm text-amber-900 font-medium text-center hidden md:block">
                        Devnet Mode — We Are Currently Operating On Solana Devnet
                    </p>
                    <p className="text-sm text-amber-900 font-medium text-center md:hidden">
                        Currently In Devnet Mode
                    </p>
                </div>
            </div>

            {/* Main Navbar - Sticky at top */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f3e1d7]/80 backdrop-blur-md border-b border-white-100 pt-8">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Brand / Logo */}
                        <components.NavbarBrand />

                        {/* Desktop Search */}
                        <components.NavbarDesktopSearch
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                        />

                        {/* Auth Section / Profile Dropdown */}
                        <components.NavbarAuthSection
                            authenticated={authenticated}
                            displayAddress={displayAddress || ""}
                            displayUsername={username || ""}
                            usdcBalance={usdcBalance}
                            isDropdownOpen={isDropdownOpen}
                            onAuth={handleAuth}
                            onCloseDropdown={() => setIsDropdownOpen(false)}
                            onLogout={handleLogout}
                            onMouseEnterDropdown={() => setIsDropdownOpen(true)}
                            onMouseLeaveDropdown={() => setIsDropdownOpen(false)}
                            onOpenDeposit={() => setIsDepositModalOpen(true)}
                            profileHref={profileHref}
                        />
                    </div>
                </div>

                {/* Navigation Links - Second Row */}
                <components.NavbarNavLinks isActive={isActive} />
            </nav>

            {/* Spacer for fixed navbar */}
            <div className="h-[88px] md:h-[128px]" />

            {/* Click outside to close dropdown */}
            {isDropdownOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}

            {/* Profile Edit Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setIsProfileModalOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-md bg-[#f3e1d7] rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Edit Profile
                                </h2>
                                <button
                                    onClick={() =>
                                        setIsProfileModalOpen(false)
                                    }
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors"
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={editUsername}
                                        onChange={(e) =>
                                            setEditUsername(e.target.value)
                                        }
                                        className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                                        placeholder="Enter username"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Invite Code
                                    </label>
                                    <input
                                        type="text"
                                        value={editInviteCode}
                                        onChange={(e) =>
                                            setEditInviteCode(e.target.value)
                                        }
                                        className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent uppercase"
                                        placeholder="Enter invite code"
                                        maxLength={10}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Profile Character
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                            <img
                                                src={`/profiles/${editProfileIndex + 1
                                                    }.svg`}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button
                                            onClick={randomizeProfile}
                                            className="px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                                        >
                                            Randomize
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsProfileModalOpen(false);
                                    }}
                                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Deposit Modal */}
            <DepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
            />

            {/* Mobile Bottom Navigation - Fixed at bottom */}
            <components.NavbarMobileBottomNav
                isActive={isActive}
                profileHref={profileHref}
            />
        </>
    );
}