import ChallengeCard from "./ChallengeCard";
import { ClanChallenge } from "./types";

interface ClanChallengesProps {
    challenges: ClanChallenge[];
}

const ClanChallenges = ({ challenges }: ClanChallengesProps) => {
    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Clan Challenges</h2>
            </div>
            <div className="space-y-4">
                {challenges.map((challenge) => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
            </div>
        </div>
    );
};

export default ClanChallenges;
