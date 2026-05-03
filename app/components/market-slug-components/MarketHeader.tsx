"use client";

import Image from "next/image";

interface MarketHeaderProps {
    marketName: string;
    marketDescription: string;
    marketLogo: string;
    onCreateChallenge: () => void;
}

export function MarketHeader({
    marketName,
    marketDescription,
    marketLogo,
    onCreateChallenge,
}: MarketHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                    <Image
                        src={marketLogo}
                        alt={marketName}
                        fill
                        className="object-contain"
                        sizes="64px"
                    />
                </div>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                        {marketName}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                        {marketDescription}
                    </p>
                </div>
            </div>
            <button
                onClick={onCreateChallenge}
                className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-white/50 border border-gray-400 hover:bg-white/80 text-black text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Challenge
            </button>
        </div>
    );
}