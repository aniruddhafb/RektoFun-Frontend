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
    <div className="bg-[#f3e1d7] font-sans flex flex-col">
      {/* Hero Section - Crazy Animated Scribbles */}
      <section
        className="relative h-[calc(100vh-80px-64px)] overflow-hidden flex items-center justify-center cursor-pointer"
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

      {/* ============================================
          5 WAYS TO EARN SECTION
          ============================================ */}
      <section className="px-4 sm:px-6 lg:px-8 xl:px-12 py-16 sm:py-20">
        <div className="max-w-5xl mx-auto">

          {/* Section Header */}
          <div className="mb-12">
            {/* Sparkle decorations */}
            <div className="flex flex-col items-center gap-3 mb-3">
              <h2 className="text-4xl sm:text-5xl font-bold text-black leading-tight text-center">
                MULTIPLE WAYS TO{" "}
                <span className="text-[#e85a2d]">WIN 🏆</span>
              </h2>
            </div>
            <p className="text-gray-500 text-base sm:text-lg text-center mt-4">
              PREDICT & COMPETE | CLIMB & WIN 💰
            </p>
          </div>

          {/* Cards Grid - 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

            {/* Card 01 - Creating Challenges */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Number badge */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                      <span className="text-[#e85a2d] font-bold text-lg">01</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">Creating Challenges</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Set up your own prediction challenges across crypto, stocks, or real-world events.
                      </p>
                      <a
                        href="https://rektofun.gitbook.io/rektofun/introduction/earning-opportunities#id-1.-creating-challenges"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#e85a2d] text-xs font-medium hover:underline mt-2"
                      >
                        Read more →
                      </a>
                    </div>
                  </div>
                  {/* Illustration */}
                  <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                      {/* Clipboard body */}
                      <rect x="18" y="20" width="58" height="68" rx="6" fill="#f5d5c0" stroke="#d4956a" strokeWidth="2" />
                      {/* Clipboard top clip */}
                      <rect x="35" y="14" width="30" height="14" rx="4" fill="#e8b090" stroke="#d4956a" strokeWidth="2" />
                      {/* Lines on clipboard */}
                      <rect x="28" y="42" width="38" height="4" rx="2" fill="#d4956a" opacity="0.5" />
                      <rect x="28" y="52" width="30" height="4" rx="2" fill="#d4956a" opacity="0.5" />
                      <rect x="28" y="62" width="34" height="4" rx="2" fill="#d4956a" opacity="0.5" />
                      {/* Chart bars */}
                      <rect x="28" y="72" width="8" height="10" rx="1" fill="#e85a2d" opacity="0.7" />
                      <rect x="40" y="66" width="8" height="16" rx="1" fill="#e85a2d" opacity="0.8" />
                      <rect x="52" y="60" width="8" height="22" rx="1" fill="#e85a2d" />
                      {/* Plus circle */}
                      <circle cx="76" cy="72" r="12" fill="#e85a2d" />
                      <path d="M76 66V78M70 72H82" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* How you win */}
              <div className="px-6 pb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fdf0eb] border border-[#f5c9b8] rounded-full mb-4">
                  <span className="text-[#e85a2d] text-xs font-semibold">How you win:</span>
                </div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">🏆</span>
                    Benefit from participation dynamics and higher activity
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">👥</span>
                    Attract more users with quality challenges
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">📈</span>
                    Early creators in trending markets win more
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 02 - Accepting Challenges */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                      <span className="text-[#e85a2d] font-bold text-lg">02</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">Accepting Challenges</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Join existing challenges and compete in real-time PvP prediction battles.
                      </p>
                    </div>
                  </div>
                  {/* Crossed swords illustration */}
                  <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                      {/* Sword 1 */}
                      <line x1="20" y1="20" x2="80" y2="80" stroke="#c0b090" strokeWidth="6" strokeLinecap="round" />
                      <rect x="14" y="14" width="14" height="6" rx="2" fill="#a09070" transform="rotate(-45 21 17)" />
                      <rect x="16" y="72" width="20" height="10" rx="3" fill="#c8a870" />
                      {/* Sword 2 */}
                      <line x1="80" y1="20" x2="20" y2="80" stroke="#c0b090" strokeWidth="6" strokeLinecap="round" />
                      <rect x="72" y="14" width="14" height="6" rx="2" fill="#a09070" transform="rotate(45 79 17)" />
                      <rect x="64" y="72" width="20" height="10" rx="3" fill="#c8a870" />
                      {/* Cross guard sword 1 */}
                      <rect x="30" y="28" width="18" height="5" rx="2" fill="#a09070" transform="rotate(-45 39 30)" />
                      {/* Cross guard sword 2 */}
                      <rect x="52" y="28" width="18" height="5" rx="2" fill="#a09070" transform="rotate(45 61 30)" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fdf0eb] border border-[#f5c9b8] rounded-full mb-4">
                  <span className="text-[#e85a2d] text-xs font-semibold">How you win:</span>
                </div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">🎯</span>
                    Win challenges with accurate predictions
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">💰</span>
                    Win rewards based on your performance
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">⭐</span>
                    Participate and win REKT points
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 03 - Ranking on the Leaderboard */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                      <span className="text-[#e85a2d] font-bold text-lg">03</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">Ranking on the Leaderboard</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Climb the leaderboard and showcase your trading skills and consistency.
                      </p>
                    </div>
                  </div>
                  {/* Trophy podium illustration */}
                  <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                      {/* Trophy cup */}
                      <path d="M38 10 H62 V38 C62 52 50 58 50 58 C50 58 38 52 38 38 Z" fill="#f5c842" stroke="#d4a820" strokeWidth="1.5" />
                      {/* Trophy handles */}
                      <path d="M38 18 C28 18 24 28 30 34 C33 37 38 36 38 36" stroke="#d4a820" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <path d="M62 18 C72 18 76 28 70 34 C67 37 62 36 62 36" stroke="#d4a820" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      {/* Trophy stem */}
                      <rect x="46" y="58" width="8" height="10" fill="#d4a820" />
                      <rect x="40" y="68" width="20" height="5" rx="2" fill="#d4a820" />
                      {/* Sparkles */}
                      <circle cx="30" cy="20" r="2" fill="#f5c842" />
                      <circle cx="70" cy="18" r="1.5" fill="#f5c842" />
                      <circle cx="25" cy="35" r="1.5" fill="#f5c842" />
                      <circle cx="75" cy="32" r="2" fill="#f5c842" />
                      {/* Podium */}
                      <rect x="10" y="82" width="22" height="14" rx="2" fill="#c0b090" />
                      <text x="21" y="93" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">2</text>
                      <rect x="39" y="76" width="22" height="20" rx="2" fill="#e85a2d" />
                      <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">1</text>
                      <rect x="68" y="85" width="22" height="11" rx="2" fill="#c0b090" />
                      <text x="79" y="94" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">3</text>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fdf0eb] border border-[#f5c9b8] rounded-full mb-4">
                  <span className="text-[#e85a2d] text-xs font-semibold">How you win:</span>
                </div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">📊</span>
                    Top rankings get rewards from prize pools
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">🥇</span>
                    Higher ranks mean more visibility and reputation
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">👑</span>
                    Consistency leads to recurring winnings
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 04 - Referring People */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                      <span className="text-[#e85a2d] font-bold text-lg">04</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black mb-2">Referring People</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">
                        Invite friends and grow the community while you win.
                      </p>
                    </div>
                  </div>
                  {/* People / referral illustration */}
                  <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                      {/* Back person (left) */}
                      <circle cx="30" cy="38" r="12" fill="#d4c4b0" />
                      <path d="M12 80 C12 62 48 62 48 80" fill="#d4c4b0" />
                      {/* Back person (right) */}
                      <circle cx="58" cy="34" r="12" fill="#c8b8a4" />
                      <path d="M40 76 C40 58 76 58 76 76" fill="#c8b8a4" />
                      {/* Front person (center) */}
                      <circle cx="50" cy="42" r="14" fill="#bfaf9c" />
                      <path d="M28 88 C28 68 72 68 72 88" fill="#bfaf9c" />
                      {/* Plus badge */}
                      <circle cx="78" cy="72" r="13" fill="#e85a2d" />
                      <path d="M78 65V79M71 72H85" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fdf0eb] border border-[#f5c9b8] rounded-full mb-4">
                  <span className="text-[#e85a2d] text-xs font-semibold">How you win:</span>
                </div>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">🎁</span>
                    Win REKT points for every successful referral
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">%</span>
                    Unlock future incentives from referral activity
                  </li>
                  <li className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-base">📈</span>
                    Climb the referral leaderboard for extra rewards
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 05 - Validating Challenges (full width) */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Left content */}
              <div className="flex-1 p-6 pb-4 md:pb-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                    <span className="text-[#e85a2d] font-bold text-lg">05</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Validating Challenges (Coming soon)</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                      Help validate outcomes of real-world event challenges and keep the platform fair and trustworthy.
                    </p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fdf0eb] border border-[#f5c9b8] rounded-full mb-4">
                  <span className="text-[#e85a2d] text-xs font-semibold">How you win:</span>
                </div>
                {/* Three win items in a row for wide card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 bg-[#fdf8f5] rounded-xl p-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                        <path d="M12 2L14 8H20L15 12L17 18L12 14L7 18L9 12L4 8H10L12 2Z" fill="#e85a2d" opacity="0.7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">Win from the validation reward pool</p>
                  </div>
                  <div className="flex items-start gap-3 bg-[#fdf8f5] rounded-xl p-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                        <circle cx="10" cy="8" r="4" stroke="#e85a2d" strokeWidth="1.5" />
                        <circle cx="16" cy="10" r="3" stroke="#e85a2d" strokeWidth="1.5" />
                        <path d="M2 20C2 16 6 14 10 14C14 14 18 16 18 20" stroke="#e85a2d" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">The more validations you perform, the more you win</p>
                  </div>
                  <div className="flex items-start gap-3 bg-[#fdf8f5] rounded-xl p-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                        <path d="M12 2L13.5 8H20L14.5 12L16.5 18L12 14.5L7.5 18L9.5 12L4 8H10.5L12 2Z" fill="#f5c842" />
                        <path d="M8 20H16" stroke="#d4a820" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">Exclusive to Rekto Masters NFT holders</p>
                  </div>
                </div>
              </div>
              {/* Right illustration */}
              <div className="flex items-center justify-center p-6 md:w-48">
                <div className="w-32 h-32">
                  <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
                    {/* Shield base */}
                    <path d="M60 10 L100 28 L100 65 C100 88 60 110 60 110 C60 110 20 88 20 65 L20 28 Z" fill="#d4c4b0" stroke="#b8a890" strokeWidth="2" />
                    {/* Shield inner */}
                    <path d="M60 22 L88 36 L88 65 C88 82 60 98 60 98 C60 98 32 82 32 65 L32 36 Z" fill="#c8b8a4" />
                    {/* Check mark */}
                    <circle cx="60" cy="62" r="18" fill="#e85a2d" />
                    <path d="M50 62 L57 70 L72 54" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {/* Medal at bottom */}
                    <circle cx="60" cy="104" r="8" fill="#f5c842" stroke="#d4a820" strokeWidth="1.5" />
                    <path d="M56 108 L60 100 L64 108" fill="#d4a820" />
                    {/* Sparkles */}
                    <path d="M18 40L19.5 46L18 47.5L16.5 46L18 40Z" fill="#f5c842" />
                    <path d="M18 52L19.5 46L18 44.5L16.5 46L18 52Z" fill="#f5c842" />
                    <path d="M12 46L18 47.5L19.5 46L18 44.5L12 46Z" fill="#f5c842" />
                    <path d="M24 46L18 47.5L16.5 46L18 44.5L24 46Z" fill="#f5c842" />
                    <path d="M102 50L103.5 56L102 57.5L100.5 56L102 50Z" fill="#f5c842" />
                    <path d="M102 62L103.5 56L102 54.5L100.5 56L102 62Z" fill="#f5c842" />
                    <path d="M96 56L102 57.5L103.5 56L102 54.5L96 56Z" fill="#f5c842" />
                    <path d="M108 56L102 57.5L100.5 56L102 54.5L108 56Z" fill="#f5c842" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA Banner */}
          <div className="mt-5 bg-[#1e2939] rounded-2xl px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Rocket illustration */}
              <div className="flex-shrink-0 w-16 h-16">
                <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
                  {/* Rocket body */}
                  <path d="M40 8 C40 8 58 20 58 44 L40 56 L22 44 C22 20 40 8 40 8Z" fill="#e85a2d" />
                  {/* Rocket window */}
                  <circle cx="40" cy="34" r="7" fill="white" opacity="0.9" />
                  <circle cx="40" cy="34" r="4" fill="#5ba8d8" />
                  {/* Rocket fins */}
                  <path d="M22 44 L12 58 L26 52 Z" fill="#c04020" />
                  <path d="M58 44 L68 58 L54 52 Z" fill="#c04020" />
                  {/* Rocket exhaust */}
                  <path d="M32 56 C32 56 36 68 40 72 C44 68 48 56 48 56" fill="#f5d547" opacity="0.9" />
                  <path d="M35 60 C35 60 38 70 40 73 C42 70 45 60 45 60" fill="white" opacity="0.6" />
                  {/* Stars */}
                  <circle cx="16" cy="20" r="2" fill="white" opacity="0.8" />
                  <circle cx="64" cy="16" r="1.5" fill="white" opacity="0.8" />
                  <circle cx="12" cy="36" r="1.5" fill="white" opacity="0.6" />
                  <circle cx="68" cy="30" r="2" fill="white" opacity="0.6" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-lg sm:text-xl">Predict. Compete. Win.</p>
                <p className="text-gray-400 text-sm">Your skill. Your edge. Your rewards.</p>
              </div>
            </div>
            <Link
              href="/challenges"
              className="flex-shrink-0 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 text-sm sm:text-base"
            >
              Get Started →
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}
