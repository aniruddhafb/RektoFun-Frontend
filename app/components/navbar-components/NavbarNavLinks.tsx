"use client";

import Link from "next/link";
import { NAV_LINKS } from "./navbarData";

type NavbarNavLinksProps = {
    isActive: (href: string) => boolean;
};

export function NavbarNavLinks({ isActive }: NavbarNavLinksProps) {
    return (
        <div className="bg-[#f3e1d7]/60 border-b border-gray-200/50 mt-[-12px]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="hidden md:flex items-center justify-center gap-8 h-12">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors cursor-pointer ${
                                isActive(link.href)
                                    ? "text-black font-semibold"
                                    : "text-gray-700 hover:text-black"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div
                    className="flex md:hidden items-center gap-6 h-12 overflow-x-auto whitespace-nowrap"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors cursor-pointer flex-shrink-0 ${
                                isActive(link.href)
                                    ? "text-black font-semibold"
                                    : "text-gray-700 hover:text-black"
                            }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
