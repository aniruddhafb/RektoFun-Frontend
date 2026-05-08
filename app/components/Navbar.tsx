"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePathname, useSearchParams } from "next/navigation";
import { DepositModal } from "./DepositModal";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import * as components from "./navbar-components";
import { ensureUserByWallet, updateUser, getUserByWallet, acceptReferral, User } from "@/app/lib/users-service/users";
import { useUserStore } from "@/app/store/useUserStore";
import { blockedContentError, hasBlockedContent } from "@/app/lib/content-moderation";

export default function Navbar() {
    const { user: storeUser, setUser, updateUser: updateStoreUser, clearUser } = useUserStore();
    const { login, authenticated, user, logout, ready } = usePrivy();
    const { publicKey, usdcBalance } = useSolanaWallet();
    const walletAddress = publicKey?.toBase58() ?? null;
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isMobileViewport, setIsMobileViewport] = useState(false);
    const [editUsername, setEditUsername] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editProfileIndex, setEditProfileIndex] = useState(0);
    const [editInviteCode, setEditInviteCode] = useState("");
    const [profileFormError, setProfileFormError] = useState<string | null>(null);
    const [hasCalledCreateUser, setHasCalledCreateUser] = useState(false);
    const [userProfileData, setUserProfileData] = useState<{ username: string; profileImage: string } | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const latestFetchedWalletRef = useRef<string | null>(null);
    const inFlightProfileFetchRef = useRef<Map<string, Promise<User>>>(new Map());
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const inviteCodeFromUrl = useMemo(() => searchParams.get("ref") || "", [searchParams]);

    const applyUserToNavbarState = useCallback((userData: User) => {
        setCurrentUser(userData);
        setUser(userData);
        setUserProfileData({
            username: userData.username || "User",
            profileImage: userData.profile_image || "",
        });
    }, [setCurrentUser, setUser, setUserProfileData]);

    const handleAuth = () => {
        login();
    };

    const handleLogout = () => {
        setHasCalledCreateUser(false);
        latestFetchedWalletRef.current = null;
        setCurrentUser(null);
        setUserProfileData(null);
        clearUser();
        logout();
    };

    const displayAddress = walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : null;

    // Get username from user object
    const getUsername = () => {
        if (!publicKey) return null;
        return (
            userProfileData?.username ||
            displayAddress ||
            "User"
        );
    };

    const username = getUsername();

    useEffect(() => {
        if (!storeUser) return;
        if (walletAddress && storeUser.wallet_address && storeUser.wallet_address !== walletAddress) {
            return;
        }

        setCurrentUser(storeUser);
        setUserProfileData({
            username: storeUser.username || "User",
            profileImage: storeUser.profile_image || "",
        });
    }, [storeUser, walletAddress]);

    // Fetch user profile data when authenticated
    const fetchUserProfileData = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
        if (!authenticated || !walletAddress) {
            latestFetchedWalletRef.current = null;
            setCurrentUser(null);
            setUserProfileData(null);
            return null;
        }

        if (!force && latestFetchedWalletRef.current === walletAddress && currentUser) {
            return currentUser;
        }

        const existingRequest = inFlightProfileFetchRef.current.get(walletAddress);
        if (existingRequest) {
            return existingRequest;
        }

        const request = getUserByWallet(walletAddress);
        inFlightProfileFetchRef.current.set(walletAddress, request);

        try {
            const userData = await request;
            latestFetchedWalletRef.current = walletAddress;
            applyUserToNavbarState(userData);
            return userData;
        } catch (error) {
            console.error('[Navbar] Could not fetch user profile data:', error);
            setCurrentUser(null);
            setUserProfileData(null);
            return null;
        } finally {
            inFlightProfileFetchRef.current.delete(walletAddress);
        }
    }, [
        authenticated,
        walletAddress,
        currentUser,
        applyUserToNavbarState,
        setCurrentUser,
        setUserProfileData,
    ]);

    // Randomize profile function
    const randomizeProfile = () => {
        const randomIndex = Math.floor(Math.random() * 31);
        setEditProfileIndex(randomIndex);
    };

    const generateRandomUsername = useCallback(() => {
        const gamerPartsA = [
            "void",
            "rift",
            "hex",
            "nova",
            "drift",
            "glitch",
            "crypt",
            "blitz",
            "shadow",
            "pixel",
            "frost",
            "vortex",
            "phantom",
            "neon",
            "omega",
        ];
        const gamerPartsB = [
            "reaper",
            "sniper",
            "raider",
            "byte",
            "wraith",
            "core",
            "slayer",
            "runner",
            "forge",
            "venom",
            "spark",
            "quake",
            "drone",
            "spike",
            "nexus",
        ];
        const joiners = ["", "", "_", "x", "z", "q"];

        const partA = gamerPartsA[Math.floor(Math.random() * gamerPartsA.length)];
        const partB = gamerPartsB[Math.floor(Math.random() * gamerPartsB.length)];
        const joiner = joiners[Math.floor(Math.random() * joiners.length)];

        // Timestamp + random chars makes collisions very unlikely.
        const uniq = `${Date.now().toString(36).slice(-3)}${Math.random().toString(36).slice(2, 4)}`;
        const rawUsername = `${partA}${joiner}${partB}${uniq}`;
        const nextUsername = rawUsername.slice(0, 18);

        setEditUsername(nextUsername);
        if (profileFormError) setProfileFormError(null);
    }, [profileFormError]);

    // Handle profile form submission
    const handleProfileSubmit = async () => {
        if (!publicKey) return;
        if (hasBlockedContent(editUsername)) {
            setProfileFormError(blockedContentError("Username"));
            return;
        }
        if (hasBlockedContent(editBio)) {
            setProfileFormError(blockedContentError("Bio"));
            return;
        }
        setProfileFormError(null);

        const profileIndex = editProfileIndex + 1;
        const referralCode = editInviteCode || inviteCodeFromUrl;

        try {
            let existingUser = currentUser;
            if (!existingUser) {
                existingUser = await fetchUserProfileData({ force: true });
            }

            if (!existingUser) {
                console.error('[Navbar] Could not load user before profile update');
                return;
            }

            // Update profile data
            const updatedData = {
                username: editUsername,
                description: editBio,
                profile_image: `https://earningrecords.com/assets/rektofun/profiles/${profileIndex}.svg`,
            };
            await updateUser(existingUser.id, updatedData);
            updateStoreUser(updatedData);

            // Handle referral if there's an invite code
            if (referralCode) {
                try {
                    await acceptReferral(publicKey.toBase58(), referralCode);
                } catch (referralError) {
                    console.error('[Navbar] Failed to accept referral:', referralError);
                }
            }
        } catch (error) {
            console.error('[Navbar] Failed to update profile:', error);
        }

        await fetchUserProfileData({ force: true });
        setIsProfileModalOpen(false);
    };

    // Initialize edit values when modal opens - fetch current user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (isProfileModalOpen && publicKey) {
                try {
                    const existingUser = (
                        currentUser && walletAddress && latestFetchedWalletRef.current === walletAddress
                            ? currentUser
                            : await fetchUserProfileData({ force: true })
                    );
                    if (!existingUser) {
                        throw new Error("User not found");
                    }
                    setEditUsername(existingUser.username || username || "");
                    setEditBio(existingUser.description || "");
                    setEditProfileIndex(existingUser.profile_image ? parseInt(existingUser.profile_image.match(/profiles\/(\d+)\.svg/)?.[1] || '1') - 1 : 0);
                } catch (error) {
                    console.error('[Navbar] Could not fetch existing user data:', error);
                    setEditUsername(username || "");
                }
                // Pre-fill invite code from URL if available
                setEditInviteCode(inviteCodeFromUrl || "");
                setProfileFormError(null);
            }
        };
        fetchUserData();
    }, [isProfileModalOpen, username, inviteCodeFromUrl, publicKey, currentUser, walletAddress, fetchUserProfileData]);

    // Ensure user exists when user authenticates (only once per session)
    useEffect(() => {
        const handleEnsureUser = async () => {
            // Wait forPrivy to be ready, user to be authenticated, and wallet to be connected
            if (!ready || !authenticated || !publicKey || hasCalledCreateUser) {
                return;
            }

            const currentWalletAddress = publicKey?.toBase58();
            if (!currentWalletAddress) {
                return;
            }

            try {
                const userData = await ensureUserByWallet(currentWalletAddress, {
                    wallet_address: currentWalletAddress,
                    username: `user-${currentWalletAddress.slice(0, 8)}`,
                    login_type: user?.email ? 'email' : 'wallet',
                });

                latestFetchedWalletRef.current = currentWalletAddress;
                applyUserToNavbarState(userData);

                // Check if this was a new user creation or existing user returned
                // New users have default username format "user-XXXXXXXX"
                const isNewUserCreated = userData.username === `user-${currentWalletAddress.slice(0, 8)}`;

                if (isNewUserCreated) {
                    // New user - show profile modal immediately
                    setIsProfileModalOpen(true);
                }
            } catch (error) {
                console.error('[Navbar] ensureUser error:', error);
            } finally {
                setHasCalledCreateUser(true);
            }
        };

        handleEnsureUser();
    }, [ready, authenticated, user, hasCalledCreateUser, publicKey, applyUserToNavbarState]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
        syncViewport();

        mediaQuery.addEventListener("change", syncViewport);
        return () => mediaQuery.removeEventListener("change", syncViewport);
    }, []);

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
            <div className="fixed top-0 left-0 right-0 z-[30] bg-amber-100 border-b border-amber-300">
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
            <nav className="fixed top-8 left-0 right-0 z-[40] bg-[#f3e1d7] border-b border-white-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Brand / Logo */}
                        <components.NavbarBrand />

                        {/* Desktop Search */}
                        <components.NavbarDesktopSearch
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            isModalOpen={isSearchModalOpen}
                            onOpenModal={() => setIsSearchModalOpen(true)}
                            onCloseModal={() => setIsSearchModalOpen(false)}
                        />

                        {/* Auth Section / Profile Dropdown */}
                        <components.NavbarAuthSection
                            authenticated={authenticated}
                            displayAddress={displayAddress || ""}
                            displayUsername={username || ""}
                            displayProfileImage={userProfileData?.profileImage || null}
                            usdcBalance={usdcBalance}
                            isDropdownOpen={isDropdownOpen}
                            onAuth={handleAuth}
                            onCloseDropdown={() => setIsDropdownOpen(false)}
                            onLogout={handleLogout}
                            onMouseEnterDropdown={() => setIsDropdownOpen(true)}
                            onMouseLeaveDropdown={() => setIsDropdownOpen(false)}
                            onToggleDropdown={() => setIsDropdownOpen((prev) => !prev)}
                            onOpenDeposit={() => setIsDepositModalOpen(true)}
                            profileHref={profileHref}
                            isMobileViewport={isMobileViewport}
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
                    className="fixed inset-0 z-[35]"
                    onClick={() => setIsDropdownOpen(false)}
                />
            )}

            {/* Profile Create Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setIsProfileModalOpen(false)}
                    />
                    <div className="relative z-10 w-full max-w-md bg-[#f3e1d7] rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Create Profile*
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Get started by creating a profile
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setIsProfileModalOpen(false)
                                    }
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

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Profile Character
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                            <img
                                                src={`https://earningrecords.com/assets/rektofun/profiles/${editProfileIndex + 1}.svg`}
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
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Username*
                                        </label>
                                        <button
                                            type="button"
                                            onClick={generateRandomUsername}
                                            className="px-3 py-1.5 bg-white/80 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white transition-colors"
                                        >
                                            Randomize
                                        </button>
                                    </div>
                                    <input
                                        maxLength={18}
                                        type="text"
                                        value={editUsername}
                                        onChange={(e) => {
                                            setEditUsername(e.target.value);
                                            if (profileFormError) setProfileFormError(null);
                                        }
                                        }
                                        className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent required"
                                        placeholder="Enter username"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Create a unique username</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bio*
                                    </label>
                                    <textarea
                                        maxLength={100}
                                        required
                                        value={editBio}
                                        onChange={(e) => {
                                            setEditBio(e.target.value);
                                            if (profileFormError) setProfileFormError(null);
                                        }
                                        }
                                        className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent required"
                                        placeholder="Write a short bio"
                                    />
                                </div>
                                {profileFormError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                        {profileFormError}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Invite Code (Optional)
                                    </label>
                                    <input
                                        maxLength={10}
                                        type="text"
                                        value={editInviteCode}
                                        onChange={(e) =>
                                            setEditInviteCode(e.target.value)
                                        }
                                        className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                                        placeholder="Enter invite code"
                                    />
                                </div>
                                <button
                                    onClick={handleProfileSubmit}
                                    disabled={!editUsername.trim() || !editBio.trim()}
                                    className="cursor-pointer w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Continue
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
                onSearchClick={() => setIsSearchModalOpen(true)}
            />
        </>
    );
}
