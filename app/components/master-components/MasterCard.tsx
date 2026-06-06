import Image from "next/image";
import { BadgeCheck, Check, Eye, Flame, Loader2, Target, Trophy, UserPlus, Users } from "lucide-react";
import type { Master } from "./types";

type Props = {
    master: Master;
    isOwnCard: boolean;
    isFollowing: boolean;
    isFollowLoading: boolean;
    canFollow: boolean;
    onViewProfile: (walletAddress: string) => void;
    onToggleFollow: (walletAddress: string) => void;
};

export function MasterCard({
    master,
    isOwnCard,
    isFollowing,
    isFollowLoading,
    canFollow,
    onViewProfile,
    onToggleFollow,
}: Props) {
    const followerCount = master.followers.length;
    const shortWallet = `${master.walletAddress.slice(0, 4)}...${master.walletAddress.slice(-4)}`;

    return (
        <article className="master-card-shell group mx-auto flex h-full w-full max-w-[400px] flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white/85 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-black/[0.14] hover:bg-white md:max-w-[350px]">
            <div className="relative h-24 overflow-hidden border-b border-black/[0.06]" style={{ background: master.banner }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_22%,rgba(255,255,255,0.28),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.14),transparent_42%)]" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/28 to-transparent" />
                <div className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                    {master.category}
                </div>
            </div>

            <div className="-mt-10 flex justify-center px-5">
                <button
                    type="button"
                    onClick={() => onViewProfile(master.walletAddress)}
                    className="master-card-button relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-black bg-slate-100 ring-1 ring-black/[0.06] transition group-hover:scale-[1.02]"
                    aria-label={`View ${master.name}'s profile`}
                >
                    <Image src={master.avatarPath} alt={`${master.name} avatar`} fill sizes="80px" className="rounded-full object-cover" />
                    {master.verified ? (
                        <span className="absolute bottom-0 right-0 z-10 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#2f7bff] text-white">
                            <BadgeCheck className="h-3.5 w-3.5" />
                        </span>
                    ) : null}
                </button>
            </div>

            <div className="px-5 pb-5 pt-3">
                <div className="text-center">
                    <div className="flex min-w-0 items-center justify-center gap-1.5">
                        <h2 className="truncate text-lg font-bold leading-tight text-gray-950">{master.name}</h2>
                        {master.verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" /> : null}
                    </div>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-black/[0.07] bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        <Users className="h-3.5 w-3.5" />
                        {followerCount} followers
                    </span>
                </div>
            </div>

            <div className="mx-5 grid grid-cols-3 overflow-hidden rounded-xl border border-black/[0.07] bg-gray-50/80 text-center">
                <div className="border-r border-black/[0.06] px-2 py-3">
                    <Target className="mx-auto mb-1.5 h-4 w-4 text-gray-400" />
                    <p className="text-sm font-bold leading-none text-gray-950">{master.challenges}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Challenges</p>
                </div>
                <div className="border-r border-black/[0.06] px-2 py-3">
                    <Trophy className="mx-auto mb-1.5 h-4 w-4 text-emerald-500" />
                    <p className="text-sm font-bold leading-none text-gray-950">+{master.wins}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Wins</p>
                </div>
                <div className="px-2 py-3">
                    <Flame className="mx-auto mb-1.5 h-4 w-4 text-rose-500" />
                    <p className="text-sm font-bold leading-none text-gray-950">{master.rekts}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Rekts</p>
                </div>
            </div>

            <div className="mt-auto flex gap-2.5 p-5">
                <button
                    onClick={() => onViewProfile(master.walletAddress)}
                    className="master-card-button inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm font-bold text-gray-800 transition hover:border-black/[0.16] hover:bg-gray-50"
                >
                    <Eye className="h-4 w-4" />
                    View Profile
                </button>
                <button
                    onClick={() => onToggleFollow(master.walletAddress)}
                    disabled={!canFollow || isOwnCard || isFollowLoading}
                    title={!canFollow ? "Connect wallet to follow users" : isOwnCard ? "You cannot follow yourself" : ""}
                    className={`master-card-button grid h-11 w-11 place-items-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${isFollowing ? "cursor-pointer border-gray-950 bg-gray-950 text-white hover:bg-gray-800" : "cursor-pointer border-black/[0.08] bg-white text-gray-500 hover:border-black/[0.16] hover:bg-gray-50 hover:text-gray-900"}`}
                    aria-label={isFollowing ? `Unfollow ${master.name}` : `Follow ${master.name}`}
                >
                    {isFollowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </button>
            </div>
        </article>
    );
}

export function MasterCardSkeleton() {
    return (
        <article className="master-card-shell mx-auto flex h-full min-h-[430px] w-full max-w-[400px] animate-pulse flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white/70 backdrop-blur-md md:max-w-[350px]">
            <div className="h-24 border-b border-black/[0.06] bg-gray-200/80" />

            <div className="-mt-10 flex justify-center px-5">
                <div className="h-20 w-20 rounded-full border-4 border-white bg-gray-200 ring-1 ring-black/[0.06]" />
            </div>

            <div className="px-5 pb-5 pt-4">
                <div className="mx-auto h-5 w-32 rounded bg-gray-200" />
                <div className="mx-auto mt-2 h-4 w-20 rounded bg-gray-200/80" />

                <div className="mt-5 flex items-center justify-center gap-2">
                    <div className="h-7 w-28 rounded-full bg-gray-200/80" />
                    <div className="h-7 w-24 rounded-full bg-gray-200/80" />
                </div>
            </div>

            <div className="mx-5 grid grid-cols-3 overflow-hidden rounded-xl border border-black/[0.07] bg-gray-50/80">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className={`px-2 py-3 ${index < 2 ? "border-r border-black/[0.06]" : ""}`}>
                        <div className="mx-auto h-4 w-4 rounded bg-gray-200" />
                        <div className="mx-auto mt-2 h-4 w-8 rounded bg-gray-200" />
                        <div className="mx-auto mt-2 h-3 w-16 rounded bg-gray-200/80" />
                    </div>
                ))}
            </div>

            <div className="mt-auto flex gap-2.5 p-5">
                <div className="h-11 flex-1 rounded-xl border border-black/[0.08] bg-gray-200/70" />
                <div className="h-11 w-11 rounded-xl border border-black/[0.08] bg-gray-200/70" />
            </div>
        </article>
    );
}
