"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import { getUserByWallet } from "@/app/lib/users-service/users";
import {
    ReferralHeader,
    ReferralInfoCards,
    ReferralLinkSection,
    LoginPrompt,
    UserReferralStats,
    LeaderboardTable,
} from "@/app/components/referral-components";

const REFERRAL_POINTS_PER_USER = 100;

export default function ReferralPage() {
    const { authenticated } = usePrivy();
    const { publicKey } = useSolanaWallet();
    const [userData, setUserData] = useState<{
        referral_code: string;
        referred_by: string | null;
        referrals: string[];
    } | null>(null);

    const walletAddress = publicKey?.toBase58() ?? null;

    useEffect(() => {
        const fetchUserData = async () => {
            if (!authenticated || !walletAddress) {
                setUserData(null);
                return;
            }

            try {
                const user = await getUserByWallet(walletAddress);
                setUserData({
                    referral_code: user.referral_code,
                    referred_by: user.referred_by || null,
                    referrals: user.referrals || [],
                });
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                setUserData(null);
            }
        };

        fetchUserData();
    }, [authenticated, walletAddress]);

    const referralLink = userData
        ? `https://rekto.fun/?ref=${userData.referral_code}`
        : "...";

    const referralsCount = userData?.referrals?.length || 0;
    const referralPoints = referralsCount * REFERRAL_POINTS_PER_USER;

    return (
        <div className="min-h-full" style={{ backgroundColor: "#f3e1d7" }}>
            {/* Top Section - Refer & Earn */}
            <section className="px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <ReferralHeader />

                    <div className="flex flex-col xl:flex-row gap-6">
                        {/* Left Side - Cards and Referral Link */}
                        <div className="flex-1 space-y-6">
                            {/* Three Info Cards */}
                            <ReferralInfoCards />

                            {/* Referral Link Section - Only for authenticated users */}
                            {authenticated ? (
                                <ReferralLinkSection
                                    referralLink={referralLink}
                                    referralCode={userData?.referral_code || ""}
                                    referredBy={userData?.referred_by || null}
                                />
                            ) : (
                                <LoginPrompt />
                            )}
                        </div>

                        {/* Right Side - User Referral Stats */}
                        <UserReferralStats
                            referralsCount={referralsCount}
                            referralPoints={referralPoints}
                        />
                    </div>
                </div>
            </section>

            {/* Below Section - Leaderboard Table */}
            <section className="px-4 sm:px-6 lg:px-8 xl:px-12 pb-12">
                <div className="max-w-7xl mx-auto">
                    <LeaderboardTable />
                </div>
            </section>
        </div>
    );
}