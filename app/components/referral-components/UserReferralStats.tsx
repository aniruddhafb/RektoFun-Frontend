"use client";

import { Sparkles, Users, Coins } from "lucide-react";

interface UserReferralStatsProps {
    referralsCount: number;
    referralPoints: number;
}

export function UserReferralStats({ referralsCount, referralPoints }: UserReferralStatsProps) {
    return (
        <div className="xl:w-80 flex flex-col gap-4">
            {/* User Stats Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/50 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Your Referral Stats</h3>

                {/* Total Referrals */}
                <div className="mb-4 p-4 bg-white/40 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Friends Referred</p>
                            <p className="text-2xl font-bold text-gray-900">{referralsCount}</p>
                        </div>
                    </div>
                </div>

                {/* Total Points */}
                <div className="p-4 bg-white/40 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Coins className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Your REKTO points</p>
                            <p className="text-2xl font-bold text-gray-900">{referralPoints.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Tip Card */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/50">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-medium text-gray-900 text-sm">Pro Tip</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Share your referral link on social media to maximize your earnings. Each friend brings you 100 points!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}