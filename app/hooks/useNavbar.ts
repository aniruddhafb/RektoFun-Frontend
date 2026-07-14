'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppKitAccount, useAppKit, useDisconnect } from '@reown/appkit/react';
import { useUserStore } from '@/app/store/useUserStore';
import { createUser, getUserByPubkey } from '@/app/lib/users-service/users';
import { getDiceBearAvatarUrl } from '@/app/lib/profile-avatar';
import { User } from '@/app/lib/users-service/users';
import { fetchRektoBalance, fetchUsdcBalance as fetchUsdcTokenBalance } from '@/app/lib/token-balances';
import { clearPendingReferralCode, getPendingReferralCode } from '@/app/lib/referral-attribution';
import { CHALLENGE_CREATED_EVENT } from '@/app/lib/realtime-events';

export function useNavbar() {
  // AppKit hooks
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();

  // Store and routing
  const { user: storeUser, setUser, clearUser } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [fundsModalMode, setFundsModalMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // User data
  const [userProfileData, setUserProfileData] = useState<{ username: string; profileImage: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initializedAddress, setInitializedAddress] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [rektoBalance, setRektoBalance] = useState<number | null>(null);

  const createRandomUsername = (walletAddress: string) => {
    const adjectives = ['Lucky', 'Brave', 'Swift', 'Cosmic', 'Rekto', 'Mighty', 'Sunny', 'Wild'];
    const nouns = ['Bull', 'Bear', 'Fox', 'Whale', 'Tiger', 'Degen', 'Otter', 'Falcon'];
    const randomItem = (items: string[]) => items[Math.floor(Math.random() * items.length)];
    const walletSuffix = walletAddress.slice(-6);
    return `${randomItem(adjectives)}${randomItem(nouns)}${walletSuffix}`;
  };

  // Helper: Sync user state
  const applyUserToState = (userData: User) => {
    setCurrentUser(userData);
    setUser(userData);
    setUserProfileData({
      username: userData.username || 'User',
      profileImage: userData.profile_image || '',
    });
  };

  // Helper: Format wallet address
  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const displayUsername = userProfileData?.username || displayAddress || 'User';

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    if (!isConnected || !address) return null;

    try {
      const userData = await getUserByPubkey(address);
      applyUserToState(userData);
      return userData;
    } catch (error) {
      console.error('[Navbar] Failed to fetch user profile:', error);
      return null;
    }
  };


  // Fetch tracked asset balances
  const fetchUsdcBalance = async () => {
    if (!address || !isConnected) {
      setUsdcBalance(null);
      setRektoBalance(null);
      return;
    }

    try {
      const [usdc, rekto] = await Promise.all([
        fetchUsdcTokenBalance(address).catch(() => 0),
        fetchRektoBalance(address).catch(() => 0),
      ]);
      setUsdcBalance(usdc);
      setRektoBalance(rekto);
    } catch {
      setUsdcBalance(0);
    }
  };

  useEffect(() => {
    fetchUsdcBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  useEffect(() => {
    const refreshBalances = () => {
      void fetchUsdcBalance();
    };

    window.addEventListener(CHALLENGE_CREATED_EVENT, refreshBalances);
    return () => window.removeEventListener(CHALLENGE_CREATED_EVENT, refreshBalances);
    // The event handler should always use the wallet values from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  // Sync store user when it changes
  useEffect(() => {
    if (storeUser && (!address || address === storeUser.pubkey)) {
      setCurrentUser(storeUser);
      setUserProfileData({
        username: storeUser.username || 'User',
        profileImage: storeUser.profile_image || '',
      });
    }
  }, [storeUser, address]);

  // Initialize user on wallet connect - creates the user if their pubkey is
  // new, or fetches the existing one if it already exists
  useEffect(() => {
    if (!isConnected || !address || initializedAddress === address) return;

    const initUser = async () => {
      try {
        const userData = await getUserByPubkey(address);
        applyUserToState(userData);
        clearPendingReferralCode();
      } catch (error) {
        console.info('[Navbar] No account found; creating a generated profile.', error);
        try {
          const pendingReferralCode = getPendingReferralCode();
          const userData = await createUser({
            pubkey: address,
            username: createRandomUsername(address),
            profile_image: getDiceBearAvatarUrl(),
            referrer_code: pendingReferralCode || undefined,
          });
          applyUserToState(userData);
          clearPendingReferralCode();
        } catch (createError) {
          console.error('[Navbar] Automatic account creation failed:', createError);
        }
      } finally {
        setInitializedAddress(address);
      }
    };

    initUser();
  }, [isConnected, address, initializedAddress]);

  // Detect mobile viewport
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    const openSettings = () => setIsSettingsModalOpen(true);
    const openEditProfile = () => setIsEditProfileModalOpen(true);
    const openDeposit = () => {
      setFundsModalMode('deposit');
      setIsDepositModalOpen(true);
    };
    window.addEventListener('rektofun:open-settings', openSettings);
    window.addEventListener('rektofun:open-edit-profile', openEditProfile);
    window.addEventListener('rektofun:open-deposit', openDeposit);
    return () => {
      window.removeEventListener('rektofun:open-settings', openSettings);
      window.removeEventListener('rektofun:open-edit-profile', openEditProfile);
      window.removeEventListener('rektofun:open-deposit', openDeposit);
    };
  }, []);

  // Check if route is active
  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const profileHref = address ? `/profile/${address}` : '/';

  // Handle mobile create challenge
  const handleMobileCreateClick = () => {
    if (pathname === '/challenges') {
      const params = new URLSearchParams(window.location.search);
      params.delete('challengeId');
      params.set('create', '1');
      router.replace(pathname + (params.toString() ? `?${params.toString()}` : ''), { scroll: false });
    } else {
      router.push('/challenges?create=1');
    }
  };

  // Handle wallet connection
  const handleConnect = () => open({ view: 'Connect' });

  // Handle logout
  const handleLogout = () => {
    setInitializedAddress(null);
    setCurrentUser(null);
    setUserProfileData(null);
    clearUser();
    disconnect();
  };

  return {
    // UI state
    searchQuery,
    setSearchQuery,
    isSearchModalOpen,
    setIsSearchModalOpen,
    isDropdownOpen,
    setIsDropdownOpen,
    isDepositModalOpen,
    setIsDepositModalOpen,
    fundsModalMode,
    setFundsModalMode,
    isReferralModalOpen,
    setIsReferralModalOpen,
    isEditProfileModalOpen,
    setIsEditProfileModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    isMobileViewport,

    // User data
    userProfileData,
    currentUser,
    displayAddress,
    displayUsername,
    usdcBalance,
    rektoBalance,
    fetchUsdcBalance,

    // Connection state
    address,
    isConnected,

    // Handlers
    handleConnect,
    handleLogout,
    handleMobileCreateClick,
    fetchUserProfile,
    applyUserToState,
    isActive,
    profileHref,
  };
}
