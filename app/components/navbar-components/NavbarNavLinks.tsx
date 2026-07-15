import Link from "next/link";
import { Gift, Shield, Sword, Zap } from "lucide-react";
import { NAV_LINKS } from "./navbarData";

type NavbarNavLinksProps = {
    isActive: (href: string) => boolean;
    onOpenReferral: () => void;
};

export function NavbarNavLinks({ isActive, onOpenReferral }: NavbarNavLinksProps) {
    const navIconByHref = {
        "/challenges": Sword,
        "/leaderboard": Shield,
        "/activity": Zap,
        "/refer": Gift,
    } as const;

    const renderNavIcon = (href: string) => {
        const Icon = navIconByHref[href as keyof typeof navIconByHref];

        if (!Icon) return null;

        const iconClassByHref = {
            "/challenges": "text-[#cb8a22]",
            "/leaderboard": "text-[#2e9ec3]",
            "/activity": "text-[#d9a31b]",
            "/refer": "text-[#d9a31b]",
        } as const;

        return (
            <Icon
                className={`h-4 w-4 shrink-0 stroke-[2.8] ${iconClassByHref[href as keyof typeof iconClassByHref]}`}
            />
        );
    };

    return (
        <div className="bg-[#f3e1d7]/80 border-black mt-[-6px]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Desktop Nav */}
                <div className="hidden items-center justify-center gap-2 h-12 md:flex lg:gap-5 xl:gap-8">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-2 py-1.5 text-xs font-black uppercase tracking-[0.04em] transition-colors cursor-pointer flex items-center gap-1.5 lg:px-3 lg:text-sm lg:tracking-[0.06em] lg:gap-2 ${isActive(link.href)
                                ? "text-[#e85a2d]"
                                : "text-gray-700 hover:text-[#e85a2d]"
                                }`}
                        >
                            {renderNavIcon(link.href)}
                            {link.label}
                        </Link>
                    ))}
                    <button type="button" onClick={onOpenReferral} className="flex cursor-pointer items-center gap-1.5 !border-0 !bg-transparent px-2 py-1.5 text-xs font-black uppercase tracking-[0.04em] text-gray-700 !shadow-none outline-none transition-colors hover:text-[#e85a2d] lg:gap-2 lg:px-3 lg:text-sm lg:tracking-[0.06em]">
                        {renderNavIcon("/refer")}
                        Refer &amp; Earn
                    </button>
                </div>

                {/* Compact, horizontally scrollable navigation for signed-in mobile users. */}
                <div className="scrollbar-hide flex h-12 items-center gap-4 overflow-x-auto whitespace-nowrap md:hidden">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex shrink-0 items-center gap-1.5 px-1 py-1 text-xs font-black uppercase tracking-[0.03em] transition-colors ${isActive(link.href)
                                ? "text-[#e85a2d]"
                                : "text-gray-700 hover:text-[#e85a2d]"
                                }`}
                        >
                            {renderNavIcon(link.href)}
                            {link.label}
                        </Link>
                    ))}
                    <button
                        type="button"
                        onClick={onOpenReferral}
                        className="flex shrink-0 cursor-pointer items-center gap-1.5 !border-0 !bg-transparent px-1 py-1 text-xs font-black uppercase tracking-[0.03em] text-gray-700 !shadow-none transition-colors hover:text-[#e85a2d]"
                    >
                        {renderNavIcon("/refer")}
                        Refer &amp; Earn
                    </button>
                </div>

            </div>
        </div>
    );
}

