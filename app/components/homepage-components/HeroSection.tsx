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
            className="relative h-[calc(100vh-80px-64px)] overflow-hidden flex items-center justify-center cursor-pointer"
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

            <div className="hidden md:block absolute right-0 bottom-20 w-24 h-32 opacity-70">
                <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M100 0V140H20C0 140 0 100 20 80C40 60 60 40 80 20L100 0Z" fill="#e85a2d" />
                    <path d="M20 100H80M25 115H85M30 130H90" stroke="black" strokeWidth="3" />
                </svg>
            </div>

            <div className="relative z-10 text-center px-6 max-w-3xl mx-auto pointer-events-none">
                <div className="absolute -top-12 right-[5%] md:right-[2%]">
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
                </div>

                <h1 className="text-6xl lg:text-8xl font-bold tracking-tight text-black mb-6">
                    REKTO.FUN
                </h1>

                <p className="text-lg lg:text-xl text-gray-800 mb-10 max-w-xl mx-auto">
                    The first PvP battleground for price predictions
                    <br />
                    Prediction Markets 2.0 {"\u{1FA84}"}
                </p>

                <Link
                    href="/challenges"
                    className="px-10 py-4 bg-black text-white text-base font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-lg cursor-pointer hover:scale-105 hover:shadow-glow pointer-events-auto"
                >
                    View Challenges {"\u279D"}
                </Link>
            </div>

            <div className="hidden md:block absolute bottom-20 left-1/2 transform -translate-x-1/2 w-48 h-20 animate-float-gentle">
                <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <ellipse cx="100" cy="40" rx="100" ry="40" fill="#f5d547" />
                    <path
                        d="M40 20C60 40 80 60 100 70M60 15C80 35 100 55 120 65M80 10C100 30 120 50 140 60M100 10C120 30 140 50 160 60"
                        stroke="black"
                        strokeWidth="2"
                    />
                </svg>
            </div>

            <div className="absolute bottom-0 left-1/3 w-24 h-12 animate-float-updown">
                <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path d="M0 50C0 22 22 0 50 0C78 0 100 22 100 50V50H0Z" fill="#5ba8d8" />
                    <path d="M20 50C20 35 35 25 50 25" stroke="black" strokeWidth="2" />
                </svg>
            </div>

            <div className="hidden md:block absolute bottom-1/3 left-1/3 w-16 h-16 animate-float-diagonal">
                <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <line x1="10" y1="50" x2="30" y2="10" stroke="black" strokeWidth="4" strokeLinecap="round" />
                    <line x1="25" y1="55" x2="45" y2="15" stroke="black" strokeWidth="4" strokeLinecap="round" />
                    <line x1="40" y1="60" x2="60" y2="20" stroke="black" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>

            <div className="hidden md:block absolute right-1/3 top-1/2 w-8 h-8 animate-spin-slow">
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
