"use client";

import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import { CreateChallengeModal } from "@/app/components/challenge-components/CreateChallengeModal";
import {
    ProfileHeader,
    ProfileTabs,
    ProfileChallenges,
    ProfileActivity,
    ProfilePastChallenges,
    type ProfileChallengeResult,
    type ProfileTabType,
} from "@/app/components/profile-components";
import { LoadingPage } from "@/app/components/LoadingPage";
import { followUser, getUserProfile, unfollowUser, UserProfile } from "@/app/lib/users-service/users";
import { useUserStore } from "@/app/store/useUserStore";
import { useTokenBalanceStore } from "@/app/store/useTokenBalanceStore";
import {
    Challenge,
    getChallengeHistoryEvents,
    getChallengeById,
    getChallenges,
} from "@/app/lib/challenges-service/challenges";
import { fetchRektoBalance, fetchUsdcBalance } from "@/app/lib/token-balances";
import { getPositions, type Position } from "@/app/lib/positions-service/positions";
import {
    CHALLENGE_CREATED_EVENT,
    CHALLENGE_UPDATED_EVENT,
    type ChallengeUpdatedDetail,
} from "@/app/lib/realtime-events";

export default function ProfilePage() {
    const params = useParams();
    const { address: connectedWalletAddress } = useAppKitAccount();
    const { user: currentUser } = useUserStore();
    const storedBalanceWallet = useTokenBalanceStore((state) => state.walletAddress);
    const storedRektoBalance = useTokenBalanceStore((state) => state.rektoBalance);
    const storedUsdcBalance = useTokenBalanceStore((state) => state.usdcBalance);
    const storedBalancesLoading = useTokenBalanceStore((state) => state.isLoading);

    const slug = params.slug as string;
    const walletFromSlug = decodeURIComponent(slug || "");

    const [activeTab, setActiveTab] = useState<ProfileTabType>("challenges");
    const [profileSearchQuery, setProfileSearchQuery] = useState("");
    const [profileSortOrder, setProfileSortOrder] = useState<"latest" | "oldest">("latest");
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [challengeRefreshKey, setChallengeRefreshKey] = useState(0);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
    const [totalChallengesCreated, setTotalChallengesCreated] = useState(0);
    const [challengesLoading, setChallengesLoading] = useState(false);
    const [challengesLoadingMore, setChallengesLoadingMore] = useState(false);
    const [hasMoreChallenges, setHasMoreChallenges] = useState(true);
    const [pastChallenges, setPastChallenges] = useState<ProfileChallengeResult[]>([]);
    const [redeemChallenges, setRedeemChallenges] = useState<Challenge[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
    const [rektoBalance, setRektoBalance] = useState(0);
    const [isRektoBalanceLoading, setIsRektoBalanceLoading] = useState(true);
    const [usdcBalance, setUsdcBalance] = useState(0);
    const [isUsdcBalanceLoading, setIsUsdcBalanceLoading] = useState(true);

    const isOwnProfile = connectedWalletAddress?.toLowerCase() === user?.wallet_address?.toLowerCase();
    const isFollowing = !!(currentUser?.id && user?.followers?.includes(currentUser.id));
    const profileWalletAddress = user?.wallet_address || walletFromSlug;
    const profileUserId = user?.id;

    useLayoutEffect(() => {
        if (!window.matchMedia("(max-width: 767px)").matches) return;
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
        return () => window.cancelAnimationFrame(frame);
    }, [loading, walletFromSlug]);

    // Fetch user data by wallet address
    useEffect(() => {
        async function fetchUser() {
            if (!walletFromSlug) return;

            try {
                setLoading(true);
                const userData = await getUserProfile(walletFromSlug);
                setUser(userData);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch user");
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [walletFromSlug]);

    // Profile edits are saved from the navbar modal, which updates the global
    // user store. Reflect those changes in an already-open owner profile
    // immediately instead of waiting for a navigation or another API fetch.
    useEffect(() => useUserStore.subscribe((state) => {
        const updated = state.user;
        if (!updated) return;
        setUser((profile) => {
            if (!profile || profile.id !== updated.id) return profile;
            return {
                ...profile,
                username: updated.username,
                pubkey: updated.pubkey,
                wallet_address: updated.wallet_address,
                profile_image: updated.profile_image,
                bio: updated.bio,
                description: updated.description,
                twitter_username: updated.twitter_username,
                followers: updated.followers,
                following: updated.following,
                user_type: updated.user_type,
            };
        });
    }), []);

    // Fetch challenges created by this user
    useEffect(() => {
        async function fetchUserChallenges() {
            if (!user?.id) {
                setUserChallenges([]);
                setTotalChallengesCreated(0);
                return;
            }

            try {
                setChallengesLoading(true);
                const challengeData = await getChallenges({
                    created_by: user.id,
                    limit: 6,
                    offset: 0,
                });
                setUserChallenges(challengeData.challenges || []);
                setTotalChallengesCreated(challengeData.total ?? challengeData.challenges?.length ?? 0);
                setHasMoreChallenges((challengeData.challenges?.length ?? 0) < (challengeData.total ?? 0));
            } catch (challengeError) {
                console.error("Failed to fetch user challenges:", challengeError);
                setUserChallenges([]);
                setTotalChallengesCreated(0);
            } finally {
                setChallengesLoading(false);
            }
        }

        fetchUserChallenges();
    }, [user?.id, challengeRefreshKey]);

    useEffect(() => {
        let cancelled = false;
        async function fetchChallengeHistory() {
            if (!user?.id) return;
            try {
                setHistoryLoading(true);
                const [created, positionPage] = await Promise.all([
                    getChallenges({ created_by: user.id, limit: 1000, offset: 0 }),
                    getPositions({ creator: user.id, limit: 1000, offset: 0 }),
                ]);
                const positionsByChallenge = new Map<number, Position>();
                for (const position of positionPage.positions || []) {
                    if (!positionsByChallenge.has(position.challenge_id)) positionsByChallenge.set(position.challenge_id, position);
                }
                const createdIds = new Set((created.challenges || []).map((challenge) => challenge.id));
                const joinedIds = [...positionsByChallenge.keys()].filter((id) => !createdIds.has(id));
                const joined = await Promise.all(joinedIds.map((id) => getChallengeById(id).catch(() => null)));
                const all = [...(created.challenges || []), ...joined.filter((item): item is Challenge => Boolean(item))];

                const completed = all
                    .filter((challenge) => challenge.status === "RESOLVED" && ["TEAM_A", "TEAM_B"].includes(challenge.result))
                    .map((challenge): ProfileChallengeResult => {
                        const side = createdIds.has(challenge.id)
                            ? "TEAM_A"
                            : positionsByChallenge.get(challenge.id)?.side;
                        return { challenge, outcome: side === challenge.result ? "WON" : "LOST" };
                    });
                const redeemable = all.filter((challenge) => {
                    const alreadyClaimed = getChallengeHistoryEvents(challenge)
                        .some((event) => event.user_id === user.id);
                    if (alreadyClaimed) return false;
                    const isCreator = createdIds.has(challenge.id);
                    const side = isCreator ? "TEAM_A" : positionsByChallenge.get(challenge.id)?.side;
                    const resolvesAt = typeof challenge.metadata?.composer?.resolves_at === "string"
                        ? new Date(challenge.metadata.composer.resolves_at).getTime()
                        : null;
                    const settlementIsDue = resolvesAt === null
                        || Number.isNaN(resolvesAt)
                        || resolvesAt <= Date.now();
                    const winningTeamClaim = challenge.status === "RESOLVED"
                        && challenge.mode === "TEAM"
                        && settlementIsDue
                        && side === challenge.result;
                    const participantRefund = challenge.status === "CANCELLED" && !isCreator && Boolean(side);
                    return winningTeamClaim || participantRefund;
                });
                if (!cancelled) {
                    setPastChallenges(completed);
                    setRedeemChallenges(redeemable);
                }
            } catch (historyError) {
                console.error("Failed to fetch challenge history:", historyError);
                if (!cancelled) {
                    setPastChallenges([]);
                    setRedeemChallenges([]);
                }
            } finally {
                if (!cancelled) setHistoryLoading(false);
            }
        }
        void fetchChallengeHistory();
        return () => { cancelled = true; };
    }, [user?.id, challengeRefreshKey]);

    const loadMoreChallenges = useCallback(async () => {
        if (!profileUserId || challengesLoading || challengesLoadingMore || !hasMoreChallenges) return;
        try {
            setChallengesLoadingMore(true);
            const challengeData = await getChallenges({
                created_by: profileUserId,
                limit: 9,
                offset: userChallenges.length,
                include_total: false,
            });
            setUserChallenges((current) => [...current, ...(challengeData.challenges || [])]);
            setHasMoreChallenges(challengeData.has_more);
        } catch (challengeError) {
            console.error("Failed to load more user challenges:", challengeError);
        } finally {
            setChallengesLoadingMore(false);
        }
    }, [challengesLoading, challengesLoadingMore, hasMoreChallenges, profileUserId, userChallenges.length]);

    useEffect(() => {
        const refreshChallenges = () => setChallengeRefreshKey((key) => key + 1);
        const refreshUpdatedChallenge = (event: Event) => {
            refreshChallenges();
            const { challengeId } = (event as CustomEvent<ChallengeUpdatedDetail>).detail;
            if (selectedChallenge?.id !== challengeId) return;
            getChallengeById(challengeId)
                .then(setSelectedChallenge)
                .catch((refreshError) => console.error("Failed to refresh open challenge:", refreshError));
        };

        window.addEventListener(CHALLENGE_CREATED_EVENT, refreshChallenges);
        window.addEventListener(CHALLENGE_UPDATED_EVENT, refreshUpdatedChallenge);
        return () => {
            window.removeEventListener(CHALLENGE_CREATED_EVENT, refreshChallenges);
            window.removeEventListener(CHALLENGE_UPDATED_EVENT, refreshUpdatedChallenge);
        };
    }, [selectedChallenge?.id]);

    useEffect(() => {
        let cancelled = false;

        async function fetchProfileBalances() {
            if (!profileWalletAddress) {
                setRektoBalance(0);
                setUsdcBalance(0);
                setIsRektoBalanceLoading(false);
                setIsUsdcBalanceLoading(false);
                return;
            }

            const hasStoredBalances = storedBalanceWallet?.toLowerCase() === profileWalletAddress.toLowerCase();
            if (hasStoredBalances) {
                setRektoBalance(storedRektoBalance ?? 0);
                setUsdcBalance(storedUsdcBalance ?? 0);
                setIsRektoBalanceLoading(storedBalancesLoading && storedRektoBalance === null);
                setIsUsdcBalanceLoading(storedBalancesLoading && storedUsdcBalance === null);
                return;
            }

            try {
                setIsRektoBalanceLoading(true);
                setIsUsdcBalanceLoading(true);
                const [rektoResult, usdcResult] = await Promise.allSettled([
                    fetchRektoBalance(profileWalletAddress),
                    fetchUsdcBalance(profileWalletAddress),
                ]);
                if (!cancelled) {
                    setRektoBalance(rektoResult.status === "fulfilled" ? rektoResult.value : 0);
                    setUsdcBalance(usdcResult.status === "fulfilled" ? usdcResult.value : 0);
                }
            } catch (balanceError) {
                console.error("Failed to fetch profile balances:", balanceError);
                if (!cancelled) { setRektoBalance(0); setUsdcBalance(0); }
            } finally {
                if (!cancelled) {
                    setIsRektoBalanceLoading(false);
                    setIsUsdcBalanceLoading(false);
                }
            }
        }

        fetchProfileBalances();

        return () => {
            cancelled = true;
        };
    }, [profileWalletAddress, storedBalanceWallet, storedBalancesLoading, storedRektoBalance, storedUsdcBalance]);

    const handleChallengeClick = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedChallenge(null), 300);
    };

    const filteredChallenges = useMemo(() => {
        const query = profileSearchQuery.trim().toLowerCase();
        return userChallenges
            .filter((challenge) => !query || [challenge.statement, challenge.title, challenge.ticker, challenge.trading_pair]
                .some((value) => value?.toLowerCase().includes(query)))
            .sort((a, b) => {
                const difference = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                return profileSortOrder === "latest" ? difference : -difference;
            });
    }, [profileSearchQuery, profileSortOrder, userChallenges]);

    const handleToggleFollow = useCallback(async () => {
        if (!connectedWalletAddress || !user?.wallet_address || isOwnProfile) return;

        try {
            setIsFollowActionLoading(true);
            const updatedTarget = isFollowing
                ? await unfollowUser(user.wallet_address, connectedWalletAddress)
                : await followUser(user.wallet_address, connectedWalletAddress);
            setUser((current) => current ? { ...current, followers: updatedTarget.followers, following: updatedTarget.following } : current);
        } catch (followError) {
            console.error("Failed to toggle follow:", followError);
        } finally {
            setIsFollowActionLoading(false);
        }
    }, [connectedWalletAddress, isOwnProfile, isFollowing, user]);

    if (loading) {
        return <LoadingPage variant="simple" message="Loading profile..." />;
    }

    const userNotFound = error || !user;

    return (
        <div className="rekto-page min-h-screen pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {userNotFound ? (
                    <>
                        <ProfileHeader
                            username={slug}
                            avatar="/scribbles/pepe.png"
                            walletAddress={slug}
                            bio="No bio yet"
                            twitterUsername={null}
                            joinedDate={new Date().toISOString()}
                            balance={{
                                rekto: rektoBalance,
                                usdc: usdcBalance,
                                usdcUsd: 0,
                            }}
                            isRektoBalanceLoading={isRektoBalanceLoading}
                            isUsdcBalanceLoading={isUsdcBalanceLoading}
                            stats={{
                                wins: 0,
                                rekts: 0,
                                totalChallenges: 0,
                                winRatio: 0,
                                pnl: 0,
                                volume: 0,
                            }}
                        />
                        <div className="rekto-surface mt-6 p-4 bg-orange-100/50 backdrop-blur-sm rounded-2xl border border-orange-200/50 text-center">
                            <p className="text-gray-700 text-lg font-medium">
                                This user is not registered on RektoFun yet!
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <ProfileHeader
                            username={user.username}
                            avatar={user.profile_image || "/scribbles/pepe.png"}
                            walletAddress={user.wallet_address}
                            bio={user.description || "No bio yet"}
                            showSettingsIcon={isOwnProfile}
                            twitterUsername={user.twitter_username}
                            userType={user.user_type}
                            isOwnProfile={isOwnProfile}
                            isFollowing={isFollowing}
                            followersCount={user.followers?.length ?? 0}
                            followingCount={user.following?.length ?? 0}
                            onToggleFollow={connectedWalletAddress ? handleToggleFollow : undefined}
                            isFollowActionLoading={isFollowActionLoading}
                            joinedDate={user.created_at}
                            balance={{
                                rekto: rektoBalance,
                                usdc: usdcBalance,
                                usdcUsd: 0,
                            }}
                            isRektoBalanceLoading={isRektoBalanceLoading}
                            isUsdcBalanceLoading={isUsdcBalanceLoading}
                            stats={{
                                wins: user.metrics.won,
                                rekts: user.metrics.lost,
                                totalChallenges: totalChallengesCreated,
                                winRatio: user.metrics.win_rate,
                                pnl: user.metrics.pnl,
                                volume: user.metrics.volume,
                            }}
                        />

                        <ProfileTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            searchQuery={profileSearchQuery}
                            onSearchChange={setProfileSearchQuery}
                            sortOrder={profileSortOrder}
                            onSortChange={setProfileSortOrder}
                            isOwnProfile={isOwnProfile}
                        />

                        {activeTab === "challenges" && (
                            <ProfileChallenges
                                key={user.id}
                                challenges={filteredChallenges}
                                loading={challengesLoading}
                                onChallengeClick={handleChallengeClick}
                                onCreateChallenge={isOwnProfile ? () => setIsCreateModalOpen(true) : undefined}
                                hasMore={hasMoreChallenges}
                                loadingMore={challengesLoadingMore}
                                onLoadMore={loadMoreChallenges}
                            />
                        )}

                        {activeTab === "activity" && (
                            <ProfileActivity
                                key={user.id}
                                userId={String(user.id)}
                                username={user.username}
                                avatar={user.profile_image || "/scribbles/pepe.png"}
                                isOwnProfile={isOwnProfile}
                                onActivityClick={handleChallengeClick}
                                searchQuery={profileSearchQuery}
                                sortOrder={profileSortOrder}
                            />
                        )}

                        {activeTab === "past" && (
                            <ProfilePastChallenges
                                entries={pastChallenges
                                    .filter(({ challenge }) => !profileSearchQuery.trim() || (challenge.statement || challenge.title || "").toLowerCase().includes(profileSearchQuery.trim().toLowerCase()))
                                    .sort((a, b) => (profileSortOrder === "latest" ? -1 : 1) * (new Date(a.challenge.resolved_at || a.challenge.created_at).getTime() - new Date(b.challenge.resolved_at || b.challenge.created_at).getTime()))}
                                loading={historyLoading}
                                onChallengeClick={handleChallengeClick}
                            />
                        )}

                        {activeTab === "redeem" && isOwnProfile && (
                            <section className="mt-6">
                                {historyLoading ? (
                                    <div className="py-10 text-center font-bold text-gray-500">Checking for pending funds…</div>
                                ) : redeemChallenges.length ? (
                                    <ProfileChallenges
                                        challenges={redeemChallenges}
                                        onChallengeClick={handleChallengeClick}
                                    />
                                ) : (
                                    <div className="border-2 border-dashed border-black/25 bg-white/60 px-6 py-10 text-center">
                                        <div className="text-3xl" aria-hidden="true">💰</div>
                                        <h3 className="mt-3 text-lg font-black text-gray-950">No pending funds right now</h3>
                                        <p className="mt-1 text-sm font-semibold text-gray-600">All your pending winnings and refunds will appear here when they are ready to redeem.</p>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>

            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={isModalOpen}
                onClose={closeModal}
            />
            <CreateChallengeModal
                isOpen={Boolean(isOwnProfile && isCreateModalOpen)}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => {
                    setIsCreateModalOpen(false);
                    setChallengeRefreshKey((key) => key + 1);
                }}
            />
        </div>
    );
}
