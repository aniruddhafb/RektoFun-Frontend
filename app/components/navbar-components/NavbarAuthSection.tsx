"use client";

import Link from "next/link";
import { NavbarProfileDropdown } from "./NavbarProfileDropdown";
import { NotificationBell } from "./NotificationBell";

type NavbarAuthSectionProps = {
    isHomePage?: boolean;
    authenticated: boolean;
    displayAddress: string;
    displayUsername: string;
    displayProfileImage: string | null;
    isXVerified: boolean;
    isModerator: boolean;
    usdcBalance: number | null;
    isDropdownOpen: boolean;
    onAuth: () => void;
    onCloseDropdown: () => void;
    onLogout: () => void;
    onMouseEnterDropdown: () => void;
    onMouseLeaveDropdown: () => void;
    onToggleDropdown: () => void;
    onOpenDeposit: () => void;
    onOpenWithdraw: () => void;
    onOpenReferral: () => void;
    onOpenEditProfile: () => void;
    onOpenSettings: () => void;
    profileHref: string;
    isMobileViewport: boolean;
};

export function NavbarAuthSection({
    isHomePage = false,
    authenticated,
    displayAddress,
    displayUsername,
    displayProfileImage,
    isXVerified,
    isModerator,
    usdcBalance,
    isDropdownOpen,
    onAuth,
    onCloseDropdown,
    onLogout,
    onMouseEnterDropdown,
    onMouseLeaveDropdown,
    onToggleDropdown,
    onOpenDeposit,
    onOpenWithdraw,
    onOpenReferral,
    onOpenEditProfile,
    onOpenSettings,
    profileHref,
    isMobileViewport,
}: NavbarAuthSectionProps) {
    const balanceDisplay = usdcBalance !== null
        ? `$${usdcBalance.toFixed(2)}`
        : '$0.00';

    return (
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
            {authenticated ? (
                <div className="flex items-center gap-1.5 sm:gap-3">
                    {/* deposit section with SOL balance */}
                    <button
                        type="button"
                        onClick={onOpenDeposit}
                        className="flex items-center gap-1.5 border-2 border-black bg-white p-2 text-sm font-black text-black shadow-[2px_2px_0_#111] transition-all hover:-translate-y-0.5 hover:bg-[#a8d85b] cursor-pointer min-[480px]:px-4"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="whitespace-nowrap text-xs font-semibold text-gray-900 min-[380px]:text-sm">{balanceDisplay}</span>
                    </button>

                    <NotificationBell />

                    <NavbarProfileDropdown
                        displayAddress={displayAddress}
                        displayUsername={displayUsername}
                        displayProfileImage={displayProfileImage}
                        isXVerified={isXVerified}
                        isModerator={isModerator}
                        usdcBalance={usdcBalance}
                        isOpen={isDropdownOpen}
                        onClose={onCloseDropdown}
                        onMouseEnter={onMouseEnterDropdown}
                        onMouseLeave={onMouseLeaveDropdown}
                        onToggle={onToggleDropdown}
                        onLogout={onLogout}
                        onOpenDeposit={onOpenDeposit}
                        onOpenWithdraw={onOpenWithdraw}
                        onOpenReferral={onOpenReferral}
                        onOpenEditProfile={onOpenEditProfile}
                        onOpenSettings={onOpenSettings}
                        profileHref={profileHref}
                        isMobileViewport={isMobileViewport}
                    />
                </div>
            ) : isHomePage ? (
                <Link
                    href="/challenges"
                    className="border-2 border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.04em] text-white shadow-[3px_3px_0_#e85a2d] transition-all hover:-translate-y-0.5 hover:bg-[#e85a2d] cursor-pointer min-[380px]:px-4 sm:px-6 sm:text-sm"
                >
                    Get Started
                </Link>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={onAuth}
                        className="border-2 border-black bg-white px-2.5 py-2 text-xs font-black text-gray-800 shadow-[2px_2px_0_#111] transition-all hover:-translate-y-0.5 hover:bg-[#f5d547] cursor-pointer min-[380px]:px-3 sm:px-6 sm:text-sm"
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        onClick={onAuth}
                        className="border-2 border-black bg-black px-2.5 py-2 text-xs font-black text-white shadow-[3px_3px_0_#e85a2d] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#e85a2d] cursor-pointer min-[380px]:px-3 sm:px-6 sm:text-sm"
                    >
                        Sign Up
                    </button>
                </>
            )}
        </div>
    );
}
