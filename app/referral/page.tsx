"use client";

import { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
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
    const [userData, setUserData] = useState<{
        referral_code: string;
        referred_by: string | null;
        referrals: string[];
    } | null>(null);
    const [referralLink, setReferralLink] = useState<string>("https://rekto.fun/");

    const { address, isConnected } = useAppKitAccount();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!isConnected || !address) {
                setUserData(null);
                setReferralLink("https://rekto.fun/");
                return;
            }

            try {
                const user = await getUserByWallet(address);
                setUserData({
                    referral_code: user.referral_code,
                    referred_by: user.referred_by || null,
                    referrals: user.referrals || [],
                });
                setReferralLink(`https://rekto.fun/?ref=${user.referral_code}`);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                setUserData(null);
                setReferralLink("https://rekto.fun/");
            }
        };

        fetchUserData();
    }, [isConnected, address]);

    const referralsCount = userData?.referrals?.length || 0;
    const referralPoints = referralsCount * REFERRAL_POINTS_PER_USER;

    return (
        <div className="rekto-page referral-page min-h-full">
            {/* Top Section - Refer & Earn */}
            <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <ReferralHeader />

                    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 lg:gap-6 items-start">
                        {/* Left Side - Cards and Referral */}
                        <div className="min-w-0 space-y-5">
                            {/* Three Info Cards */}
                            <ReferralInfoCards />

                            {/* Referral Link Section - Only for connected users */}
                            {isConnected ? (
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
                        <UserReferralStats referralsCount={referralsCount} referralPoints={referralPoints} />
                    </div>
                </div>
            </section>

            {/* Below Section - Leaderboard Table */}
            <section className="px-4 sm:px-6 lg:px-8 pb-12">
                <div className="max-w-6xl mx-auto">
                    <LeaderboardTable />
                </div>
            </section>
            <style jsx global>{`
                .pixel-shell .referral-hover-shadow.referral-hover-shadow {
                    box-shadow: none !important;
                }

                .pixel-shell .referral-hover-shadow.referral-hover-shadow:hover,
                .pixel-shell .referral-hover-shadow.referral-hover-shadow:focus {
                    box-shadow: 4px 4px 0 #111 !important;
                }

                .pixel-shell .referral-table-shell.referral-table-shell,
                .pixel-shell .referral-table-shell.referral-table-shell:hover,
                .pixel-shell .referral-pagination-button.referral-pagination-button,
                .pixel-shell .referral-pagination-button.referral-pagination-button:hover {
                    box-shadow: none !important;
                    transform: none !important;
                }
            `}</style>
        </div>
    );
}
