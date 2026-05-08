"use client";

import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-80px-64px)] bg-[#f3e1d7] font-sans flex flex-col items-center justify-center relative overflow-hidden px-4">
            {/* Decorative Scribbles */}

            {/* BTC - Top Left */}
            <div className="absolute left-[5%] top-[10%] w-24 h-24 md:w-36 md:h-36 animate-airdrop delay-100">
                <div className="relative w-full h-full scribble-btc">
                    <Image
                        src="/scribbles/btc.png"
                        alt="Bitcoin"
                        fill
                        className="object-contain opacity-60"
                        sizes="144px"
                    />
                </div>
            </div>

            {/* SOL - Top Right */}
            <div className="absolute right-[5%] top-[15%] w-20 h-20 md:w-32 md:h-32 animate-airdrop delay-200">
                <div className="relative w-full h-full scribble-sol">
                    <Image
                        src="/scribbles/sol.png"
                        alt="Solana"
                        fill
                        className="object-contain opacity-60"
                        sizes="128px"
                    />
                </div>
            </div>

            {/* DOGE - Bottom Left */}
            <div className="absolute left-[8%] bottom-[15%] w-28 h-28 md:w-40 md:h-40 animate-airdrop delay-300">
                <div className="relative w-full h-full scribble-doge">
                    <Image
                        src="/scribbles/doge.png"
                        alt="Doge"
                        fill
                        className="object-contain opacity-50"
                        sizes="160px"
                    />
                </div>
            </div>

            {/* PEPE - Bottom Right */}
            <div className="absolute right-[10%] bottom-[10%] w-24 h-24 md:w-36 md:h-36 animate-airdrop delay-400">
                <div className="relative w-full h-full scribble-pepe">
                    <Image
                        src="/scribbles/pepe.png"
                        alt="Pepe"
                        fill
                        className="object-contain opacity-50"
                        sizes="144px"
                    />
                </div>
            </div>

            {/* Coins - Center Left */}
            <div className="hidden md:block absolute left-[15%] top-[40%] w-20 h-20 animate-airdrop delay-500">
                <div className="relative w-full h-full scribble-coins">
                    <Image
                        src="/scribbles/coins.png"
                        alt="Coins"
                        fill
                        className="object-contain opacity-40"
                        sizes="80px"
                    />
                </div>
            </div>

            {/* Bags - Center Right */}
            <div className="hidden md:block absolute right-[15%] top-[45%] w-20 h-20 animate-airdrop delay-600">
                <div className="relative w-full h-full scribble-bags">
                    <Image
                        src="/scribbles/bags.png"
                        alt="Money Bags"
                        fill
                        className="object-contain opacity-40"
                        sizes="80px"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 text-center max-w-2xl mx-auto">
                {/* 404 Number */}
                <div className="relative mb-6">
                    <h1 className="text-[120px] md:text-[180px] font-bold leading-none tracking-tighter text-black select-none">
                        404
                    </h1>
                    {/* Decorative line through 404 */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-2 bg-[#e85a2d] rotate-[-3deg] opacity-80"></div>
                </div>

                {/* Error Message */}
                <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                    Page Not Found
                </h2>

                <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-md mx-auto">
                    Oops! Looks like this page got rekt. The market can be unpredictable, and so can URLs.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="px-8 py-4 bg-black text-white text-base font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:scale-105 hover:shadow-glow"
                    >
                        Go Home ➝
                    </Link>
                    <Link
                        href="/challenges"
                        className="px-8 py-4 bg-[#e85a2d] text-white text-base font-semibold rounded-lg hover:bg-[#d14d24] transition-all shadow-lg hover:scale-105"
                    >
                        View Challenges
                    </Link>
                </div>
            </div>

            {/* Bottom decorative elements */}
            {/* Yellow oval */}
            <div className="hidden md:block absolute bottom-20 left-1/4 w-32 h-12 animate-float-gentle opacity-60">
                <svg
                    viewBox="0 0 200 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    <ellipse cx="100" cy="40" rx="100" ry="40" fill="#f5d547" />
                </svg>
            </div>

            {/* Blue semi-circle */}
            <div className="absolute bottom-10 right-1/4 w-16 h-8 animate-float-updown opacity-60">
                <svg
                    viewBox="0 0 100 50"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    <path
                        d="M0 50C0 22 22 0 50 0C78 0 100 22 100 50V50H0Z"
                        fill="#5ba8d8"
                    />
                </svg>
            </div>

            {/* Small sparkle */}
            <div className="hidden md:block absolute left-1/3 top-1/4 w-6 h-6 animate-spin-slow opacity-50">
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    <path d="M20 0L22 16L20 18L18 16L20 0Z" fill="black" />
                    <path d="M20 40L22 24L20 22L18 24L20 40Z" fill="black" />
                    <path d="M0 20L16 22L18 20L16 18L0 20Z" fill="black" />
                    <path d="M40 20L24 22L22 20L24 18L40 20Z" fill="black" />
                </svg>
            </div>
        </div>
    );
}
