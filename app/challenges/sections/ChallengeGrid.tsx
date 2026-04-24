import { ChallengeCard } from "../../components/ChallengeCard";
import { Challenge, DUMMY_CHALLENGES } from "../../components/challengesData";

interface ChallengeGridProps {
  onRekt: (challenge: Challenge) => void;
  onClick: (challenge: Challenge) => void;
  isLoading: boolean;
  onOpenModal: () => void;
}

export function ChallengeGrid({
  onRekt,
  onClick,
  isLoading,
  onOpenModal,
}: ChallengeGridProps) {
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        <div className="text-center py-16 text-gray-500">Loading challenges…</div>
      </div>
    );
  }

  const displayedChallenges = DUMMY_CHALLENGES;

  if (displayedChallenges.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No challenges found yet.</p>
          <button
            onClick={onOpenModal}
            className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-white/50 border border-gray-400 hover:bg-white/80 text-black text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
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
        {displayedChallenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onRekt={onRekt}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  );
}
