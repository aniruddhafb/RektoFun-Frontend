"use client";

import { Link2, Send, Trophy } from "lucide-react";

const referralSteps = [
    {
        icon: Link2,
        title: "Copy your link",
        description: "Your unique referral code is attached automatically, so every invite is tracked.",
    },
    {
        icon: Send,
        title: "Share it anywhere",
        description: "Send it to friends, communities, group chats, or your social audience.",
    },
    {
        icon: Trophy,
        title: "Earn points",
        description: "Receive 100 REKTO points for every friend who signs up with your link.",
    },
];

export function ReferralInfoCards() {
    return (
        <div className="rounded-lg border border-black/10 bg-[#fffaf6]/80 p-4 backdrop-blur-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-black text-gray-950">How referrals work</h2>
                    <p className="text-sm font-medium text-gray-600">A simple three-step loop from invite to reward.</p>
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">
                    100 points per signup
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {referralSteps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                        <div key={step.title} className="referral-hover-shadow rounded-lg border border-black/10 bg-white px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-black">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-wide text-gray-400">Step {index + 1}</span>
                            </div>
                            <h3 className="font-black text-gray-950">{step.title}</h3>
                            <p className="mt-2 text-sm font-medium leading-6 text-gray-600">{step.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
