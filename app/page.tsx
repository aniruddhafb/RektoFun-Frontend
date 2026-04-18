"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback } from "react";

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function Home() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [bubbleId, setBubbleId] = useState(0);

  const colors = [
    "#e85a2d", // orange
    "#f5d547", // yellow
    "#5ba8d8", // blue
    "#a8d85b", // green
    "#d85ba8", // pink
    "#855bd8", // purple
    "#ffffff", // white
  ];

  const handleHeroClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create multiple bubbles
    const newBubbles: Bubble[] = [];
    const count = 5 + Math.floor(Math.random() * 4); // 5-8 bubbles

    for (let i = 0; i < count; i++) {
      newBubbles.push({
        id: bubbleId + i,
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        size: 10 + Math.random() * 30,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setBubbleId((prev) => prev + count);
    setBubbles((prev) => [...prev, ...newBubbles]);

    // Remove bubbles after animation
    setTimeout(() => {
      setBubbles((prev) =>
        prev.filter((b) => !newBubbles.find((nb) => nb.id === b.id))
      );
    }, 800);
  }, [bubbleId]);

  return (
    <div className="h-[calc(100vh-80px-64px)] bg-[#f3e1d7] font-sans flex flex-col overflow-hidden">
      {/* Hero Section - Crazy Animated Scribbles */}
      <section
        className="relative flex-1 overflow-hidden flex items-center justify-center cursor-pointer"
        onClick={handleHeroClick}
      >
        {/* Click Bubbles */}
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

        {/* Animated Scribble Images - All 13 images with unique animations - INCREASED SIZES */}

        {/* Stars - Top Left - Gentle pulse and rotate */}
        <div className="hidden md:block absolute left-[2%] top-[3%] w-32 h-32 md:w-48 md:h-48 animate-airdrop delay-100">
          <div className="w-full h-full scribble-stars">
            <Image
              src="/scribbles/stars.png"
              alt="Stars"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* BTC - Top Right - Bouncy animation */}
        <div className="absolute right-[3%] top-[2%] w-28 h-28 md:w-44 md:h-44 animate-airdrop delay-200">
          <div className="w-full h-full scribble-btc">
            <Image
              src="/scribbles/btc.png"
              alt="Bitcoin"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Dollars - Left Upper - Slide and glow */}
        <div className="hidden md:block absolute left-[1%] top-[22%] w-36 h-36 md:w-52 md:h-52 animate-airdrop delay-300">
          <div className="w-full h-full scribble-dollars">
            <Image
              src="/scribbles/dollars.png"
              alt="Dollars"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* SOL - Right Upper - Spin slow */}
        <div className="hidden md:block absolute right-[2%] top-[25%] w-32 h-32 md:w-48 md:h-48 animate-airdrop delay-400">
          <div className="w-full h-full scribble-sol">
            <Image
              src="/scribbles/sol.png"
              alt="Solana"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Coins - Left Middle - Wobble */}
        <div className="hidden md:block absolute left-[3%] top-[48%] w-40 h-40 md:w-56 md:h-56 animate-airdrop delay-500">
          <div className="w-full h-full scribble-coins">
            <Image
              src="/scribbles/coins.png"
              alt="Coins"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Bags - Right Middle - Scale pulse */}
        <div className="hidden md:block absolute right-[2%] top-[50%] w-36 h-36 md:w-52 md:h-52 animate-airdrop delay-600">
          <div className="w-full h-full scribble-bags">
            <Image
              src="/scribbles/bags.png"
              alt="Money Bags"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* DOGE - Bottom Left - Shake and glow */}
        <div className="absolute left-[6%] bottom-[8%] w-32 h-32 md:w-48 md:h-48 animate-airdrop delay-700">
          <div className="w-full h-full scribble-doge">
            <Image
              src="/scribbles/doge.png"
              alt="Doge"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* PEPE - Bottom Right - Crazy wobble */}
        <div className="absolute right-[16%] bottom-[6%] w-32 h-32 md:w-48 md:h-48 animate-airdrop delay-800">
          <div className="w-full h-full scribble-pepe">
            <Image
              src="/scribbles/pepe.png"
              alt="Pepe"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* PENGU - Center Left - Gentle float with glow */}
        <div className="hidden md:block absolute left-[12%] top-[35%] w-28 h-28 md:w-40 md:h-40 animate-pop-in delay-300">
          <div className="w-full h-full scribble-pengu">
            <Image
              src="/scribbles/pengu.png"
              alt="Pengu"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* SHIBA - Center Right - Twitch animation */}
        <div className="hidden md:block absolute right-[12%] top-[38%] w-28 h-28 md:w-40 md:h-40 animate-pop-in delay-500">
          <div className="w-full h-full scribble-shiba">
            <Image
              src="/scribbles/shiba.png"
              alt="Shiba"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* TRUMP - Top Center-Left - Bounce rotate */}
        <div className="absolute left-[28%] top-[5%] w-24 h-24 md:w-36 md:h-36 animate-airdrop delay-900">
          <div className="w-full h-full scribble-trump">
            <Image
              src="/scribbles/trump.png"
              alt="Trump"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* USA - Bottom Center-Right - Wave animation */}
        {/* <div className="absolute right-[22%] bottom-[5%] w-28 h-28 md:w-40 md:h-40 animate-airdrop delay-1000">
          <div className="w-full h-full scribble-usa">
            <Image
              src="/scribbles/USA.png"
              alt="USA"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div> */}

        {/* PHANTOM - Center area - Ethereal float */}
        <div className="hidden md:block absolute left-[40%] top-[12%] w-24 h-24 md:w-32 md:h-32 animate-pop-in delay-700">
          <div className="w-full h-full scribble-phantom">
            <Image
              src="/scribbles/phantom (1).png"
              alt="Phantom"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Orange shape with lines */}
        <div className="hidden md:block absolute right-0 bottom-20 w-24 h-32 opacity-70">
          <svg
            viewBox="0 0 100 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              d="M100 0V140H20C0 140 0 100 20 80C40 60 60 40 80 20L100 0Z"
              fill="#e85a2d"
            />
            <path
              d="M20 100H80M25 115H85M30 130H90"
              stroke="black"
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* Center Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto pointer-events-none">
          {/* New Badge */}
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

          {/* Main Heading */}
          <h1 className="text-6xl lg:text-8xl font-bold tracking-tight text-black mb-6">
            REKTO.FUN
          </h1>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-gray-800 mb-10 max-w-xl mx-auto">
            The first PvP battleground for price predictions <br /> Prediction
            Markets 2.0 🪄
          </p>

          {/* CTA Button */}
          <Link href="/challenges" className="px-10 py-4 bg-black text-white text-base font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-lg cursor-pointer hover:scale-105 hover:shadow-glow pointer-events-auto">
            View Challenges ➝
          </Link>
        </div>

        {/* Bottom decorative elements */}
        {/* Yellow oval with lines */}
        <div className="hidden md:block absolute bottom-20 left-1/2 transform -translate-x-1/2 w-48 h-20 animate-float-gentle">
          <svg
            viewBox="0 0 200 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <ellipse cx="100" cy="40" rx="100" ry="40" fill="#f5d547" />
            <path
              d="M40 20C60 40 80 60 100 70M60 15C80 35 100 55 120 65M80 10C100 30 120 50 140 60M100 10C120 30 140 50 160 60"
              stroke="black"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Blue semi-circle */}
        <div className="absolute bottom-0 left-1/3 w-24 h-12 animate-float-updown">
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
            <path
              d="M20 50C20 35 35 25 50 25"
              stroke="black"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* Three black lines */}
        <div className="hidden md:block absolute bottom-1/3 left-1/3 w-16 h-16 animate-float-diagonal">
          <svg
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <line
              x1="10"
              y1="50"
              x2="30"
              y2="10"
              stroke="black"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="25"
              y1="55"
              x2="45"
              y2="15"
              stroke="black"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="40"
              y1="60"
              x2="60"
              y2="20"
              stroke="black"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Small sparkle */}
        <div className="hidden md:block absolute right-1/3 top-1/2 w-8 h-8 animate-spin-slow">
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
      </section>
    </div>
  );
}
