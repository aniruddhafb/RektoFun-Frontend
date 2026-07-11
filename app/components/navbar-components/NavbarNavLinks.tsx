import Link from "next/link";
import { Shield, Sword, Zap } from "lucide-react";
import { NAV_LINKS } from "./navbarData";

type NavbarNavLinksProps = {
    isActive: (href: string) => boolean;
};

export function NavbarNavLinks({ isActive }: NavbarNavLinksProps) {
    const navIconByHref = {
        "/challenges": Sword,
        "/leaderboard": Shield,
        "/activity": Zap,
    } as const;

    const renderNavIcon = (href: string) => {
        const Icon = navIconByHref[href as keyof typeof navIconByHref];

        if (!Icon) return null;

        const iconClassByHref = {
            "/challenges": "text-[#cb8a22]",
            "/leaderboard": "text-[#2e9ec3]",
            "/activity": "text-[#d9a31b]",
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
                <div className="hidden md:flex items-center justify-center gap-8 h-12">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-3 py-1.5 text-sm font-black uppercase tracking-[0.06em] transition-colors cursor-pointer flex items-center gap-2 ${isActive(link.href)
                                ? "text-[#e85a2d]"
                                : "text-gray-700 hover:text-[#e85a2d]"
                                }`}
                        >
                            {renderNavIcon(link.href)}
                            {link.label}
                        </Link>
                    ))}

                </div>

                {/* Mobile Nav - Show all links directly */}
                <div
                    className="flex md:hidden items-center gap-6 h-12 overflow-x-auto whitespace-nowrap"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-2 px-2 py-1 text-sm font-black transition-colors cursor-pointer flex-shrink-0 ${isActive(link.href)
                                ? "text-[#e85a2d]"
                                : "text-gray-700 hover:text-[#e85a2d]"
                                }`}
                        >
                            {renderNavIcon(link.href)}
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

