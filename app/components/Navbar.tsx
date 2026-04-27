"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAccounts, useDisconnect, useModal } from "@phantom/react-sdk";
import { DepositModal } from "./DepositModal";
import {
    NavbarAuthSection,
    NavbarBrand,
    NavbarDesktopSearch,
    NavbarMobileBottomNav,
    NavbarNavLinks,
} from "./navbar-components";

export default function Navbar() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [username, setUsername] = useState("trader_123");
    const pathname = usePathname();

    const { open: openPhantomModal } = useModal();
    const accounts = useAccounts();
    const { disconnect } = useDisconnect();

    const connectedAccount = accounts?.[0];
    const walletAddress = connectedAccount?.address;
    const shortAddress = walletAddress
        ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
        : null;
    const defaultUsername = walletAddress
        ? `trader_${walletAddress.slice(0, 4).toLowerCase()}`
        : "trader_123";
    const displayUsername = username.trim() || defaultUsername;
    const authenticated = Boolean(walletAddress);
    const displayAddress = shortAddress ?? "Wallet not connected";
    const profileHref = walletAddress ? `/profile/${walletAddress}` : "/settings";

    const handleAuth = () => {
        openPhantomModal();
    };

    const handleLogout = async () => {
        try {
            await disconnect();
            setIsDropdownOpen(false);
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
        }
    };

    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === href;
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f3e1d7]/80 backdrop-blur-md border-b border-white-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <NavbarBrand />

                        <NavbarDesktopSearch
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                        />

                        <NavbarAuthSection
                            authenticated={authenticated}
                            displayAddress={displayAddress}
                            displayUsername={displayUsername}
                            isDropdownOpen={isDropdownOpen}
                            onAuth={handleAuth}
                            onCloseDropdown={() => setIsDropdownOpen(false)}
                            onLogout={handleLogout}
                            onMouseEnterDropdown={() => setIsDropdownOpen(true)}
                            onMouseLeaveDropdown={() => setIsDropdownOpen(false)}
                            onOpenDeposit={() => setIsDepositModalOpen(true)}
                            profileHref={profileHref}
                        />
                    </div>
                </div>

                <NavbarNavLinks isActive={isActive} />
            </nav>

            <div className="h-[128px] md:h-[128px]" />

            <style jsx>{`
                div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            <DepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
            />

            <NavbarMobileBottomNav isActive={isActive} profileHref={profileHref} />
        </>
    );
}
