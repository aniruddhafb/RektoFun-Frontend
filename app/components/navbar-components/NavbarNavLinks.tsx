"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Shield, Sword, Zap } from "lucide-react";
import { NAV_LINKS, MORE_LINKS } from "./navbarData";

type NavbarNavLinksProps = {
    isActive: (href: string) => boolean;
};

export function NavbarNavLinks({ isActive }: NavbarNavLinksProps) {
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const navIconByHref = {
        "/challenges": Sword,
        "/markets": Search,
        "/clans": Shield,
        "/activity": Zap,
    } as const;

    const renderNavIcon = (href: string) => {
        const Icon = navIconByHref[href as keyof typeof navIconByHref];

        if (!Icon) return null;

        const iconClassByHref = {
            "/challenges": "text-[#cb8a22]",
            "/markets": "text-[#2e9ec3]",
            "/clans": "text-[#4b6fd1]",
            "/activity": "text-[#d9a31b]",
        } as const;

        return (
            <Icon
                className={`h-4 w-4 shrink-0 stroke-[2.8] ${iconClassByHref[href as keyof typeof iconClassByHref]}`}
            />
        );
    };

    return (
        <div className="bg-[#f3e1d7]/60 border-b border-gray-200/50 mt-[-12px]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                {/* Desktop Nav */}
                <div className="hidden md:flex items-center justify-center gap-8 h-12">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${isActive(link.href)
                                ? "text-black font-semibold"
                                : "text-gray-700 hover:text-black"
                                }`}
                        >
                            {renderNavIcon(link.href)}
                            {link.label}
                        </Link>
                    ))}

                    {/* More Dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsMoreOpen(true)}
                        onMouseLeave={() => setIsMoreOpen(false)}
                    >
                        <div
                            className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer flex items-center gap-1"
                        >
                            More
                            <svg
                                className={`w-4 h-4 transition-transform ${isMoreOpen ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        {isMoreOpen && (
                            <div className="absolute right-0 top-full pt-2 w-48 z-40">
                                <div className="bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                                    {MORE_LINKS.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            target={link.href.startsWith("http") ? "_blank" : undefined}
                                            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                                            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${isActive(link.href)
                                                ? "text-black font-semibold bg-gray-100"
                                                : "text-gray-700 hover:text-black hover:bg-gray-50"
                                                }`}
                                        >
                                            {link.label}
                                            {link.href.startsWith("http") && (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Nav - Show all links directly */}
                <div
                    className="flex md:hidden items-center gap-6 h-12 overflow-x-auto whitespace-nowrap"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                    {[...NAV_LINKS, ...MORE_LINKS].map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            target={link.href.startsWith("http") ? "_blank" : undefined}
                            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer flex-shrink-0 ${isActive(link.href)
                                ? "text-black font-semibold"
                                : "text-gray-700 hover:text-black"
                                }`}
                        >
                            {renderNavIcon(link.href)}
                            {link.label}
                            {link.href.startsWith("http") && (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

