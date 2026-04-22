"use client";

import { useState, useEffect, useCallback } from "react";
import { useSolanaWallet } from "../lib/useSolanaWallet";
import {
  buildAcceptChallengeTx,
  fetchAllChallenges,
  lamportsToSol,
  type OnChainChallenge,
} from "../lib/rektofun-program";
import { ChallengeHeader } from "./sections/ChallengeHeader";
import { ChallengeFiltersSection } from "./sections/ChallengeFiltersSection";
import { FeedbackBanner } from "./sections/FeedbackBanner";
import { ChallengeGrid } from "./sections/ChallengeGrid";
import { RektLoadingOverlay } from "../components/RektLoadingOverlay";
import { CreateChallengeModal } from "./sections/CreateChallengeModal";

export default function ChallengesPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeAsset, setActiveAsset] = useState("All Assets");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [challenges, setChallenges] = useState<OnChainChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rektTarget, setRektTarget] = useState<OnChainChallenge | null>(null);
  const [rektTxSig, setRektTxSig] = useState<string | null>(null);
  const [rektError, setRektError] = useState<string | null>(null);
  const [isRekting, setIsRekting] = useState(false);

  const { authenticated, login, program, sendTransaction, publicKey } = useSolanaWallet();

  const loadChallenges = async () => {
    if (!program) return;
    setIsLoading(true);
    try {
      const data = await fetchAllChallenges(program);
      setChallenges(data);
    } catch (err) {
      console.error("Failed to load challenges:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadChallenges();
  }, []);

  async function handleRekt(challenge: OnChainChallenge) {
    if (!authenticated) { login(); return; }
    if (!program || !publicKey) { setRektError("Wallet not ready"); return; }

    setRektTarget(challenge);
    setRektError(null);
    setRektTxSig(null);
    setIsRekting(true);

    try {
      const tx = await buildAcceptChallengeTx(program, publicKey, challenge.publicKey, challenge.creator);
      const sig = await sendTransaction(tx);
      setRektTxSig(sig);
      await loadChallenges();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRektError(msg);
    } finally {
      setIsRekting(false);
    }
  }

  const filtered = challenges.filter((c) => {
    if (activeAsset !== "All Assets" && c.asset !== activeAsset) return false;
    if (activeFilter === "Active") return c.status === "Active";
    if (activeFilter === "My Bets" && publicKey)
      return c.creator.equals(publicKey) || c.challenger.equals(publicKey);
    if (activeFilter === "High Stakes") return lamportsToSol(c.betAmount) >= 1;
    if (activeFilter === "Ending Soon") {
      const diff = c.expiresAt - Math.floor(Date.now() / 1000);
      return diff > 0 && diff < 3600;
    }
    return true;
  });

  return (
    <div className="min-h-full">
      <ChallengeHeader onOpenModal={() => setIsModalOpen(true)} />

      <ChallengeFiltersSection
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        activeAsset={activeAsset}
        setActiveAsset={setActiveAsset}
      />

      <FeedbackBanner
        rektTxSig={rektTxSig}
        rektError={rektError}
        targetCreator={rektTarget?.creator ?? null}
      />

      <ChallengeGrid
        challenges={filtered}
        onRekt={handleRekt}
        isLoading={isLoading}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <RektLoadingOverlay isLoading={isRekting} />

      <CreateChallengeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={loadChallenges}
      />
    </div>
  );
}