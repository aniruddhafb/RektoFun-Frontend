'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppKitAccount, useAppKit, useDisconnect } from '@reown/appkit/react';
import { useUserStore } from '@/app/store/useUserStore';
import { createUser, getUserByPubkey, checkUsernameExists } from '@/app/lib/users-service/users';
import { blockedContentError, hasBlockedContent } from '@/app/lib/content-moderation';
import { getDiceBearAvatarUrl } from '@/app/lib/profile-avatar';
import { User } from '@/app/lib/users-service/users';
import { fetchUsdcBalance as fetchUsdcTokenBalance } from '@/app/lib/token-balances';

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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  // Profile form state
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfileImageUrl, setEditProfileImageUrl] = useState(() => getDiceBearAvatarUrl('rektofun-default'));
  const [editInviteCode, setEditInviteCode] = useState('');
  const [profileFormError, setProfileFormError] = useState<string | null>(null);

  // User data
  const [userProfileData, setUserProfileData] = useState<{ username: string; profileImage: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

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
      const userData = await getUserByPubkey(address);
      applyUserToState(userData);
      return userData;
    } catch (error) {
      console.error('[Navbar] Failed to fetch user profile:', error);
      return null;
    }
  };


  // Fetch USDC balance
  const fetchUsdcBalance = async () => {
    if (!address || !isConnected) {
      setUsdcBalance(null);
      return;
    }

    try {
      const balance = await fetchUsdcTokenBalance(address);
      setUsdcBalance(balance);
    } catch {
      setUsdcBalance(0);
    }
  };

  useEffect(() => {
    fetchUsdcBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  // Randomize profile avatar
  const randomizeProfile = () => {
    setEditProfileImageUrl(getDiceBearAvatarUrl());
  };

  // Handle profile form submission
  const handleProfileSubmit = async () => {
    if (!address) return;
    const trimmedUsername = editUsername.trim();
    if (hasBlockedContent(trimmedUsername)) {
      setProfileFormError(blockedContentError('Username'));
      return;
    }
    if (hasBlockedContent(editBio)) {
      setProfileFormError(blockedContentError('Bio'));
      return;
    }
    const trimmedEmail = editEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setProfileFormError('Please enter a valid email address.');
      return;
    }

    try {
      if (trimmedUsername && trimmedUsername !== currentUser?.username) {
        const usernameTaken = await checkUsernameExists(trimmedUsername);
        if (usernameTaken) {
          setProfileFormError('Username is already taken. Please choose another.');
          return;
        }
      }
      
      console.log("user data", {
        trimmedUsername,
        address,
        editBio: editBio.trim(),
        profileImage: editProfileImageUrl,
      });
      const userData = await createUser({
        pubkey: address,
        username: trimmedUsername,
        email: trimmedEmail || undefined,
        bio: editBio.trim(),
        profile_image: editProfileImageUrl,
        referrer_code: editInviteCode.trim() || undefined,
      });

      applyUserToState(userData);
      setProfileFormError(null);
      setIsProfileModalOpen(false);
    } catch (error) {
      console.error('[Navbar] Profile submit failed:', error);
      setProfileFormError('Failed to save profile. Please try again.');
    }
  };

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
    if (!isConnected || !address || hasInitialized) return;

    const initUser = async () => {
      try {
        const userData = await getUserByPubkey(address);
        applyUserToState(userData);

      } catch (error) {

        setIsProfileModalOpen(true);
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
          setEditEmail(user.email || '');
          setEditBio(user.description || '');
          setEditProfileImageUrl(user.profile_image || getDiceBearAvatarUrl());
        } else {
          setEditProfileImageUrl(getDiceBearAvatarUrl());
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
    isReferralModalOpen,
    setIsReferralModalOpen,
    isMobileViewport,

    // Profile form state
    editUsername,
    setEditUsername,
    editEmail,
    setEditEmail,
    editBio,
    setEditBio,
    editProfileImageUrl,
    setEditProfileImageUrl,
    editInviteCode,
    setEditInviteCode,
    profileFormError,
    setProfileFormError,

    // User data
    userProfileData,
    currentUser,
    displayAddress,
    displayUsername,
    usdcBalance,
    fetchUsdcBalance,

    // Connection state
    address,
    isConnected,

    // Handlers
    handleProfileSubmit,
    randomizeProfile,
    handleConnect,
    handleLogout,
    handleMobileCreateClick,
    fetchUserProfile,
    isActive,
    profileHref,
  };
}
