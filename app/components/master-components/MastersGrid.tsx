import type { Master } from "./types";
import { MasterCard, MasterCardSkeleton } from "./MasterCard";

type Props = {
    masters: Master[];
    error: string | null;
    showPlaceholders?: boolean;
    placeholderCount?: number;
    getIsOwnCard: (master: Master) => boolean;
    getIsFollowing: (master: Master) => boolean;
    getIsFollowLoading: (walletAddress: string) => boolean;
    canFollow: boolean;
    onViewProfile: (walletAddress: string) => void;
    onToggleFollow: (walletAddress: string) => void;
};

export function MastersGrid({
    masters,
    error,
    showPlaceholders = false,
    placeholderCount = 6,
    getIsOwnCard,
    getIsFollowing,
    getIsFollowLoading,
    canFollow,
    onViewProfile,
    onToggleFollow,
}: Props) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {!error && masters.length === 0 && !showPlaceholders ? (
                <div className="col-span-full rounded-xl border border-slate-200 bg-white/70 p-6 text-center text-slate-600">
                    No masters found.
                </div>
            ) : null}

            {!error &&
                masters.map((master) => (
                    <MasterCard
                        key={master.id}
                        master={master}
                        isOwnCard={getIsOwnCard(master)}
                        isFollowing={getIsFollowing(master)}
                        isFollowLoading={getIsFollowLoading(master.walletAddress)}
                        canFollow={canFollow}
                        onViewProfile={onViewProfile}
                        onToggleFollow={onToggleFollow}
                    />
                ))}

            {!error && showPlaceholders
                ? Array.from({ length: placeholderCount }).map((_, index) => <MasterCardSkeleton key={`master-placeholder-${index}`} />)
                : null}
        </div>
    );
}
