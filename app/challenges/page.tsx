"use client";

import { useCallback, useEffect, useState } from "react";
import { ChallengeHeader } from "../components/challenge-components/ChallengeHeader";
import { ChallengeFiltersSection } from "../components/challenge-components/ChallengeFiltersSection";
import { FeedbackBanner } from "../components/challenge-components/FeedbackBanner";
import { ChallengeGrid } from "../components/challenge-components/ChallengeGrid";
import { RektLoadingOverlay } from "../components/RektLoadingOverlay";
import { CreateChallengeModal } from "../components/challenge-components/CreateChallengeModal";
import { ChallengeListItem } from "../lib/challenges-service/challenges";
import ChallengeDetailModal from "../components/challenge-components/ChallengeDetailModal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ChallengesPage() {
  const [activeFilter, setActiveFilter] = useState("Expiring Soon");
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Handle challenge card click
  const handleChallengeClick = (challenge: ChallengeListItem) => {
    setSelectedChallenge(challenge);
    setIsDetailModalOpen(true);
    router.replace(`${pathname}?challengeId=${encodeURIComponent(challenge.id)}`, { scroll: false });
  };

  // Close detail modal handler
  const closeDetailModal = () => {
    // Prevent deep link handling while manually closing the modal.
    setIgnoreDeepLink(true);
    // Replace URL to clear query param before state changes.
    router.replace(pathname, { scroll: false });
    // Close modal and clear selected challenge.
    setIsDetailModalOpen(false);
    setSelectedChallenge(null);
    // Reset ignore flag after short delay.
    setTimeout(() => setIgnoreDeepLink(false), 300);
  };

  const handleChallengesLoaded = useCallback((loadedChallenges: ChallengeListItem[]) => {
    setChallenges(loadedChallenges);
  }, []);

  useEffect(() => {
    // If we are intentionally ignoring deep link handling (e.g., during manual close), skip.
    if (ignoreDeepLink) return;

    const deepLinkChallengeId = searchParams.get("challengeId");
    if (!deepLinkChallengeId || challenges.length === 0) return;

    const matchedChallenge = challenges.find((challenge) => challenge.id === deepLinkChallengeId);
    if (!matchedChallenge) return;
    if (isDetailModalOpen && selectedChallenge?.id === matchedChallenge.id) return;

    setSelectedChallenge(matchedChallenge);
    setIsDetailModalOpen(true);
  }, [challenges, isDetailModalOpen, searchParams, selectedChallenge?.id, ignoreDeepLink]);

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

  return (
    <div className="min-h-full">
      <ChallengeHeader onOpenModal={handleOpenCreateModal} />

      <ChallengeFiltersSection
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeAsset={activeAsset}
        setActiveAsset={setActiveAsset}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <FeedbackBanner
        rektTxSig={rektTxSig}
        rektError={rektError}
        targetCreator={rektTarget?.creator.wallet_address ? `${rektTarget.creator.wallet_address.slice(0, 6)}...` : null}
      />

      <ChallengeGrid
        onRekt={handleRekt}
        onClick={handleChallengeClick}
        onOpenModal={() => setIsCreateModalOpen(true)}
        onChallengesLoaded={handleChallengesLoaded}
      />

      <RektLoadingOverlay isLoading={isRekting} />

      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => { }}
      />

      <ChallengeDetailModal
        challenge={selectedChallenge}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
      />
    </div>
  );
}
