"use client";

import { HandHeart, Trophy, Skull } from "lucide-react";

export function ReferralInfoCards() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Refer Friends Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/50 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <HandHeart className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Refer Friends</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                    Get <span className="font-semibold text-gray-900">100 REKT POINTS</span> for every
                    friend you invite when they sign
                </p>
            </div>

            {/* Win Challenges Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/50 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Win Challenges</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                    Earn <span className="font-semibold text-gray-900">20 REKT POINTS</span> for every
                    challenge you win.
                </p>
            </div>

            {/* Get Rekt Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/50 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Skull className="w-5 h-5 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Get Rekt!</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                    Even if you lose, you still receive{" "}
                    <span className="font-semibold text-gray-900">10 REKT POINTS</span>.
                </p>
            </div>
        </div>
    );
}