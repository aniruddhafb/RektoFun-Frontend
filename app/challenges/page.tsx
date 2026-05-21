"use client";

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from "react";
import { ChallengeHeader } from "../components/challenge-components/ChallengeHeader";
import { ChallengeFiltersSection } from "../components/challenge-components/ChallengeFiltersSection";
import { FeedbackBanner } from "../components/challenge-components/FeedbackBanner";
import { ChallengeGrid } from "../components/challenge-components/ChallengeGrid";
import { RektLoadingOverlay } from "../components/RektLoadingOverlay";
import { CreateChallengeModal } from "../components/challenge-components/CreateChallengeModal";
import { ChallengeListItem } from "../lib/challenges-service/challenges";
import ChallengeDetailModal from "../components/challenge-components/ChallengeDetailModal";
import { usePathname, useRouter } from "next/navigation";
import { getMarkets } from "../lib/markets-service/market";

function ChallengesContent() {
  const CREATE_TOAST_DURATION_MS = 3000;
  const BOOKMARKS_STORAGE_KEY = "rektofun:challenge-bookmarks";
  const [activeFilter, setActiveFilter] = useState("Latest");
  const [activeAsset, setActiveAsset] = useState("All Markets");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rektTarget, setRektTarget] = useState<ChallengeListItem | null>(null);
  const [rektTxSig, setRektTxSig] = useState<string | null>(null);
  const [rektError, setRektError] = useState<string | null>(null);
  const [isRekting, setIsRekting] = useState(false);
  const [ignoreDeepLink, setIgnoreDeepLink] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateSuccessToast, setShowCreateSuccessToast] = useState(false);
  const [createToastProgress, setCreateToastProgress] = useState(100);
  const [marketOptions, setMarketOptions] = useState<string[]>(["All Markets"]);
  const [bookmarkedChallengeIds, setBookmarkedChallengeIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const rawBookmarks = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (!rawBookmarks) return [];
      const parsed = JSON.parse(rawBookmarks);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((value): value is string => typeof value === "string");
    } catch (error) {
      console.error("Failed to read challenge bookmarks from localStorage:", error);
      return [];
    }
  });
  const router = useRouter();
  const pathname = usePathname();
  const lastClosedDeepLinkIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedChallengeIds));
    } catch (error) {
      console.error("Failed to persist challenge bookmarks to localStorage:", error);
    }
  }, [bookmarkedChallengeIds]);

  const toggleBookmark = useCallback((challengeId: string) => {
    setBookmarkedChallengeIds((prev) =>
      prev.includes(challengeId)
        ? prev.filter((id) => id !== challengeId)
        : [...prev, challengeId]
    );
  }, []);

  const isChallengeBookmarked = useCallback(
    (challengeId: string) => bookmarkedChallengeIds.includes(challengeId),
    [bookmarkedChallengeIds]
  );

  // Handle challenge card click
  const handleChallengeClick = (challenge: ChallengeListItem) => {
    setSelectedChallenge(challenge);
    setIsDetailModalOpen(true);
    router.replace(`${pathname}?challengeId=${encodeURIComponent(challenge.id)}`, { scroll: false });
  };

  // Close detail modal handler
  const closeDetailModal = () => {
    setIgnoreDeepLink(true);

    const activeDeepLinkId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("challengeId")
        : null;
    if (activeDeepLinkId) {
      lastClosedDeepLinkIdRef.current = activeDeepLinkId;
    }

    const nextParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams();
    nextParams.delete("challengeId");
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    router.replace(nextUrl, { scroll: false });
    setIsDetailModalOpen(false);
    setSelectedChallenge(null);

    window.setTimeout(() => setIgnoreDeepLink(false), 200);
  };

  const handleChallengesLoaded = useCallback((loadedChallenges: ChallengeListItem[]) => {
    setChallenges(loadedChallenges);
  }, []);

  useEffect(() => {
    // If we are intentionally ignoring deep link handling (e.g., during manual close), skip.
    if (ignoreDeepLink) return;

    if (typeof window === "undefined") return;
    const deepLinkChallengeId = new URLSearchParams(window.location.search).get("challengeId");
    if (!deepLinkChallengeId) {
      lastClosedDeepLinkIdRef.current = null;
      return;
    }
    if (deepLinkChallengeId === lastClosedDeepLinkIdRef.current) return;
    if (challenges.length === 0) return;

    const matchedChallenge = challenges.find((challenge) => challenge.id === deepLinkChallengeId);
    if (!matchedChallenge) return;
    if (isDetailModalOpen && selectedChallenge?.id === matchedChallenge.id) return;

    setSelectedChallenge(matchedChallenge);
    setIsDetailModalOpen(true);
  }, [challenges, isDetailModalOpen, pathname, selectedChallenge?.id, ignoreDeepLink]);

  async function handleRekt(challenge: ChallengeListItem) {
    setRektTarget(challenge);
    setRektError(null);
    setRektTxSig(null);
    setIsRekting(true);

    // Simulate transaction
    await new Promise(resolve => setTimeout(resolve, 1500));

    setRektTxSig("simulated_tx_signature_" + Date.now());
    setIsRekting(false);
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleChallengeCreated = () => {
    setIsCreateModalOpen(false);
    setRefreshKey((prev) => prev + 1);
    setCreateToastProgress(100);
    setShowCreateSuccessToast(true);
  };

  useEffect(() => {
    let isMounted = true;
    const loadMarketOptions = async () => {
      try {
        const response = await getMarkets({ is_active: true, limit: 100, offset: 0 });
        if (!isMounted) return;
        const names = response.markets
          .map((market) => market.name)
          .filter((name): name is string => Boolean(name))
          .sort((a, b) => a.localeCompare(b));
        setMarketOptions(["All Markets", ...names]);
      } catch (error) {
        console.error("Failed to load market options:", error);
      }
    };

    loadMarketOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!showCreateSuccessToast) return;
    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const nextProgress = Math.max(0, 100 - (elapsed / CREATE_TOAST_DURATION_MS) * 100);
      setCreateToastProgress(nextProgress);
    }, 50);
    const timeout = window.setTimeout(() => {
      setShowCreateSuccessToast(false);
      setCreateToastProgress(100);
    }, CREATE_TOAST_DURATION_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [showCreateSuccessToast]);

  return (
    <div className="min-h-full">
      {showCreateSuccessToast && (
        <div className="fixed right-4 top-40 sm:top-40 z-[60] w-[min(92vw,24rem)] overflow-hidden rounded-xl border border-green-300 bg-green-600 text-white shadow-2xl">
          <button
            type="button"
            onClick={() => setShowCreateSuccessToast(false)}
            className="absolute right-3 top-2 text-lg leading-none text-green-100 transition hover:text-white"
            aria-label="Close success notification"
          >
            ×
          </button>
          <div className="px-5 pb-4 pt-4 pr-10">
            <p className="text-base font-semibold">Challenge created successfully</p>
            <p className="mt-1 text-sm text-green-100">Your challenge is now live and visible to everyone.</p>
          </div>
          <div className="h-1.5 w-full bg-green-500/60">
            <div
              className="h-full bg-white/90 transition-[width] duration-75 ease-linear"
              style={{ width: `${createToastProgress}%` }}
            />
          </div>
        </div>
      )}

      <ChallengeHeader onOpenModal={handleOpenCreateModal} />

      <ChallengeFiltersSection
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeAsset={activeAsset}
        setActiveAsset={setActiveAsset}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        marketOptions={marketOptions}
      />

      <FeedbackBanner
        rektTxSig={rektTxSig}
        rektError={rektError}
        targetCreator={rektTarget?.creator.wallet_address ? `${rektTarget.creator.wallet_address.slice(0, 6)}...` : null}
      />

      <ChallengeGrid
        onRekt={handleRekt}
        onClick={handleChallengeClick}
        onToggleBookmark={toggleBookmark}
        isBookmarked={isChallengeBookmarked}
        onOpenModal={() => setIsCreateModalOpen(true)}
        onChallengesLoaded={handleChallengesLoaded}
        refreshKey={refreshKey}
        activeFilter={activeFilter}
        activeAsset={activeAsset}
        searchQuery={searchQuery}
      />

      <RektLoadingOverlay isLoading={isRekting} />

      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleChallengeCreated}
      />

      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
      />
    </div>
  );
}

export default function ChallengesPage() {
  return <ChallengesContent />;
}

