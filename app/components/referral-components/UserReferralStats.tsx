"use client";

import { Sparkles, Users, Coins } from "lucide-react";

interface UserReferralStatsProps {
    referralsCount: number;
    referralPoints: number;
}

export function UserReferralStats({ referralsCount, referralPoints }: UserReferralStatsProps) {
    return (
        <aside className="flex flex-col gap-4 xl:sticky xl:top-24">
            {/* User Stats Card */}
            <div className="referral-hover-shadow rounded-lg border border-black/10 bg-white/80 p-5 shadow-none backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-black sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-black text-gray-950">Your progress</h3>
                        <p className="mt-1 text-sm font-medium text-gray-600">Track referral rewards from your invite link.</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                        <Sparkles className="h-5 w-5" />
                    </div>
                </div>

                {/* Total Referrals */}
                <div className="mb-3 rounded-lg border border-black/10 bg-[#fffaf6] p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sky-700 ring-1 ring-black/10">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-gray-500">Friends referred</p>
                            <p className="text-3xl font-black text-gray-950">{referralsCount}</p>
                        </div>
                    </div>
                </div>

                {/* Total Points */}
                <div className="rounded-lg border border-black/10 bg-[#fffaf6] p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-black/10">
                            <Coins className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-wide text-gray-500">REKTO points</p>
                            <p className="text-3xl font-black text-gray-950">{referralPoints.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Tip Card */}
            <div className="referral-hover-shadow rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-black sm:p-5">
                <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
                    <div>
                        <p className="text-sm font-black text-amber-950">Best results</p>
                        <p className="mt-1 text-xs font-medium leading-5 text-amber-900">
                            Share your link with traders who are likely to join and make their first prediction. Each successful signup adds 100 points.
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
