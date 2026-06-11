"use client";

import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    return (
        <>
            {/* Beta Waitlist Banner */}
            <div className="fixed top-0 left-0 right-0 z-[30] border-b-2 border-black bg-[#f5d547]">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-orange-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2c0 2-2 3.5-2 6 0 1.5.8 2.8 2 3.4-.6-.6-1-1.5-1-2.4 0-1.5 1-2.5 1-4 0 3-4 4.5-4 8.5 0 2.2 1.2 4.2 3 5.3-.8-1-1.2-2.2-1.2-3.5 0-2.5 1.5-4.5 3.2-6C10 6 9 7.5 9 9.5c0 1.5.8 2.8 2 3.4-.6-.6-1-1.5-1-2.4 0-3 3-5 5.5-6.5-.5 1-1.5 2-1.5 3.5 0 1.5.8 2.8 2 3.4-.6-.6-1-1.4-1-2.4 0-2 2-4 4-5.5 0 0-1 1.5-1 3 0 1.5.8 2.8 2 3.4-.6-.6-1-1.4-1-2.4 0-2.5 2-5 4-6.5 0 0-1 1.5-1 3 0 1.5.8 2.8 2 3.4-.6-.6-1-1.4-1-2.4 0-3.5 2.5-6.5 5-8-.5 1-1 2.5-1 4 0 1.5.8 2.8 2 3.4-.6-.6-1-1.4-1-2.4 0-4 3-7.5 7-8.5z" />
                    </svg>
                    <p className="text-sm text-black font-black text-center">
                        Mainnet Beta Version Will Be Live Soon!!!
                    </p>
                </div>
            </div>

            {/* Simple Header - Logo, How it works, Social Icons */}
            <nav className="fixed top-8 left-0 right-0 z-[40] bg-[#f3e1d7]/95 shadow-[0_2px_0_#111] backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Original Logo */}
                        <Link href="/" className="border-2 border-transparent px-2 py-1 transition-all hover:border-black hover:bg-white hover:shadow-[2px_2px_0_#111]">
                            <Image
                                src="/logos/mainlogo.png"
                                alt="REKTO"
                                width={220}
                                height={60}
                                className="h-6 sm:h-8 w-auto"
                                priority
                            />
                        </Link>

                        {/* Right side - How it works + Social Icons */}
                        <div className="flex items-center gap-6">
                            {/* How it works link */}
                            <Link
                                href="/how-it-works"
                                className="text-sm font-bold text-black hover:text-[#9945FF] transition-colors"
                            >
                                How it works?
                            </Link>

                            {/* Social Icons */}
                            <div className="flex items-center gap-3">
                                {/* Twitter/X */}
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#9945FF] transition-colors"
                                    aria-label="Twitter"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                </a>

                                {/* Discord */}
                                <a
                                    href="https://discord.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#9945FF] transition-colors"
                                    aria-label="Discord"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Spacer for fixed header */}
            <div className="h-[72px]" />
        </>
    );
}
