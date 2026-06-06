"use client";

import { Lock, LogIn } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

export function LoginPrompt() {
    const { login } = usePrivy();

    return (
        <div className="referral-hover-shadow rounded-lg border border-black/10 bg-white/80 p-5 shadow-none backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-black sm:p-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-600 ring-1 ring-black/10">
                    <Lock className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-black text-gray-950">Sign in to unlock your referral link</h3>
                <p className="mb-6 max-w-md text-sm font-medium leading-6 text-gray-600 sm:text-base">
                    Create or connect your account to generate a tracked invite link, redeem a friend&apos;s code, and start earning REKTO points.
                </p>
                <button
                    onClick={login}
                    className="referral-button-shadow inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-black px-6 text-sm font-black text-white transition-colors hover:bg-gray-800"
                >
                    <LogIn className="h-4 w-4" />
                    Login to get started
                </button>
            </div>
        </div>
    );
}
