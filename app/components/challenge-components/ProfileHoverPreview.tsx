"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getChallenges } from "@/app/lib/challenges-service/challenges";
import {
    followUser,
    getLeaderboard,
    getUserByWallet,
    unfollowUser,
} from "@/app/lib/users-service/users";
import { useUserStore } from "@/app/store/useUserStore";

type ProfilePreviewData = {
    avatar: string;
    username: string;
    twitterUsername: string | null;
    userType: "user" | "moderator";
    bio: string;
    followerIds: Array<number | string>;
    followingCount: number;
    challengesCreated: number;
    won: number;
    rekt: number;
    pnl: number;
};

type ProfilePreviewState =
    | { status: "loading" }
    | { status: "ready"; data: ProfilePreviewData }
    | { status: "error" };

const previewCache = new Map<string, ProfilePreviewData>();
const previewRequests = new Map<string, Promise<ProfilePreviewData>>();

async function loadProfilePreview(walletAddress: string): Promise<ProfilePreviewData> {
    const cacheKey = walletAddress.trim().toLowerCase();
    const cached = previewCache.get(cacheKey);
    if (cached) return cached;

    const pending = previewRequests.get(cacheKey);
    if (pending) return pending;

    const request = (async () => {
        const user = await getUserByWallet(walletAddress);
        const [leaderboard, challenges] = await Promise.all([
            getLeaderboard(1, 0, user.wallet_address, "all").catch(() => null),
            getChallenges({ created_by: user.id, limit: 1, offset: 0 }).catch(() => null),
        ]);
        const normalizedWallet = user.wallet_address.toLowerCase();
        const metrics = leaderboard?.users.find(
            (item) => item.wallet_address.toLowerCase() === normalizedWallet,
        );
        const data: ProfilePreviewData = {
            avatar: user.profile_image || user.twitter_profile_image || "/scribbles/pepe.png",
            username: user.username || "User",
            twitterUsername: user.twitter_username,
            userType: user.user_type,
            bio: user.description || user.bio || "No bio yet",
            followerIds: user.followers || [],
            followingCount: user.following?.length ?? 0,
            challengesCreated: challenges?.total ?? challenges?.challenges.length ?? 0,
            won: metrics?.won ?? 0,
            rekt: metrics?.lost ?? 0,
            pnl: metrics?.pnl ?? 0,
        };

        previewCache.set(cacheKey, data);
        return data;
    })();

    previewRequests.set(cacheKey, request);
    try {
        return await request;
    } finally {
        previewRequests.delete(cacheKey);
    }
}

function formatPnl(value: number) {
    const amount = Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
    return `${value > 0 ? "+" : value < 0 ? "-" : ""}$${amount}`;
}

function truncateBio(value: string, maxWords = 6) {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return value;
    return `${words.slice(0, maxWords).join(" ")}...`;
}

export function ProfileHoverPreview({
    walletAddress,
    fallbackAvatar,
    fallbackName,
    align,
}: {
    walletAddress?: string | null;
    fallbackAvatar: string;
    fallbackName: string;
    align: "left" | "right";
}) {
    const { user: currentUser } = useUserStore();
    const cacheKey = walletAddress?.trim().toLowerCase() || "";
    const cached = cacheKey ? previewCache.get(cacheKey) : undefined;
    const [state, setState] = React.useState<ProfilePreviewState>(
        cached ? { status: "ready", data: cached } : walletAddress ? { status: "loading" } : { status: "error" },
    );
    const [isFollowLoading, setIsFollowLoading] = React.useState(false);

    React.useEffect(() => {
        if (!walletAddress) return;
        let cancelled = false;

        loadProfilePreview(walletAddress)
            .then((data) => {
                if (!cancelled) setState({ status: "ready", data });
            })
            .catch(() => {
                if (!cancelled) setState({ status: "error" });
            });

        return () => {
            cancelled = true;
        };
    }, [walletAddress]);

    const data = state.status === "ready" ? state.data : null;
    const currentUserId = currentUser?.id;
    const currentUserWallet = currentUser?.wallet_address || currentUser?.pubkey || "";
    const isOwnProfile = Boolean(
        walletAddress && currentUserWallet && walletAddress.toLowerCase() === currentUserWallet.toLowerCase(),
    );
    const isFollowing = Boolean(
        currentUserId && data?.followerIds.some((id) => String(id) === String(currentUserId)),
    );
    const isVerified = Boolean(data?.twitterUsername || data?.userType === "moderator");
    const value = (field: "challengesCreated" | "won" | "rekt") =>
        state.status === "loading" ? "…" : data ? data[field].toLocaleString() : "—";

    const toggleFollow = async () => {
        if (!walletAddress || !currentUserWallet || !data || isFollowLoading || isOwnProfile) return;

        setIsFollowLoading(true);
        try {
            const updatedUser = isFollowing
                ? await unfollowUser(walletAddress, currentUserWallet)
                : await followUser(walletAddress, currentUserWallet);
            const updatedData = {
                ...data,
                followerIds: updatedUser.followers || [],
            };
            previewCache.set(cacheKey, updatedData);
            setState({ status: "ready", data: updatedData });
        } catch {
            // Keep the current follow state if the request fails.
        } finally {
            setIsFollowLoading(false);
        }
    };

    return (
        <div
            data-card-action="true"
            className={`absolute top-full z-[80] w-[min(18rem,calc(100vw-2rem))] pt-3 ${align === "left" ? "left-0" : "right-0"}`}
            onClick={(event) => event.stopPropagation()}
        >
            <aside
                aria-label={`${data?.username || fallbackName} profile preview`}
                className="border-2 border-black bg-[#fffaf6] p-3 text-left"
            >
                <div className="flex items-start justify-between gap-2">
                    {walletAddress ? (
                        <Link
                            href={`/profile/${encodeURIComponent(walletAddress)}`}
                            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                            aria-label={`Open ${data?.username || fallbackName}'s profile`}
                        >
                            <ProfileIdentity
                                avatar={data?.avatar || fallbackAvatar}
                                username={data?.username || fallbackName}
                                bio={truncateBio(data?.bio || (state.status === "loading" ? "Loading profile…" : "Profile details unavailable"))}
                                isVerified={isVerified}
                                userType={data?.userType}
                                twitterUsername={data?.twitterUsername}
                            />
                        </Link>
                    ) : (
                        <div className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                            <ProfileIdentity
                                avatar={data?.avatar || fallbackAvatar}
                                username={data?.username || fallbackName}
                                bio={truncateBio(data?.bio || "Profile details unavailable")}
                                isVerified={isVerified}
                                userType={data?.userType}
                                twitterUsername={data?.twitterUsername}
                            />
                        </div>
                    )}

                    {!isOwnProfile && data && (
                        <button
                            type="button"
                            onClick={toggleFollow}
                            disabled={!currentUserWallet || isFollowLoading}
                            className={`shrink-0 cursor-pointer border px-2 py-1 text-[9px] font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isFollowing ? "border-black/20 bg-white text-[#594b44] hover:border-black" : "border-black bg-black text-white hover:bg-[#2d1f1a]"}`}
                        >
                            {isFollowLoading ? "…" : isFollowing ? "Unfollow" : "Follow"}
                        </button>
                    )}
                </div>

                <div className="mt-2 flex items-center gap-3 border-t border-black/10 pt-2 text-[9px] font-bold text-[#8b7a72]">
                    <span><strong className="text-black">{data ? data.followingCount : state.status === "loading" ? "…" : "—"}</strong> Following</span>
                    <span><strong className="text-black">{data ? data.followerIds.length : state.status === "loading" ? "…" : "—"}</strong> Followers</span>
                </div>

            <div className="mt-2 grid grid-cols-4 divide-x divide-black/10 border-y border-black/10 py-2 text-center">
                <div className="min-w-0 px-1">
                    <p className="text-xs font-black text-black">{value("challengesCreated")}</p>
                    <p className="mt-0.5 text-[8px] font-black uppercase leading-tight tracking-[0.04em] text-[#8b7a72]">
                        Created
                    </p>
                </div>
                <div className="min-w-0 px-1">
                    <p className="text-xs font-black text-emerald-700">{value("won")}</p>
                    <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.04em] text-[#8b7a72]">Won</p>
                </div>
                <div className="min-w-0 px-1">
                    <p className="text-xs font-black text-red-600">{value("rekt")}</p>
                    <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.04em] text-[#8b7a72]">Rekt</p>
                </div>
                <div className="min-w-0 px-1">
                    <p className={`truncate text-xs font-black ${data && data.pnl > 0 ? "text-emerald-700" : data && data.pnl < 0 ? "text-red-600" : "text-black"}`}>
                        {state.status === "loading" ? "…" : data ? formatPnl(data.pnl) : "—"}
                    </p>
                    <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.04em] text-[#8b7a72]">P&amp;L</p>
                </div>
                </div>
            </aside>
        </div>
    );
}

function ProfileIdentity({
    avatar,
    username,
    bio,
    isVerified,
    userType,
    twitterUsername,
}: {
    avatar: string;
    username: string;
    bio: string;
    isVerified: boolean;
    userType?: "user" | "moderator";
    twitterUsername?: string | null;
}) {
    return (
        <>
            <span className="relative shrink-0">
                <Image
                    src={avatar}
                    alt={username}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full border-2 border-black object-cover"
                />
                {isVerified && (
                    <span
                        className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center drop-shadow-sm"
                        title={userType === "moderator" ? "Verified as KOL" : `Verified on X as @${twitterUsername}`}
                        aria-label={userType === "moderator" ? "Verified as KOL" : `Verified on X as @${twitterUsername}`}
                    >
                        <svg className="h-full w-full" viewBox="0 0 32 32" aria-hidden="true">
                            <path
                                    fill={userType === "moderator" ? "#F5B800" : "#378FDB"}
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                                d="M16 1.5l2.8 2.2 3.5-1 1.6 3.2 3.6.5.1 3.7 3 2-1.4 3.4 1.4 3.4-3 2-.1 3.7-3.6.5-1.6 3.2-3.5-1L16 30.5l-2.8-2.2-3.5 1-1.6-3.2-3.6-.5-.1-3.7-3-2 1.4-3.4-1.4-3.4 3-2 .1-3.7 3.6-.5 1.6-3.2 3.5 1L16 1.5Z"
                            />
                            <path d="m9.4 16.2 4.2 4.2 9-9" fill="none" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>
                )}
            </span>
            <span className="min-w-0">
                <span className="block truncate text-sm font-black text-[#17120f]">{username}</span>
                <span className="mt-0.5 line-clamp-2 block text-[10px] font-semibold leading-3.5 text-[#6d5d55]">
                        {bio}
                </span>
            </span>
        </>
    );
}
