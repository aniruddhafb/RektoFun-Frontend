"use client";

import { useState, useEffect, useRef } from "react";
import * as ClanComponents from "@/app/components/clan-slug-components";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import type { Tab } from "@/app/components/clan-slug-components";
import type { ClanData } from "@/app/components/clan-slug-components/types";
import { getClanDataBySlug } from "@/app/lib/clan-service/clans";
import { getClanMembers } from "@/app/lib/clan-service/clanMembers";
import { getUserByWallet } from "@/app/lib/users-service/users";
import { LoadingPage } from "@/app/components/LoadingPage";

const inFlightClanRequests = new Map<string, Promise<ClanData>>();
const inFlightMembersRequests = new Map<string, Promise<Awaited<ReturnType<typeof getClanMembers>>>>();
const inFlightUserByWalletRequests = new Map<string, Promise<Awaited<ReturnType<typeof getUserByWallet>>>>();

function getClanDataBySlugDeduped(slug: string): Promise<ClanData> {
    const existing = inFlightClanRequests.get(slug);
    if (existing) return existing;

    const request = getClanDataBySlug(slug).finally(() => {
        inFlightClanRequests.delete(slug);
    });
    inFlightClanRequests.set(slug, request);
    return request;
}

function getClanMembersDeduped(slug: string) {
    const existing = inFlightMembersRequests.get(slug);
    if (existing) return existing;

    const request = getClanMembers(slug).finally(() => {
        inFlightMembersRequests.delete(slug);
    });
    inFlightMembersRequests.set(slug, request);
    return request;
}

function getUserByWalletDeduped(walletAddress: string) {
    const existing = inFlightUserByWalletRequests.get(walletAddress);
    if (existing) return existing;

    const request = getUserByWallet(walletAddress).finally(() => {
        inFlightUserByWalletRequests.delete(walletAddress);
    });
    inFlightUserByWalletRequests.set(walletAddress, request);
    return request;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { publicKey: userWallet } = useSolanaWallet();
    const walletAddress = userWallet?.toBase58() ?? "";
    const [slug, setSlug] = useState<string>("");
    const [isMember, setIsMember] = useState(false);
    const [membersRefreshKey, setMembersRefreshKey] = useState(0);
    const [activeTab, setActiveTab] = useState<Tab>("Overview");
    const [clanData, setClanData] = useState<ClanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleClanRefresh = () => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        refreshTimeoutRef.current = setTimeout(() => {
            if (!slug) return;
            getClanDataBySlugDeduped(slug)
                .then((freshData) => setClanData(freshData))
                .catch((err) => console.error("Failed to refresh clan data:", err));
        }, 500);
    };

    // Handle clan membership change (when user joins or leaves)
    const handleClanMembershipChange = (newMemberCount: number) => {
        setClanData((prevData) => {
            if (!prevData) return prevData;
            return {
                ...prevData,
                members: newMemberCount,
            };
        });
        
        // Trigger refresh for ClanMembers component
        setMembersRefreshKey(prev => prev + 1);

        // Refresh clan data from server after a short delay
        scheduleClanRefresh();
    };

    // Handle clan data update (when clan settings are saved)
    const handleClanDataUpdate = () => {
        // Refresh clan data from server after a short delay
        scheduleClanRefresh();
    };

    // Resolve params promise
    useEffect(() => {
        params.then(p => {
            setSlug(p.slug);
        });
    }, [params]);

    useEffect(() => {
        async function fetchClan() {
            if (!slug) return;
            try {
                setLoading(true);
                setError(null);
                console.log("Fetching clan with slug:", slug);
                // Fetch clan by slug (ID) and transform to ClanData format
                const clan = await getClanDataBySlugDeduped(slug);
                console.log("Fetched clan data:", clan);
                setClanData(clan);

                // Check if user is a member
                if (walletAddress) {
                    try {
                        // First, get the user ID associated with this wallet
                        const user = await getUserByWalletDeduped(walletAddress);
                        const userId = user.id;

                        const membersResponse = await getClanMembersDeduped(slug);

                        // Check if the user's ID is in the clan members list
                        // We check both the internal userId and the wallet address
                        const memberExists = membersResponse.members.some((m: any) =>
                            m.id === userId ||
                            m.id === walletAddress ||
                            m.name === userId ||
                            m.name === walletAddress
                        );
                        console.log("Membership check:", { userId, walletAddress, memberExists });
                        setIsMember(memberExists);
                    } catch (err) {
                        console.error("Failed to check membership:", err);
                        setIsMember(false);
                    }
                } else {
                    setIsMember(false);
                }
            } catch (err) {
                console.error("Failed to fetch clan:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch clan");
            } finally {
                setLoading(false);
            }
        }

        fetchClan();

        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, [slug, walletAddress]);

    const tabs: Tab[] = ["Overview", "Chat"];

    return (
        <>
            {loading ? (
                <LoadingPage variant="simple" message="Loading clan details..." />
            ) : clanData ? (
                <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                        {/* ── Clan Header ── */}
                        <ClanComponents.ClanHeader
                            clanData={clanData}
                            onClanMembershipChange={handleClanMembershipChange}
                            onClanDataUpdate={handleClanDataUpdate}
                            onMembershipStatusChange={setIsMember}
                        />

                        {/* ── Tabs ── */}
                        <ClanComponents.ClanTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            tabs={tabs}
                            isMember={isMember}
                        />

                        {/* ── Overview Tab ── */}
                        {activeTab === "Overview" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Left: Clan Challenges */}
                                <div className="lg:col-span-2">
                                    <ClanComponents.ClanChallenges challenges={ClanComponents.challengesData} />
                                </div>

                                {/* Right: Members */}
                                <div className="lg:col-span-1">
                                    <ClanComponents.ClanMembers
                                        clanId={clanData.slug}
                                        maxMembers={clanData.maxMembers}
                                        refreshKey={membersRefreshKey}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Chat Tab ── */}
                        {activeTab === "Chat" && (
                            isMember ? (
                                <ClanComponents.ChatSection clanData={clanData} />
                            ) : (
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-10 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <span className="text-2xl">🔒</span>
                                    </div>
                                    <p className="text-gray-600 font-medium">Only clan members can have conversation with each other</p>
                                </div>
                            )
                        )}

                    </div>
                </div>
            ) : (
                <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5 flex flex-col items-center justify-center">
                            <p className="text-gray-500 text-sm">Clan not found</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
