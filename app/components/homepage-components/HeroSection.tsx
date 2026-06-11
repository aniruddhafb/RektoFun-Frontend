"use client";

import Link from "next/link";
import { useCallback, useState, type MouseEvent } from "react";

import { heroScribbles } from "./homepageData";
import { ScribbleAsset } from "./ScribbleAsset";

interface Bubble {
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
}

const bubbleColors = [
    "#e85a2d",
    "#f5d547",
    "#5ba8d8",
    "#a8d85b",
    "#d85ba8",
    "#855bd8",
    "#ffffff",
];

export function HeroSection() {
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [bubbleId, setBubbleId] = useState(0);

    const handleHeroClick = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const count = 5 + Math.floor(Math.random() * 4);

            const newBubbles: Bubble[] = Array.from({ length: count }, (_, index) => ({
                id: bubbleId + index,
                x: x + (Math.random() - 0.5) * 60,
                y: y + (Math.random() - 0.5) * 60,
                size: 10 + Math.random() * 30,
                color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
            }));

            setBubbleId((prev) => prev + count);
            setBubbles((prev) => [...prev, ...newBubbles]);

            window.setTimeout(() => {
                setBubbles((prev) =>
                    prev.filter((bubble) => !newBubbles.some((item) => item.id === bubble.id))
                );
            }, 800);
        },
        [bubbleId]
    );

    return (
        <section
            className="relative flex min-h-[calc(100vh-80px-64px)] items-center justify-center overflow-hidden px-3 py-8 cursor-pointer sm:px-4"
            onClick={handleHeroClick}
        >
            {bubbles.map((bubble) => (
                <div
                    key={bubble.id}
                    className="bubble-pop"
                    style={{
                        left: `${bubble.x}px`,
                        top: `${bubble.y}px`,
                        width: `${bubble.size}px`,
                        height: `${bubble.size}px`,
                        backgroundColor: bubble.color,
                    }}
                />
            ))}

            {heroScribbles.map((scribble) => (
                <ScribbleAsset key={scribble.src} {...scribble} />
            ))}

            <div className="absolute right-0 bottom-16 w-16 h-24 opacity-30 sm:opacity-45 md:bottom-12 md:w-[4.5rem] md:h-24 md:opacity-40 lg:bottom-16 lg:w-20 lg:h-28 lg:opacity-50 xl:bottom-20 xl:w-24 xl:h-32 xl:opacity-70">
                <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M100 0V140H20C0 140 0 100 20 80C40 60 60 40 80 20L100 0Z" fill="#e85a2d" />
                    <path d="M20 100H80M25 115H85M30 130H90" stroke="black" strokeWidth="3" />
                </svg>
            </div>

            <div className="pointer-events-none relative z-10 mx-auto w-full max-w-4xl px-2 text-center sm:px-6">
                {/* <div className="absolute -top-12 right-[5%] md:right-[2%]">
                    <div className="relative w-16 h-16 md:w-20 md:h-20">
                        <svg viewBox="0 0 80 80" className="w-full h-full rotate-12">
                            <polygon
                                points="40,0 45,15 60,10 52,25 65,35 50,40 55,55 40,48 25,55 30,40 15,35 28,25 20,10 35,15"
                                fill="#e85a2d"
                            />
                        </svg>
                        <span className="absolute inset-0 mb-4 flex items-center justify-center text-white text-[10px] md:text-xs font-bold rotate-12">
                            Beta
                        </span>
                    </div>
                </div> */}

                {/* <div className="mx-auto mb-5 inline-flex items-center gap-2 border border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[3px_3px_0_#111] animate-pop-in">
                    <span className="h-2 w-2 bg-[#e85a2d]" />
                    PvP Prediction Arena
                </div> */}

                <div className="mb-10 flex flex-wrap items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.14em] text-black">
                    <span className="border border-black bg-[#a8d85b] px-3 py-2 shadow-[2px_2px_0_#111] animate-float-gentle">
                        Permissionless
                    </span>
                    <span className="border border-black bg-[#e85a2d] px-3 py-2 text-white shadow-[2px_2px_0_#111] animate-float-diagonal">
                        PvP Battles
                    </span>
                    <span className="border border-black bg-[#f5d547] px-3 py-2 shadow-[2px_2px_0_#111] animate-float-updown">
                        On Solana
                    </span>
                </div>

                <h1 className="mb-4 break-words text-4xl font-black tracking-tight text-black drop-shadow-[4px_4px_0_#f5d547] animate-airdrop min-[380px]:text-5xl md:text-6xl lg:text-8xl">
                    REKTO.FUN
                </h1>

                <p className="mx-auto mb-8 max-w-xl break-words text-base font-semibold text-gray-800 min-[380px]:text-lg lg:text-xl">
                    The PvP Battleground For Predictions {"\u{1FA84}"}
                    <br />
                    Crypto & Sports 🏀
                </p>

                <Link
                    href="/beta"
                    className="pointer-events-auto inline-flex max-w-full items-center justify-center border-2 border-black bg-black px-5 py-2.5 text-xs font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#e85a2d] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#e85a2d] active:translate-y-0 active:shadow-[2px_2px_0_#e85a2d] min-[380px]:px-7 min-[380px]:text-sm sm:px-8 sm:py-3 cursor-pointer"
                >
                    Join Waitlist {"\u279D"}
                </Link>

            </div>

            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-14 opacity-35 blur-[0.2px] animate-float-gentle sm:bottom-16 sm:w-40 sm:h-16 sm:opacity-45 md:bottom-14 md:w-40 md:h-16 md:opacity-45 lg:bottom-16 lg:w-44 lg:h-[4.5rem] lg:opacity-60 xl:bottom-20 xl:w-48 xl:h-20 xl:opacity-100 md:blur-0">
                <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <ellipse cx="100" cy="40" rx="100" ry="40" fill="#f5d547" />
                    <path
                        d="M40 20C60 40 80 60 100 70M60 15C80 35 100 55 120 65M80 10C100 30 120 50 140 60M100 10C120 30 140 50 160 60"
                        stroke="black"
                        strokeWidth="2"
                    />
                </svg>
            </div>

            <div className="absolute bottom-0 left-[20%] w-16 h-8 opacity-30 animate-float-updown min-[380px]:left-1/3 min-[380px]:w-24 min-[380px]:h-12 min-[380px]:opacity-45 md:left-[28%] md:w-20 md:h-10 md:opacity-40 lg:left-[30%] lg:w-[5.5rem] lg:h-11 lg:opacity-55 xl:left-1/3 xl:w-24 xl:h-12 xl:opacity-100">
                <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M0 50C0 22 22 0 50 0C78 0 100 22 100 50V50H0Z" fill="#5ba8d8" />
                    <path d="M20 50C20 35 35 25 50 25" stroke="black" strokeWidth="2" />
                </svg>
            </div>

            <div className="absolute bottom-[28%] left-[8%] w-10 h-10 opacity-25 animate-float-diagonal sm:left-[12%] sm:w-12 sm:h-12 sm:opacity-35 md:bottom-[30%] md:left-[18%] md:w-12 md:h-12 md:opacity-30 lg:bottom-[31%] lg:left-[24%] lg:w-14 lg:h-14 lg:opacity-45 xl:bottom-1/3 xl:left-1/3 xl:w-16 xl:h-16 xl:opacity-100">
                <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <line x1="10" y1="50" x2="30" y2="10" stroke="black" strokeWidth="4" strokeLinecap="round" />
                    <line x1="25" y1="55" x2="45" y2="15" stroke="black" strokeWidth="4" strokeLinecap="round" />
                    <line x1="40" y1="60" x2="60" y2="20" stroke="black" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>

            <div className="absolute right-[10%] top-[18%] w-6 h-6 opacity-20 animate-spin-slow sm:right-[16%] sm:top-[22%] sm:w-7 sm:h-7 sm:opacity-30 md:right-[18%] md:top-[28%] md:w-6 md:h-6 md:opacity-25 lg:right-[24%] lg:top-[35%] lg:w-7 lg:h-7 lg:opacity-45 xl:right-1/3 xl:top-1/2 xl:w-8 xl:h-8 xl:opacity-100">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M20 0L22 16L20 18L18 16L20 0Z" fill="black" />
                    <path d="M20 40L22 24L20 22L18 24L20 40Z" fill="black" />
                    <path d="M0 20L16 22L18 20L16 18L0 20Z" fill="black" />
                    <path d="M40 20L24 22L22 20L24 18L40 20Z" fill="black" />
                </svg>
            </div>
        </section>
    );
}
