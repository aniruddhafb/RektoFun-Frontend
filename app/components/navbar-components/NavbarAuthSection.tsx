"use client";

import { NavbarProfileDropdown } from "./NavbarProfileDropdown";

type NavbarAuthSectionProps = {
    authenticated: boolean;
    displayAddress: string;
    displayUsername: string;
    usdcBalance: number | null;
    isDropdownOpen: boolean;
    onAuth: () => void;
    onCloseDropdown: () => void;
    onLogout: () => void;
    onMouseEnterDropdown: () => void;
    onMouseLeaveDropdown: () => void;
    onOpenDeposit: () => void;
    profileHref: string;
};

export function NavbarAuthSection({
    authenticated,
    displayAddress,
    displayUsername,
    usdcBalance,
    isDropdownOpen,
    onAuth,
    onCloseDropdown,
    onLogout,
    onMouseEnterDropdown,
    onMouseLeaveDropdown,
    onOpenDeposit,
    profileHref,
}: NavbarAuthSectionProps) {
    const balanceDisplay = usdcBalance !== null
        ? `$${usdcBalance.toFixed(2)}`
        : '...';

    return (
        <div className="flex items-center gap-2 sm:gap-4">
            {authenticated ? (
                <div className="flex items-center gap-3">
                    {/* deposit section with SOL balance */}
                    <button
                        type="button"
                        onClick={onOpenDeposit}
                        className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-gray-400 hover:bg-white/80 text-black text-sm font-medium rounded-full transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">{balanceDisplay}</span>
                    </button>

                    <NavbarProfileDropdown
                        displayAddress={displayAddress}
                        displayUsername={displayUsername}
                        usdcBalance={usdcBalance}
                        isOpen={isDropdownOpen}
                        onClose={onCloseDropdown}
                        onMouseEnter={onMouseEnterDropdown}
                        onMouseLeave={onMouseLeaveDropdown}
                        onLogout={onLogout}
                        onOpenDeposit={onOpenDeposit}
                        profileHref={profileHref}
                    />
                </div>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={onAuth}
                        className="px-4 sm:px-6 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer border border-gray-700 rounded-full"
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        onClick={onAuth}
                        className="px-4 sm:px-6 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        Sign Up
                    </button>
                </>
            )}
        </div>
    );
}
