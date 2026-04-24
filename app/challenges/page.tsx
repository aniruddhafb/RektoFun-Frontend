"use client";

import { useState } from "react";
import { ChallengeHeader } from "./sections/ChallengeHeader";
import { ChallengeFiltersSection } from "./sections/ChallengeFiltersSection";
import { FeedbackBanner } from "./sections/FeedbackBanner";
import { ChallengeGrid } from "./sections/ChallengeGrid";
import { RektLoadingOverlay } from "../components/RektLoadingOverlay";
import { CreateChallengeModal } from "./sections/CreateChallengeModal";
import { Challenge } from "../components/challengesData";
import ChallengeDetailModal from "../components/ChallengeDetailModal";

export default function ChallengesPage() {
  const [activeFilter, setActiveFilter] = useState("Expiring Soon");
  const [activeAsset, setActiveAsset] = useState("All Markets");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rektTarget, setRektTarget] = useState<Challenge | null>(null);
  const [rektTxSig, setRektTxSig] = useState<string | null>(null);
  const [rektError, setRektError] = useState<string | null>(null);
  const [isRekting, setIsRekting] = useState(false);

  // Handle challenge card click
  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsDetailModalOpen(true);
  };

  // Close detail modal handler
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => setSelectedChallenge(null), 300);
  };

  async function handleRekt(challenge: Challenge) {
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
        targetCreator={rektTarget?.creator.name ?? null}
      />

      <ChallengeGrid
        onRekt={handleRekt}
        onClick={handleChallengeClick}
        isLoading={isLoading}
        onOpenModal={() => setIsCreateModalOpen(true)}
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
