"use client";

import Link from "next/link";
import { CirclePlus, Compass, Search, Trophy, UserRound } from "lucide-react";

type NavbarMobileBottomNavProps = {
    isActive: (href: string) => boolean;
    profileHref: string;
    onSearchClick: () => void;
    onCreateClick: () => void;
    isSearchOpen: boolean;
};

export function NavbarMobileBottomNav({
    isActive,
    profileHref,
    onSearchClick,
    onCreateClick,
    isSearchOpen,
}: NavbarMobileBottomNavProps) {
    const itemBase =
        "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2 transition-colors active:opacity-70";

    const labelBase = "max-w-full truncate text-[9px] font-bold leading-none min-[380px]:text-[10px]";

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/15 bg-[#f3e1d7] md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <nav aria-label="Mobile navigation" className="mx-auto flex h-[4.25rem] max-w-lg items-end justify-around px-1">
                <Link
                    href="/challenges"
                    className={`${itemBase} ${isActive("/challenges") ? "text-[#e85a2d]" : "text-[#74645c]"}`}
                >
                    <Compass className="h-6 w-6 shrink-0" strokeWidth={isActive("/challenges") ? 2.5 : 2} />
                    <span className={labelBase}>Challenges</span>
                </Link>

                <div
                    onClick={onSearchClick}
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSearchClick();
                        }
                    }}
                    role="button"
                    aria-label="Search"
                    className={`${itemBase} cursor-pointer !border-0 !bg-transparent !shadow-none ${isSearchOpen ? "text-[#e85a2d]" : "text-[#74645c]"}`}
                >
                    <Search className="h-6 w-6 shrink-0" strokeWidth={isSearchOpen ? 2.5 : 2} />
                    <span className={labelBase}>Search</span>
                </div>

                <button
                    type="button"
                    onClick={onCreateClick}
                    aria-label="Create challenge"
                    className="relative -top-2 flex min-w-[4.5rem] flex-1 cursor-pointer flex-col items-center gap-1 border-0 bg-transparent p-0 text-[#211530] shadow-none outline-none hover:bg-transparent active:opacity-75 !border-0 !bg-transparent !shadow-none"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-[#e85a2d] text-white">
                        <CirclePlus className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                    <span className={`${labelBase} text-[#211530]`}>Create</span>
                </button>

                <Link
                    href="/leaderboard"
                    className={`${itemBase} ${isActive("/leaderboard") ? "text-[#e85a2d]" : "text-[#74645c]"}`}
                >
                    <Trophy className="h-6 w-6 shrink-0" strokeWidth={isActive("/leaderboard") ? 2.5 : 2} />
                    <span className={labelBase}>
                        Leaderboard
                    </span>
                </Link>

                <Link
                    href={profileHref}
                    className={`${itemBase} ${isActive("/profile") ? "text-[#e85a2d]" : "text-[#74645c]"}`}
                >
                    <UserRound className="h-6 w-6 shrink-0" strokeWidth={isActive("/profile") ? 2.5 : 2} />
                    <span className={labelBase}>Profile</span>
                </Link>
            </nav>
        </div>
    );
}
