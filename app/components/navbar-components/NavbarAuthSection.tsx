"use client";

import { NavbarProfileDropdown } from "./NavbarProfileDropdown";

type NavbarAuthSectionProps = {
    authenticated: boolean;
    displayAddress: string;
    displayUsername: string;
    displayProfileImage: string | null;
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
    profileHref: string;
    isMobileViewport: boolean;
};

export function NavbarAuthSection({
    authenticated,
    displayAddress,
    displayUsername,
    displayProfileImage,
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
    profileHref,
    isMobileViewport,
}: NavbarAuthSectionProps) {
    const balanceDisplay = usdcBalance !== null
        ? `$${usdcBalance.toFixed(2)}`
        : '$0.00';

    return (
        <div className="flex items-center gap-2 sm:gap-4">
            {authenticated ? (
                <div className="flex items-center gap-3">
                    {/* deposit section with SOL balance */}
                    <button
                        type="button"
                        onClick={onOpenDeposit}
                        className="flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-sm font-black text-black shadow-[2px_2px_0_#111] transition-all hover:-translate-y-0.5 hover:bg-[#a8d85b] cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">{balanceDisplay}</span>
                    </button>

                    <NavbarProfileDropdown
                        displayAddress={displayAddress}
                        displayUsername={displayUsername}
                        displayProfileImage={displayProfileImage}
                        usdcBalance={usdcBalance}
                        isOpen={isDropdownOpen}
                        onClose={onCloseDropdown}
                        onMouseEnter={onMouseEnterDropdown}
                        onMouseLeave={onMouseLeaveDropdown}
                        onToggle={onToggleDropdown}
                        onLogout={onLogout}
                        onOpenDeposit={onOpenDeposit}
                        onOpenWithdraw={onOpenWithdraw}
                        profileHref={profileHref}
                        isMobileViewport={isMobileViewport}
                    />
                </div>
            ) : (
                <>
                    <button
                        type="button"
                        onClick={onAuth}
                        className="border-2 border-black bg-white px-4 py-2 text-sm font-black text-gray-800 shadow-[2px_2px_0_#111] transition-all hover:-translate-y-0.5 hover:bg-[#f5d547] cursor-pointer sm:px-6"
                    >
                        Log In
                    </button>
                    <button
                        type="button"
                        onClick={onAuth}
                        className="border-2 border-black bg-black px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#e85a2d] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#e85a2d] cursor-pointer sm:px-6"
                    >
                        Sign Up
                    </button>
                </>
            )}
        </div>
    );
}
