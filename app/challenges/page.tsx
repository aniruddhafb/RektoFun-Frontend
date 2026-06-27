"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from "react";
import { ChallengeHeader } from "../components/challenge-components/ChallengeHeader";
import { ChallengeFiltersSection } from "../components/challenge-components/ChallengeFiltersSection";
import { FeedbackBanner } from "../components/challenge-components/FeedbackBanner";
import { ChallengeGrid } from "../components/challenge-components/ChallengeGrid";
import { RektLoadingOverlay } from "../components/RektLoadingOverlay";
import { CreateChallengeModal } from "../components/challenge-components/CreateChallengeModal";
import { ChallengeListItem } from "../lib/challenges-service/challenges";
import ChallengeDetailModal from "../components/challenge-components/ChallengeDetailModal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getMarkets } from "../lib/markets-service/market";

export default function ChallengesPage() {

  const CREATE_TOAST_DURATION_MS = 3000;
  const BOOKMARKS_STORAGE_KEY = "rektofun:challenge-bookmarks";
  const [activeFilter, setActiveFilter] = useState("Latest");
  const [activeAsset, setActiveAsset] = useState("All Markets");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
  const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
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
  const searchParams = useSearchParams();
  const lastClosedDeepLinkIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedChallengeIds));
    } catch (error) {
      console.error("Failed to persist challenge bookmarks to localStorage:", error);
    }
  }, []);

  const toggleBookmark = (challengeId: string) => {
    setBookmarkedChallengeIds((prev) =>
      prev.includes(challengeId)
        ? prev.filter((id) => id !== challengeId)
        : [...prev, challengeId]
    );
  }

  const isChallengeBookmarked = 
    (challengeId: string) => bookmarkedChallengeIds.includes(challengeId)


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

  const handleChallengesLoaded = (loadedChallenges: ChallengeListItem[]) => {
    setChallenges(loadedChallenges);
  }

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
  }, []);

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
  }, []);

  useEffect(() => {
    const shouldOpenCreateModal = searchParams.get("create") === "1";
    if (!shouldOpenCreateModal) return;

    setIsCreateModalOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("create");
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, []);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f3e1d7]">
      <div className="pointer-events-none absolute left-0 top-24 h-80 w-80 rounded-full bg-[#5ba8d8]/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-64 h-80 w-80 rounded-full bg-[#e85a2d]/15 blur-3xl" />
      {showCreateSuccessToast && (
        <div className="fixed right-4 top-40 sm:top-40 z-[60] w-[min(92vw,24rem)] overflow-hidden rounded-xl border border-[#8fbd46] bg-[#a8d85b] text-black shadow-xl">
          <button
            type="button"
            onClick={() => setShowCreateSuccessToast(false)}
            className="absolute right-3 top-2 text-lg font-black leading-none text-black transition hover:text-[#e85a2d]"
            aria-label="Close success notification"
          >
            ×
          </button>
          <div className="px-5 pb-4 pt-4 pr-10">
            <p className="text-base font-black">Challenge created successfully</p>
            <p className="mt-1 text-sm font-semibold text-black/75">Your challenge is now live and visible to everyone.</p>
          </div>
          <div className="h-1.5 w-full bg-black/20">
            <div
              className="h-full bg-black transition-[width] duration-75 ease-linear"
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


