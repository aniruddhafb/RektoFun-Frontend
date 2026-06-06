import Link from "next/link";
import { ReactNode } from "react";

function FlipCard({
    front,
}: {
    front: ReactNode;
}) {
    return (
        <div className="group h-full min-h-[27rem] transition-all duration-300 hover:-translate-y-2">
            <div className="h-full min-h-[27rem] border-2 border-black bg-white shadow-none transition-all duration-300 group-hover:bg-[#fffaf6] group-hover:shadow-[4px_4px_0_#111]">
                {front}
            </div>
        </div>
    );
}

export function WaysToWinSection() {
    return (
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 xl:px-12">

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Heading */}
                <div className="mb-10 text-center">
                    {/* <div className="mx-auto mb-5 inline-flex items-center gap-2 border border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[3px_3px_0_#111]">
                        <span className="h-2 w-2 bg-[#e85a2d]" />
                        Built For Battle
                    </div> */}
                    <h2 className="text-4xl sm:text-5xl font-black text-black leading-tight">
                        Why <span className="text-[#e85a2d] drop-shadow-[1px_1px_0_#111]">RektoFun?</span>
                    </h2>
                </div>

                {/* 3-column cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-5 mb-5">

                    {/* Card 1 — Crypto & Sports Markets */}
                    <FlipCard
                        front={
                            <div className="bg-white overflow-hidden flex flex-col h-full">
                                {/* Image area — peach background */}
                                <div className="bg-[#fdf0e8] flex items-center justify-center h-56 sm:h-60 p-6 border-b-2 border-black">
                                    <svg viewBox="0 0 200 170" className="w-full h-full transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2" fill="none">
                                        {/* Bitcoin coin */}
                                        <circle cx="68" cy="72" r="38" fill="#F7B731" />
                                        <circle cx="68" cy="72" r="30" fill="#F9C74F" />
                                        <circle cx="68" cy="72" r="24" fill="#F7B731" stroke="#E09B10" strokeWidth="1.5" />
                                        <text x="68" y="80" textAnchor="middle" fontSize="26" fill="white" fontWeight="bold">₿</text>

                                        {/* Market stall */}
                                        <rect x="108" y="44" width="68" height="56" rx="4" fill="#1a202c" />
                                        <rect x="108" y="44" width="68" height="18" rx="4" fill="#E53E3E" />
                                        {/* Awning white stripes */}
                                        <rect x="112" y="44" width="8" height="18" fill="white" opacity="0.45" />
                                        <rect x="126" y="44" width="8" height="18" fill="white" opacity="0.45" />
                                        <rect x="140" y="44" width="8" height="18" fill="white" opacity="0.45" />
                                        <rect x="154" y="44" width="8" height="18" fill="white" opacity="0.45" />
                                        <rect x="168" y="44" width="8" height="18" fill="white" opacity="0.45" />
                                        {/* Chart bars */}
                                        <rect x="116" y="80" width="9" height="14" rx="1.5" fill="#48BB78" />
                                        <rect x="130" y="72" width="9" height="22" rx="1.5" fill="#48BB78" />
                                        <rect x="144" y="64" width="9" height="30" rx="1.5" fill="#F6AD55" />
                                        <rect x="158" y="56" width="9" height="38" rx="1.5" fill="#48BB78" />
                                        {/* Trend arrow */}
                                        <path d="M116 88 L130 78 L144 68 L162 56" stroke="#68D391" strokeWidth="2.5" strokeLinecap="round" />
                                        <path d="M156 52 L164 56 L160 64" stroke="#68D391" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                                        {/* Soccer ball */}
                                        <circle cx="96" cy="122" r="30" fill="white" stroke="#222" strokeWidth="2" />
                                        {/* Pentagon patches */}
                                        <path d="M96 92 L104 104 L96 110 L88 104 Z" fill="#222" />
                                        <path d="M66 112 L76 106 L82 116 L74 126 L64 124 Z" fill="#222" />
                                        <path d="M126 112 L116 106 L110 116 L118 126 L128 124 Z" fill="#222" />
                                        <path d="M80 148 L88 138 L104 138 L112 148 L96 154 Z" fill="#222" />
                                        {/* Shadow */}
                                        <ellipse cx="96" cy="155" rx="24" ry="5" fill="#00000018" />
                                    </svg>
                                </div>
                                {/* Text */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-black text-black mb-3 leading-snug">
                                        Create Permissionless Predictions
                                    </h3>
                                    <p className="text-gray-600 text-sm font-medium leading-relaxed">
                                        Create permissionless prediction challenges around crypto and sports at anytime, on anything.
                                    </p>
                                </div>
                            </div>
                        }
                    />

                    {/* Card 2 — PVP Battles */}
                    <FlipCard
                        front={
                            <div className="bg-white overflow-hidden flex flex-col h-full">
                                {/* Image area — lavender background */}
                                <div className="bg-[#ede9fe] flex items-center justify-center h-56 sm:h-60 p-6 border-b-2 border-black">
                                    <svg viewBox="0 0 200 170" className="w-full h-full transition-transform duration-300 group-hover:scale-105 group-hover:rotate-2" fill="none">
                                        {/* LIVE badge */}
                                        <rect x="72" y="8" width="56" height="26" rx="6" fill="#E53E3E" />
                                        <text x="100" y="26" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">LIVE</text>

                                        {/* Burst lines */}
                                        <line x1="100" y1="50" x2="100" y2="36" stroke="#F6E05E" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="84" y1="55" x2="74" y2="43" stroke="#F6E05E" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="116" y1="55" x2="126" y2="43" stroke="#F6E05E" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="76" y1="70" x2="62" y2="65" stroke="#F6E05E" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="124" y1="70" x2="138" y2="65" stroke="#F6E05E" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="72" y1="88" x2="58" y2="88" stroke="#F6E05E" strokeWidth="2" strokeLinecap="round" />
                                        <line x1="128" y1="88" x2="142" y2="88" stroke="#F6E05E" strokeWidth="2" strokeLinecap="round" />

                                        {/* Red boxing glove (left, facing right) */}
                                        <rect x="20" y="54" width="62" height="46" rx="20" fill="#E53E3E" />
                                        <rect x="20" y="78" width="62" height="22" rx="10" fill="#C53030" />
                                        <rect x="24" y="88" width="52" height="14" rx="7" fill="#9B2C2C" />
                                        {/* Thumb */}
                                        <ellipse cx="76" cy="62" rx="11" ry="8" fill="#E53E3E" />
                                        <ellipse cx="76" cy="62" rx="8" ry="6" fill="#C53030" />
                                        {/* Knuckle lines */}
                                        <path d="M30 66 Q50 60 70 66" stroke="#C53030" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />

                                        {/* Blue boxing glove (right, facing left) */}
                                        <rect x="118" y="54" width="62" height="46" rx="20" fill="#4299E1" />
                                        <rect x="118" y="78" width="62" height="22" rx="10" fill="#3182CE" />
                                        <rect x="124" y="88" width="52" height="14" rx="7" fill="#2B6CB0" />
                                        {/* Thumb */}
                                        <ellipse cx="124" cy="62" rx="11" ry="8" fill="#4299E1" />
                                        <ellipse cx="124" cy="62" rx="8" ry="6" fill="#3182CE" />
                                        {/* Knuckle lines */}
                                        <path d="M130 66 Q150 60 170 66" stroke="#3182CE" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />

                                        {/* PVP badge (pentagon/shield shape) */}
                                        <path d="M100 118 L122 126 L122 148 L100 156 L78 148 L78 126 Z" fill="#1a202c" />
                                        <text x="100" y="142" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">PVP</text>
                                    </svg>
                                </div>
                                {/* Text */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-black text-black mb-3 leading-snug">
                                        PvP Prediction Battles
                                    </h3>
                                    <p className="text-gray-600 text-sm font-medium leading-relaxed">
                                        Join challenges, compete in prediction battles and test your knowledge, go head-to-head, and prove you&apos;re the best.
                                    </p>
                                </div>
                            </div>
                        }
                    />

                    {/* Card 3 — REKTO Points */}
                    <FlipCard
                        front={
                            <div className="bg-white overflow-hidden flex flex-col h-full">
                                {/* Image area — cream/beige background */}
                                <div className="bg-[#fdf6e8] flex items-center justify-center h-56 sm:h-60 p-6 border-b-2 border-black">
                                    <svg viewBox="0 0 200 170" className="w-full h-full transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2" fill="none">
                                        {/* Sparkles */}
                                        <path d="M36 44 L39 54 L36 64 L33 54 Z" fill="#F6E05E" />
                                        <path d="M26 54 L36 57 L46 54 L36 51 Z" fill="#F6E05E" />
                                        <path d="M154 38 L157 48 L154 58 L151 48 Z" fill="#F6E05E" />
                                        <path d="M144 48 L154 51 L164 48 L154 45 Z" fill="#F6E05E" />
                                        <path d="M46 28 L48 34 L46 40 L44 34 Z" fill="#F6E05E" opacity="0.7" />
                                        <path d="M40 34 L46 36 L52 34 L46 32 Z" fill="#F6E05E" opacity="0.7" />

                                        {/* Main gold coin */}
                                        <circle cx="100" cy="68" r="52" fill="#F7B731" />
                                        <circle cx="100" cy="68" r="44" fill="#F9C74F" />
                                        <circle cx="100" cy="68" r="36" fill="#F7B731" stroke="#D4A017" strokeWidth="1.5" />
                                        {/* Star on coin */}
                                        <path d="M100 44 L105 58 L120 58 L108 67 L113 82 L100 73 L87 82 L92 67 L80 58 L95 58 Z" fill="#D4A017" />

                                        {/* REKTO ribbon banner */}
                                        <path d="M52 108 L148 108 L148 128 L52 128 Z" fill="#E53E3E" />
                                        <path d="M52 108 L42 118 L52 128 Z" fill="#C53030" />
                                        <path d="M148 108 L158 118 L148 128 Z" fill="#C53030" />
                                        <text x="100" y="123" textAnchor="middle" fontSize="15" fill="white" fontWeight="bold" letterSpacing="2">REKTO</text>

                                        {/* Connecting lines to icons */}
                                        <line x1="72" y1="128" x2="52" y2="148" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <line x1="100" y1="128" x2="100" y2="148" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="3,2" />
                                        <line x1="128" y1="128" x2="148" y2="148" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="3,2" />

                                        {/* Trophy icon circle */}
                                        <circle cx="52" cy="156" r="14" fill="#9F7AEA" />
                                        <path d="M52 149 L54 153 L58 153 L55 156 L56 160 L52 158 L48 160 L49 156 L46 153 L50 153 Z" fill="white" />

                                        {/* People/clan icon circle */}
                                        <circle cx="100" cy="156" r="14" fill="#48BB78" />
                                        <circle cx="97" cy="152" r="3" fill="white" />
                                        <path d="M91 162 C91 158 103 158 103 162" fill="white" />
                                        <circle cx="104" cy="153" r="2.5" fill="white" opacity="0.8" />
                                        <path d="M100 162 C100 159 109 159 109 162" fill="white" opacity="0.8" />

                                        {/* Add person icon circle */}
                                        <circle cx="148" cy="156" r="14" fill="#F6AD55" />
                                        <circle cx="145" cy="152" r="3" fill="white" />
                                        <path d="M139 162 C139 158 151 158 151 162" fill="white" />
                                        <path d="M153 150 L153 156 M150 153 L156 153" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                {/* Text */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-xl font-black text-black mb-3 leading-snug">
                                        Community Verified Outcomes
                                    </h3>
                                    <p className="text-gray-600 text-sm font-medium leading-relaxed">
                                        Challenge outcomes and disputes are resolved by the NFT holders community through a transparent voting process.
                                    </p>
                                </div>
                            </div>
                        }
                    />
                </div>

                {/* Bottom CTA */}
                <div className="group mt-7 border-2 border-black bg-white px-6 shadow-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0_#111] sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-16 h-16 animate-float-gentle">
                            <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-[2px_2px_0_#111]" fill="none">
                                <path d="M40 8 C40 8 58 20 58 44 L40 56 L22 44 C22 20 40 8 40 8Z" fill="#e85a2d" />
                                <circle cx="40" cy="34" r="7" fill="white" opacity="0.9" />
                                <circle cx="40" cy="34" r="4" fill="#5ba8d8" />
                                <path d="M22 44 L12 58 L26 52 Z" fill="#c04020" />
                                <path d="M58 44 L68 58 L54 52 Z" fill="#c04020" />
                                <path d="M32 56 C32 56 36 68 40 72 C44 68 48 56 48 56" fill="#f5d547" opacity="0.9" />
                                <path d="M35 60 C35 60 38 70 40 73 C42 70 45 60 45 60" fill="white" opacity="0.6" />
                                <circle cx="16" cy="20" r="2" fill="white" opacity="0.8" />
                                <circle cx="64" cy="16" r="1.5" fill="white" opacity="0.8" />
                                <circle cx="12" cy="36" r="1.5" fill="white" opacity="0.6" />
                                <circle cx="68" cy="30" r="2" fill="white" opacity="0.6" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-900 font-black text-lg sm:text-xl">Predict. Compete. Win.</p>
                            <p className="text-gray-600 text-sm font-medium">Your skill. Your edge. Your rewards.</p>
                        </div>
                    </div>
                    <Link
                        href="/challenges"
                        className="flex-shrink-0 border-2 border-black bg-black px-8 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-none transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#e85a2d] active:translate-y-0 active:shadow-[2px_2px_0_#e85a2d] sm:text-base"
                    >
                        Get Started {"\u2192"}
                    </Link>
                </div>
            </div>

        </section>
    );
}
