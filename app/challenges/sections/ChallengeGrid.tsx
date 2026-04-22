import { type OnChainChallenge } from "../../lib/rektofun-program";
import { ChallengeCard } from "../../components/ChallengeCard";

interface ChallengeGridProps {
  challenges: OnChainChallenge[];
  onRekt: (challenge: OnChainChallenge) => void;
  isLoading: boolean;
  onOpenModal: () => void;
}

export function ChallengeGrid({
  challenges,
  onRekt,
  isLoading,
  onOpenModal,
}: ChallengeGridProps) {
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        <div className="text-center py-16 text-gray-500">Loading on-chain challenges…</div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No challenges found on-chain yet.</p>
          <button
            onClick={onOpenModal}
            className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Be the first to create one!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.publicKey.toBase58()}
            challenge={challenge}
            onRekt={onRekt}
          />
        ))}
      </div>
    </div>
  );
}