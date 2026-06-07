"use client";

import { DepositModal } from "./DepositModal";
import * as components from "./navbar-components";
import { useNavbar } from "@/app/hooks/useNavbar";

export default function Navbar() {
    const {
        // UI state
        searchQuery,
        setSearchQuery,
        isSearchModalOpen,
        setIsSearchModalOpen,
        isDropdownOpen,
        setIsDropdownOpen,
        isDepositModalOpen,
        setIsDepositModalOpen,
        fundsModalMode,
        setFundsModalMode,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isMobileViewport,

        // Profile form state
        editUsername,
        setEditUsername,
        editBio,
        setEditBio,
        editProfileIndex,
        setEditProfileIndex,
        editInviteCode,
        setEditInviteCode,
        profileFormError,
        setProfileFormError,

        // User data
        userProfileData,
        displayAddress,
        displayUsername,

        // Handlers
        handleProfileSubmit,
        generateRandomUsername,
        randomizeProfile,
        handleConnect,
        handleLogout,
        handleMobileCreateClick,
        isActive,
        profileHref,

        isConnected
    } = useNavbar();

    return (
        <>
            {/* Development Mode Banner */}
            <div className="fixed top-0 left-0 right-0 z-[30] border-b-2 border-black bg-[#f5d547]">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-black font-black text-center hidden md:block">
                        Devnet Mode — We Are Currently Operating On Solana Devnet
                    </p>
                    <p className="text-sm text-black font-black text-center md:hidden">
                        Currently In Devnet Mode
                    </p>
                </div>
            </div>

            {/* Main Navbar */}
            <nav className="fixed top-8 left-0 right-0 z-[40] bg-[#f3e1d7]/95 shadow-[0_2px_0_#111] backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <components.NavbarBrand />
                        
                        <components.NavbarDesktopSearch
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            isModalOpen={isSearchModalOpen}
                            onOpenModal={() => setIsSearchModalOpen(true)}
                            onCloseModal={() => setIsSearchModalOpen(false)}
                        />

                        <components.NavbarAuthSection
                            authenticated={isConnected}
                            displayAddress={displayAddress || ""}
                            displayUsername={displayUsername}
                            displayProfileImage={userProfileData?.profileImage || null}
                            usdcBalance={0}
                            isDropdownOpen={isDropdownOpen}
                            onAuth={handleConnect}
                            onCloseDropdown={() => setIsDropdownOpen(false)}
                            onLogout={handleLogout}
                            onMouseEnterDropdown={() => setIsDropdownOpen(true)}
                            onMouseLeaveDropdown={() => setIsDropdownOpen(false)}
                            onToggleDropdown={() => setIsDropdownOpen((prev) => !prev)}
                            onOpenDeposit={() => {
                                setFundsModalMode("deposit");
                                setIsDepositModalOpen(true);
                            }}
                            onOpenWithdraw={() => {
                                setFundsModalMode("withdraw");
                                setIsDepositModalOpen(true);
                            }}
                            profileHref={profileHref}
                            isMobileViewport={isMobileViewport}
                        />
                    </div>
                </div>

                <components.NavbarNavLinks isActive={isActive} />
            </nav>

            <div className="h-[88px] md:h-[128px]" />

            {isDropdownOpen && (
                <div className="fixed inset-0 z-[35]" onClick={() => setIsDropdownOpen(false)} />
            )}

            <components.CreateProfileModal
                isOpen={isProfileModalOpen}
                editProfileIndex={editProfileIndex}
                editUsername={editUsername}
                editBio={editBio}
                editInviteCode={editInviteCode}
                profileFormError={profileFormError}
                onRandomizeProfile={randomizeProfile}
                onRandomizeUsername={generateRandomUsername}
                onEditUsernameChange={(value) => {
                    setEditUsername(value);
                    if (profileFormError) setProfileFormError(null);
                }}
                onEditBioChange={(value) => {
                    setEditBio(value);
                    if (profileFormError) setProfileFormError(null);
                }}
                onEditInviteCodeChange={setEditInviteCode}
                onSubmit={handleProfileSubmit}
            />

            {isDepositModalOpen && (
                <DepositModal
                    isOpen={isDepositModalOpen}
                    onClose={() => setIsDepositModalOpen(false)}
                    initialMode={fundsModalMode}
                />
            )}

            <components.NavbarMobileBottomNav
                isActive={isActive}
                profileHref={profileHref}
                onSearchClick={() => setIsSearchModalOpen(true)}
                onCreateClick={handleMobileCreateClick}
                isSearchOpen={isSearchModalOpen}
            />
        </>
    );
}
