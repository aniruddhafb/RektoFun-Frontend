"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-[#f5f5f5] font-sans flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="flex-shrink-0 z-50 bg-[#f5f5f5]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight">REKTO</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer">Challenges</a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer">Leaderboard</a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer">Referral</a>
              <a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition-colors cursor-pointer">Roadmap</a>
            </div>

            {/* Desktop CTA Button */}
            <button className="hidden md:block px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors cursor-pointer">
              Get Started
            </button>

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-black transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition-colors py-2 cursor-pointer">Challenges</a>
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition-colors py-2 cursor-pointer">Leaderboard</a>
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition-colors py-2 cursor-pointer">Referral</a>
                <a href="#" className="text-sm font-medium text-gray-700 hover:text-black transition-colors py-2 cursor-pointer">Roadmap</a>
                <button className="mt-2 px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors w-full cursor-pointer">
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Crazy Animated Scribbles */}
      <section className="relative flex-1 bg-[#f3e1d7] overflow-hidden flex items-center justify-center">

        {/* Animated Scribble Images - All 13 images with unique animations - INCREASED SIZES */}

        {/* Stars - Top Left - Gentle pulse and rotate */}
        <div className="hidden md:block absolute left-[2%] top-[3%] w-32 h-32 md:w-48 md:h-48 scribble-stars">
          <Image
            src="/scribbles/stars.png"
            alt="Stars"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* BTC - Top Right - Bouncy animation */}
        <div className="absolute right-[3%] top-[2%] w-28 h-28 md:w-44 md:h-44 scribble-btc">
          <Image
            src="/scribbles/btc.png"
            alt="Bitcoin"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Dollars - Left Upper - Slide and glow */}
        <div className="hidden md:block absolute left-[1%] top-[22%] w-36 h-36 md:w-52 md:h-52 scribble-dollars">
          <Image
            src="/scribbles/dollars.png"
            alt="Dollars"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* SOL - Right Upper - Spin slow */}
        <div className="hidden md:block absolute right-[2%] top-[25%] w-32 h-32 md:w-48 md:h-48 scribble-sol">
          <Image
            src="/scribbles/sol.png"
            alt="Solana"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Coins - Left Middle - Wobble */}
        <div className="hidden md:block absolute left-[3%] top-[48%] w-40 h-40 md:w-56 md:h-56 scribble-coins">
          <Image
            src="/scribbles/coins.png"
            alt="Coins"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Bags - Right Middle - Scale pulse */}
        <div className="hidden md:block absolute right-[2%] top-[50%] w-36 h-36 md:w-52 md:h-52 scribble-bags">
          <Image
            src="/scribbles/bags.png"
            alt="Money Bags"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* DOGE - Bottom Left - Shake and glow */}
        <div className="absolute left-[6%] bottom-[8%] w-32 h-32 md:w-48 md:h-48 scribble-doge">
          <Image
            src="/scribbles/doge.png"
            alt="Doge"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* PEPE - Bottom Right - Crazy wobble */}
        <div className="absolute right-[16%] bottom-[6%] w-32 h-32 md:w-48 md:h-48 scribble-pepe">
          <Image
            src="/scribbles/pepe.png"
            alt="Pepe"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* PENGU - Center Left - Gentle float with glow */}
        <div className="hidden md:block absolute left-[12%] top-[35%] w-28 h-28 md:w-40 md:h-40 scribble-pengu">
          <Image
            src="/scribbles/pengu.png"
            alt="Pengu"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* SHIBA - Center Right - Twitch animation */}
        <div className="hidden md:block absolute right-[12%] top-[38%] w-28 h-28 md:w-40 md:h-40 scribble-shiba">
          <Image
            src="/scribbles/shiba.png"
            alt="Shiba"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* TRUMP - Top Center-Left - Bounce rotate */}
        <div className="absolute left-[28%] top-[5%] w-24 h-24 md:w-36 md:h-36 scribble-trump">
          <Image
            src="/scribbles/trump.png"
            alt="Trump"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* USA - Bottom Center-Right - Wave animation */}
        {/* <div className="absolute right-[22%] bottom-[5%] w-28 h-28 md:w-40 md:h-40 scribble-usa">
          <Image
            src="/scribbles/USA.png"
            alt="USA"
            fill
            className="object-contain"
            priority
          />
        </div> */}

        {/* PHANTOM - Center area - Ethereal float */}
        <div className="hidden md:block absolute left-[40%] top-[12%] w-24 h-24 md:w-32 md:h-32 scribble-phantom">
          <Image
            src="/scribbles/phantom (1).png"
            alt="Phantom"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Orange shape with lines */}
        <div className="hidden md:block absolute right-0 bottom-20 w-24 h-32 opacity-70">
          <svg viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M100 0V140H20C0 140 0 100 20 80C40 60 60 40 80 20L100 0Z" fill="#e85a2d" />
            <path d="M20 100H80M25 115H85M30 130H90" stroke="black" strokeWidth="3" />
          </svg>
        </div>

        {/* Center Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          {/* New Badge */}
          <div className="absolute -top-12 right-[5%] md:right-[2%]">
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              <svg viewBox="0 0 80 80" className="w-full h-full rotate-12">
                <polygon points="40,0 45,15 60,10 52,25 65,35 50,40 55,55 40,48 25,55 30,40 15,35 28,25 20,10 35,15" fill="#e85a2d" />
              </svg>
              <span className="absolute inset-0 mb-4 flex items-center justify-center text-white text-[10px] md:text-xs font-bold rotate-12">Beta</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-6xl lg:text-8xl font-bold tracking-tight text-black mb-6">
            REKTO.FUN
          </h1>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-gray-800 mb-10 max-w-xl mx-auto">
            The first PvP battleground for price predictions <br></br> Prediction Markets 2.0 🪄
          </p>

          {/* CTA Button */}
          <button className="px-10 py-4 bg-black text-white text-base font-semibold rounded-lg hover:bg-gray-800 transition-all shadow-lg cursor-pointer hover:scale-105 hover:shadow-glow">
            View Challenges ➝
          </button>
        </div>

        {/* Bottom decorative elements */}
        {/* Yellow oval with lines */}
        <div className="hidden md:block absolute bottom-20 left-1/2 transform -translate-x-1/2 w-48 h-20 animate-float-gentle">
          <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="100" cy="40" rx="100" ry="40" fill="#f5d547" />
            <path d="M40 20C60 40 80 60 100 70M60 15C80 35 100 55 120 65M80 10C100 30 120 50 140 60M100 10C120 30 140 50 160 60" stroke="black" strokeWidth="2" />
          </svg>
        </div>

        {/* Blue semi-circle */}
        <div className="absolute bottom-0 left-1/3 w-24 h-12 animate-float-updown">
          <svg viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M0 50C0 22 22 0 50 0C78 0 100 22 100 50V50H0Z" fill="#5ba8d8" />
            <path d="M20 50C20 35 35 25 50 25" stroke="black" strokeWidth="2" />
          </svg>
        </div>

        {/* Three black lines */}
        <div className="hidden md:block absolute bottom-1/3 left-1/3 w-16 h-16 animate-float-diagonal">
          <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <line x1="10" y1="50" x2="30" y2="10" stroke="black" strokeWidth="4" strokeLinecap="round" />
            <line x1="25" y1="55" x2="45" y2="15" stroke="black" strokeWidth="4" strokeLinecap="round" />
            <line x1="40" y1="60" x2="60" y2="20" stroke="black" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>

        {/* Small sparkle */}
        <div className="hidden md:block absolute right-1/3 top-1/2 w-8 h-8 animate-spin-slow">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M20 0L22 16L20 18L18 16L20 0Z" fill="black" />
            <path d="M20 40L22 24L20 22L18 24L20 40Z" fill="black" />
            <path d="M0 20L16 22L18 20L16 18L0 20Z" fill="black" />
            <path d="M40 20L24 22L22 20L24 18L40 20Z" fill="black" />
          </svg>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex-shrink-0 py-4 px-6 lg:px-8 border-gray-200 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto">
          <div className="pt-4 border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span>©2026 RektoFun</span>
              <span className="hidden md:inline">•</span>
              <a href="/terms" className="hover:text-black transition-colors underline cursor-pointer">Terms</a>
              <span>•</span>
              <a href="/about" className="hover:text-black transition-colors underline cursor-pointer">About Us</a>
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.419-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
