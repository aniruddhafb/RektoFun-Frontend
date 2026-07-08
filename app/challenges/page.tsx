"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useRef, useState } from "react";
import { ChallengeHeader } from "../components/challenge-components/ChallengeHeader";
import { ChallengeFiltersSection } from "../components/challenge-components/ChallengeFiltersSection";
import { FeedbackBanner } from "../components/challenge-components/FeedbackBanner";
import { ChallengeGrid } from "../components/challenge-components/ChallengeGrid";
import { RektLoadingOverlay } from "../components/RektLoadingOverlay";
import { CreateChallengeModal } from "../components/challenge-components/CreateChallengeModal";
import { Challenge } from "../lib/challenges-service/challenges";
import ChallengeDetailModal from "../components/challenge-components/ChallengeDetailModal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function ChallengesPageContent() {

  const CREATE_TOAST_DURATION_MS = 3000;
  const BOOKMARKS_STORAGE_KEY = "rektofun:challenge-bookmarks";
  const [activeFilter, setActiveFilter] = useState("Latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [challenges, setChallenges] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [rektTarget, setRektTarget] = useState(null);
  const [rektTxSig, setRektTxSig] = useState<string | null>(null);
  const [rektError, setRektError] = useState<string | null>(null);
  const [isRekting, setIsRekting] = useState(false);
  const [ignoreDeepLink, setIgnoreDeepLink] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateSuccessToast, setShowCreateSuccessToast] = useState(false);
  const [createToastProgress, setCreateToastProgress] = useState(100);
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
  const handleChallengeClick = (challenge: Challenge) => {
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

  const handleChallengesLoaded = (loadedChallenges: Challenge[]) => {
    
  }



  async function handleRekt(challenge: Challenge) {
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
            x
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
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <FeedbackBanner
        rektTxSig={rektTxSig}
        rektError={rektError}
        targetCreator={null}
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
  return (
    <Suspense fallback={null}>
      <ChallengesPageContent />
    </Suspense>
  );
}
