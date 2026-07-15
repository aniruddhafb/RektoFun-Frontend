"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useState } from "react";
import { ChallengeHeader } from "../components/challenge-components/ChallengeHeader";
import { ChallengeFiltersSection } from "../components/challenge-components/ChallengeFiltersSection";
import { FeedbackBanner } from "../components/challenge-components/FeedbackBanner";
import { ChallengeGrid } from "../components/challenge-components/ChallengeGrid";
import { RektLoadingOverlay } from "../components/RektLoadingOverlay";
import { CreateChallengeModal } from "../components/challenge-components/CreateChallengeModal";
import { Challenge, getChallengeById } from "../lib/challenges-service/challenges";
import ChallengeDetailModal from "../components/challenge-components/ChallengeDetailModal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CHALLENGE_UPDATED_EVENT, type ChallengeUpdatedDetail } from "../lib/realtime-events";
import { RefreshCw } from "lucide-react";

const BOOKMARKS_STORAGE_KEY = "rektofun:challenge-bookmarks";

function ChallengesPageContent() {

  const CREATE_TOAST_DURATION_MS = 3000;
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    [bookmarkedChallengeIds],
  );

  
  // Handle challenge card click
  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsDetailModalOpen(true);
    router.replace(`${pathname}?challengeId=${encodeURIComponent(challenge.id)}`, { scroll: false });
  };

  // Close detail modal handler
  const closeDetailModal = () => {
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

  const handleRefreshChallenges = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleRefreshComplete = useCallback(() => {
    setIsRefreshing(false);
  }, []);


  useEffect(() => {
    const refreshSelectedChallenge = (event: Event) => {
      const { challengeId } = (event as CustomEvent<ChallengeUpdatedDetail>).detail;
      if (selectedChallenge?.id !== challengeId) return;

      getChallengeById(challengeId)
        .then(setSelectedChallenge)
        .catch((error) => console.error("Failed to refresh open challenge:", error));
    };

    window.addEventListener(CHALLENGE_UPDATED_EVENT, refreshSelectedChallenge);
    return () => window.removeEventListener(CHALLENGE_UPDATED_EVENT, refreshSelectedChallenge);
  }, [selectedChallenge?.id]);

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
    const challengeId = searchParams.get("challengeId");
    if (!challengeId) return;

    const numericChallengeId = Number(challengeId);
    if (!Number.isInteger(numericChallengeId) || numericChallengeId <= 0) return;

    let cancelled = false;
    getChallengeById(numericChallengeId)
      .then((challenge) => {
        if (cancelled) return;
        setSelectedChallenge(challenge);
        setIsDetailModalOpen(true);
      })
      .catch((challengeError) => {
        console.error("Failed to open shared challenge:", challengeError);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    const shouldOpenCreateModal = searchParams.get("create") === "1";
    if (!shouldOpenCreateModal) return;

    window.setTimeout(() => {
      setIsDetailModalOpen(false);
      setSelectedChallenge(null);
      setIsCreateModalOpen(true);
    }, 0);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("create");
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-[#f3e1d7] pb-10 sm:pb-16">
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

      <div className="mx-auto flex max-w-7xl justify-end px-6 pb-3 lg:px-8">
        <button
          type="button"
          onClick={handleRefreshChallenges}
          disabled={isRefreshing}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-3 text-xs font-black uppercase tracking-[0.06em] text-black transition-colors hover:bg-[#f5d547] disabled:cursor-wait disabled:bg-[#f7efe9] disabled:text-black/55"
          aria-label="Refresh challenges"
          aria-live="polite"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} strokeWidth={2.7} />
          {isRefreshing ? "Refreshing" : "Refresh"}
        </button>
      </div>

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
        onRefreshComplete={handleRefreshComplete}
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
