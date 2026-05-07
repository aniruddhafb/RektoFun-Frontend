"use client";

import Image from "next/image";
import Link from "next/link";

type NavbarMobileBottomNavProps = {
    isActive: (href: string) => boolean;
    profileHref: string;
    onSearchClick: () => void;
};

export function NavbarMobileBottomNav({
    isActive,
    profileHref,
    onSearchClick,
}: NavbarMobileBottomNavProps) {
    return (
        <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f3e1d7]/95 backdrop-blur-md border-t border-gray-200/50"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex items-center justify-around h-14">
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 ${
                        isActive("/") &&
                        !isActive("/challenges") &&
                        !isActive("/markets") &&
                        !isActive("/leaderboard") &&
                        !isActive("/referral") &&
                        !isActive("/activity") &&
                        !isActive("/roadmap") &&
                        !isActive("/profile")
                            ? "text-black"
                            : "text-gray-500"
                    }`}
                >
                    <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                    <span className="text-[10px] font-medium truncate">Home</span>
                </Link>

                <Link
                    href="/markets"
                    className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 ${
                        isActive("/markets") ? "text-black" : "text-gray-500"
                    }`}
                >
                    <Image
                        src="/Icons/discover.png"
                        alt="Markets"
                        width={20}
                        height={20}
                        className="w-5 h-5 flex-shrink-0"
                    />
                    <span className="text-[10px] font-medium truncate">Markets</span>
                </Link>

                <button
                    type="button"
                    onClick={onSearchClick}
                    className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 text-gray-500"
                >
                    <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <span className="text-[10px] font-medium truncate">Search</span>
                </button>

                <Link
                    href="/leaderboard"
                    className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 ${
                        isActive("/leaderboard") ? "text-black" : "text-gray-500"
                    }`}
                >
                    <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                    <span className="text-[10px] font-medium truncate">
                        Leaderboard
                    </span>
                </Link>

                <Link
                    href={profileHref}
                    className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 ${
                        isActive("/profile") ? "text-black" : "text-gray-500"
                    }`}
                >
                    <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                    <span className="text-[10px] font-medium truncate">Profile</span>
                </Link>
            </div>
        </div>
    );
}
