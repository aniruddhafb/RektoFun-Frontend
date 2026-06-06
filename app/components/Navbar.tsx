"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePathname, useRouter } from "next/navigation";
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
    const [fundsModalMode, setFundsModalMode] = useState<"deposit" | "withdraw">("deposit");
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
    const hasRandomizedUsernameOnFirstProfileOpenRef = useRef(false);
    const inFlightProfileFetchRef = useRef<Map<string, Promise<User>>>(new Map());
    const pathname = usePathname();
    const router = useRouter();
    const inviteCodeFromUrl = useMemo(() => {
        if (typeof window === "undefined") return "";
        return new URLSearchParams(window.location.search).get("ref") || "";
    }, [pathname]);

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
                const isFirstProfileModalOpen = !hasRandomizedUsernameOnFirstProfileOpenRef.current;
                try {
                    const existingUser = (
                        currentUser && walletAddress && latestFetchedWalletRef.current === walletAddress
                            ? currentUser
                            : await fetchUserProfileData({ force: true })
                    );
                    if (!existingUser) {
                        throw new Error("User not found");
                    }
                    if (isFirstProfileModalOpen) {
                        generateRandomUsername();
                        hasRandomizedUsernameOnFirstProfileOpenRef.current = true;
                    } else {
                        setEditUsername(existingUser.username || username || "");
                    }
                    setEditBio(existingUser.description || "");
                    setEditProfileIndex(existingUser.profile_image ? parseInt(existingUser.profile_image.match(/profiles\/(\d+)\.svg/)?.[1] || '1') - 1 : 0);
                } catch (error) {
                    console.error('[Navbar] Could not fetch existing user data:', error);
                    if (isFirstProfileModalOpen) {
                        generateRandomUsername();
                        hasRandomizedUsernameOnFirstProfileOpenRef.current = true;
                    } else {
                        setEditUsername(username || "");
                    }
                }
                // Pre-fill invite code from URL if available
                setEditInviteCode(inviteCodeFromUrl || "");
                setProfileFormError(null);
            }
        };
        fetchUserData();
    }, [isProfileModalOpen, username, inviteCodeFromUrl, publicKey, currentUser, walletAddress, fetchUserProfileData, generateRandomUsername]);

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

    useEffect(() => {
        if (!isProfileModalOpen) return;

        const blockEscapeClose = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        window.addEventListener("keydown", blockEscapeClose, true);
        return () => window.removeEventListener("keydown", blockEscapeClose, true);
    }, [isProfileModalOpen]);

    useEffect(() => {
        if (!isProfileModalOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isProfileModalOpen]);

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

    const handleMobileCreateClick = useCallback(() => {
        if (pathname === "/challenges") {
            const params = new URLSearchParams(window.location.search);
            params.set("create", "1");
            const nextQuery = params.toString();
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
            return;
        }

        router.push("/challenges?create=1");
    }, [pathname, router]);

    return (
        <>
            {/* Development Mode Banner */}
            <div className="fixed top-0 left-0 right-0 z-[30] border-b-2 border-black bg-[#f5d547]">
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
                    <p className="text-sm text-black font-black text-center hidden md:block">
                        Devnet Mode — We Are Currently Operating On Solana Devnet
                    </p>
                    <p className="text-sm text-black font-black text-center md:hidden">
                        Currently In Devnet Mode
                    </p>
                </div>
            </div>

            {/* Main Navbar - Sticky at top */}
            <nav className="fixed top-8 left-0 right-0 z-[40] bg-[#f3e1d7]/95 shadow-[0_2px_0_#111] backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            onOpenDeposit={() => {
                                setFundsModalMode("deposit");
                                setIsDepositModalOpen(true);
                            }}
                            onOpenWithdraw={() => {
                                setFundsModalMode("withdraw");
                                setIsDepositModalOpen(true);
                            }}
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

            <components.CreateProfileModal
                isOpen={isProfileModalOpen}
                editProfileIndex={editProfileIndex}
                editUsername={editUsername}
                editBio={editBio}
                editInviteCode={editInviteCode}
                profileFormError={profileFormError}
                onRandomizeProfile={randomizeProfile}
                onRandomizeUsername={generateRandomUsername}
                onEditUsernameChange={(value) => {
                    setEditUsername(value);
                    if (profileFormError) setProfileFormError(null);
                }}
                onEditBioChange={(value) => {
                    setEditBio(value);
                    if (profileFormError) setProfileFormError(null);
                }}
                onEditInviteCodeChange={setEditInviteCode}
                onSubmit={handleProfileSubmit}
            />

            {/* Deposit Modal */}
            {isDepositModalOpen && (
                <DepositModal
                    isOpen={isDepositModalOpen}
                    onClose={() => setIsDepositModalOpen(false)}
                    initialMode={fundsModalMode}
                />
            )}

            {/* Mobile Bottom Navigation - Fixed at bottom */}
            <components.NavbarMobileBottomNav
                isActive={isActive}
                profileHref={profileHref}
                onSearchClick={() => setIsSearchModalOpen(true)}
                onCreateClick={handleMobileCreateClick}
                isSearchOpen={isSearchModalOpen}
            />
        </>
    );
}
