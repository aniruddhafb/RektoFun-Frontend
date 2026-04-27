"use client";

import { NavbarProfileDropdown } from "./NavbarProfileDropdown";

type NavbarAuthSectionProps = {
    authenticated: boolean;
    displayAddress: string;
    displayUsername: string;
    isDropdownOpen: boolean;
    onAuth: () => void;
    onCloseDropdown: () => void;
    onLogout: () => void;
    onMouseEnterDropdown: () => void;
    onMouseLeaveDropdown: () => void;
    onOpenDeposit: () => void;
    onOpenProfileEditor: () => void;
    profileHref: string;
};

export function NavbarAuthSection({
    authenticated,
    displayAddress,
    displayUsername,
    isDropdownOpen,
    onAuth,
    onCloseDropdown,
    onLogout,
    onMouseEnterDropdown,
    onMouseLeaveDropdown,
    onOpenDeposit,
    onOpenProfileEditor,
    profileHref,
}: NavbarAuthSectionProps) {
    return (
        <div className="flex items-center gap-2 sm:gap-4">
            {authenticated ? (
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onOpenDeposit}
                        className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-gray-400 hover:bg-white/80 text-black text-sm font-medium rounded-full transition-colors cursor-pointer"
                    >
                        $
                        Deposit
                    </button>

                    <NavbarProfileDropdown
                        displayAddress={displayAddress}
                        displayUsername={displayUsername}
                        isOpen={isDropdownOpen}
                        onClose={onCloseDropdown}
                        onMouseEnter={onMouseEnterDropdown}
                        onMouseLeave={onMouseLeaveDropdown}
                        onLogout={onLogout}
                        onOpenDeposit={onOpenDeposit}
                        onOpenProfileEditor={onOpenProfileEditor}
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
