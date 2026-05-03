"use client";

import { Lock } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

export function LoginPrompt() {
    const { login } = usePrivy();

    return (
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/50">
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Login to Access Referral</h3>
                <p className="text-gray-600 mb-6 max-w-sm">
                    Sign in or create an account to access your referral link and start earning REKT POINTS!
                </p>
                <button
                    onClick={login}
                    className="px-8 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                >
                    Login to Get Started
                </button>
            </div>
        </div>
    );
}