'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppKitAccount, useAppKit, useDisconnect } from '@reown/appkit/react';
import { useUserStore } from '@/app/store/useUserStore';
import { blockedContentError, hasBlockedContent } from '@/app/lib/content-moderation';
import { ensureUserByWallet, updateUser, getUserByWallet, acceptReferral, User } from '@/app/lib/users-service/users';

export function useNavbar() {
  // AppKit hooks
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();

  // Store and routing
  const { user: storeUser, setUser, updateUser: updateStoreUser, clearUser } = useUserStore();
  const pathname = usePathname();
  const router = useRouter();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [fundsModalMode, setFundsModalMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Profile form state
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfileIndex, setEditProfileIndex] = useState(0);
  const [editInviteCode, setEditInviteCode] = useState('');
  const [profileFormError, setProfileFormError] = useState<string | null>(null);

  // User data
  const [userProfileData, setUserProfileData] = useState<{ username: string; profileImage: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Helper: Get URL referral code
  const getRefCodeFromUrl = () => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('ref') || '';
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
      const userData = await getUserByWallet(address);
      applyUserToState(userData);
      return userData;
    } catch (error) {
      console.error('[Navbar] Failed to fetch user profile:', error);
      return null;
    }
  };

  // Generate random username
  const generateRandomUsername = () => {
    const gamerPartsA = ['void', 'rift', 'hex', 'nova', 'drift', 'glitch', 'crypt', 'blitz', 'shadow', 'pixel', 'frost', 'vortex', 'phantom', 'neon', 'omega'];
    const gamerPartsB = ['reaper', 'sniper', 'raider', 'byte', 'wraith', 'core', 'slayer', 'runner', 'forge', 'venom', 'spark', 'quake', 'drone', 'spike', 'nexus'];
    const joiners = ['', '', '_', 'x', 'z', 'q'];

    const partA = gamerPartsA[Math.floor(Math.random() * gamerPartsA.length)];
    const partB = gamerPartsB[Math.floor(Math.random() * gamerPartsB.length)];
    const joiner = joiners[Math.floor(Math.random() * joiners.length)];
    const uniq = `${Date.now().toString(36).slice(-3)}${Math.random().toString(36).slice(2, 4)}`;
    const username = `${partA}${joiner}${partB}${uniq}`.slice(0, 18);

    setEditUsername(username);
    if (profileFormError) setProfileFormError(null);
  };

  // Randomize profile avatar
  const randomizeProfile = () => {
    const randomIndex = Math.floor(Math.random() * 31);
    setEditProfileIndex(randomIndex);
  };

  // Handle profile form submission
  const handleProfileSubmit = async () => {
    if (!address) return;

    // Validate content
    if (hasBlockedContent(editUsername)) {
      setProfileFormError(blockedContentError('Username'));
      return;
    }
    if (hasBlockedContent(editBio)) {
      setProfileFormError(blockedContentError('Bio'));
      return;
    }

    try {
      // Get or create existing user
      let user = currentUser;
      if (!user) {
        user = await fetchUserProfile();
      }
      if (!user) return;

      // Update profile
      const profileIndex = editProfileIndex + 1;
      const updatedData = {
        username: editUsername,
        description: editBio,
        profile_image: `https://earningrecords.com/assets/rektofun/profiles/${profileIndex}.svg`,
      };
      await updateUser(user.id, updatedData);
      updateStoreUser(updatedData);

      // Handle referral code if present
      const refCode = editInviteCode || getRefCodeFromUrl();
      if (refCode) {
        try {
          await acceptReferral(address, refCode);
        } catch (error) {
          console.error('[Navbar] Referral failed:', error);
        }
      }

      setIsProfileModalOpen(false);
      await fetchUserProfile();
    } catch (error) {
      console.error('[Navbar] Profile update failed:', error);
    }
  };

  // Sync store user when it changes
  useEffect(() => {
    if (storeUser && (!address || address === storeUser.wallet_address)) {
      setCurrentUser(storeUser);
      setUserProfileData({
        username: storeUser.username || 'User',
        profileImage: storeUser.profile_image || '',
      });
    }
  }, [storeUser, address]);

  // Initialize new user on wallet connect
  useEffect(() => {
    if (!isConnected || !address || hasInitialized) return;

    const initUser = async () => {
      try {
        const userData = await ensureUserByWallet(address, {
          wallet_address: address,
          username: `user-${address.slice(0, 8)}`,
          login_type: 'wallet',
        });

        applyUserToState(userData);

        // Show profile modal for new users
        const isNewUser = userData.username === `user-${address.slice(0, 8)}`;
        if (isNewUser) {
          setIsProfileModalOpen(true);
          generateRandomUsername();
        }
      } catch (error) {
        console.error('[Navbar] User initialization failed:', error);
      } finally {
        setHasInitialized(true);
      }
    };

    initUser();
  }, [isConnected, address, hasInitialized]);

  // Handle profile modal open - load user data
  useEffect(() => {
    if (!isProfileModalOpen || !address) return;

    const initProfileModal = async () => {
      try {
        const user = currentUser || (await fetchUserProfile());
        if (user) {
          setEditUsername(user.username || '');
          setEditBio(user.description || '');
          setEditProfileIndex(user.profile_image ? parseInt(user.profile_image.match(/profiles\/(\d+)\.svg/)?.[1] || '1') - 1 : 0);
        }
      } catch (error) {
        console.error('[Navbar] Profile modal init failed:', error);
      }
      setEditInviteCode(getRefCodeFromUrl());
    };

    initProfileModal();
  }, [isProfileModalOpen, address]);

  // Detect mobile viewport
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();
    mediaQuery.addEventListener('change', syncViewport);
    return () => mediaQuery.removeEventListener('change', syncViewport);
  }, []);

  // Lock scroll when profile modal is open
  useEffect(() => {
    if (!isProfileModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const blockEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', blockEscape, true);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', blockEscape, true);
    };
  }, [isProfileModalOpen]);

  // Check if route is active
  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const profileHref = address ? `/profile/${address}` : '/settings';

  // Handle mobile create challenge
  const handleMobileCreateClick = () => {
    if (pathname === '/challenges') {
      const params = new URLSearchParams(window.location.search);
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
    setHasInitialized(false);
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
    isProfileModalOpen,
    setIsProfileModalOpen,
    isMobileViewport,

    // Profile form state
    editUsername,
    setEditUsername,
    editBio,
    setEditBio,
    editProfileIndex,
    setEditProfileIndex,
    editInviteCode,
    setEditInviteCode,
    profileFormError,
    setProfileFormError,

    // User data
    userProfileData,
    currentUser,
    displayAddress,
    displayUsername,

    // Connection state
    address,
    isConnected,

    // Handlers
    handleProfileSubmit,
    generateRandomUsername,
    randomizeProfile,
    handleConnect,
    handleLogout,
    handleMobileCreateClick,
    fetchUserProfile,
    isActive,
    profileHref,
  };
}
