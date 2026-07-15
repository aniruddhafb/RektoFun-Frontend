"use client";

import Image from "next/image";
import {
    ArrowLeft,
    ArrowRight,
    Coins,
    ShieldCheck,
    Sparkles,
    Swords,
    Target,
    X,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

type Slide = {
    eyebrow: string;
    title: string;
    description: ReactNode;
    cta: string;
    icon: ComponentType<{ className?: string }>;
};

const slides: Slide[] = [
    {
        eyebrow: "Battle briefing 01",
        title: "Welcome to RektoFun!",
        description:
            "Your social prediction arena for crypto and sports. I am Rekky and I will get you battle ready in under a minute.",
        cta: "Show me around",
        icon: Sparkles,
    },
    {
        eyebrow: "Battle briefing 02",
        title: "Predictions go PvP",
        description:
            "Challenge real players on real outcomes with real stakes. No house to beat it's just you, your opponents, and the result.",
        cta: "Next",
        icon: Swords,
    },
    {
        eyebrow: "Battle briefing 03",
        title: "Pick a side and lock it in",
        description:
            "Create a challenge in seconds or join an active community battle. Make your call, set your stake, and claim the glory.",
        cta: "One last thing",
        icon: Target,
    },
    {
        eyebrow: "Battle briefing 04",
        title: "$REKTO as utility",
        description: (
            <>
                HOLD $REKTO tokens to create and resolve challenges. <br />
                <a
                    href="https://dexscreener.com/solana/w8og36xbxpk1xsmvg4bff2uwhnuyinuxct7btfjaz1n"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-[#6d28d9] underline decoration-2 underline-offset-4 hover:text-[#4c1d95]"
                >
                    Buy $REKTO ↗
                </a>
            </>
        ),
        cta: "Enter the arena",
        icon: Coins,
    },
];

const TUTORIAL_COMPLETED_KEY = "rektofun_tutorial_completed";

export function WelcomeTutorialModal() {
    const [isDismissedForSession, setIsDismissedForSession] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);
    const isCompleted = useSyncExternalStore(
        () => () => { },
        () => window.localStorage.getItem(TUTORIAL_COMPLETED_KEY) === "true",
        () => true
    );
    const isOpen = !isCompleted && !isDismissedForSession;
    useBodyScrollLock(isOpen);

    const isLastSlide = activeSlide === slides.length - 1;
    const currentSlide = slides[activeSlide];
    const CurrentIcon = currentSlide.icon;

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsDismissedForSession(true);
            if (event.key === "ArrowRight") setActiveSlide((prev) => Math.min(prev + 1, slides.length - 1));
            if (event.key === "ArrowLeft") setActiveSlide((prev) => Math.max(prev - 1, 0));
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen]);

    const handleClosePermanently = () => {
        window.localStorage.setItem(TUTORIAL_COMPLETED_KEY, "true");
        setIsDismissedForSession(true);
    };

    if (!isOpen) return null;

    return (
        <div
            className="welcome-backdrop fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-[#140d24]/85 p-2 backdrop-blur-md sm:p-6"
            role="presentation"
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="welcome-title"
                className="welcome-arena relative grid max-h-[calc(100dvh-1rem)] w-full max-w-[1120px] grid-rows-[clamp(150px,27dvh,220px)_minmax(0,1fr)] overflow-hidden border-[3px] border-[#211530] bg-[#f8ead9] shadow-[0_0_0_3px_#f4c95d,0_24px_80px_rgba(8,3,20,.55)] sm:max-h-none sm:grid-rows-[285px_540px] lg:h-[640px] lg:grid-cols-2 lg:grid-rows-1"
            >
                <button
                    type="button"
                    onClick={handleClosePermanently}
                    className="absolute right-3 top-3 z-30 flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-[#211530] bg-[#fff8ea]/90 text-[#211530] transition hover:-translate-y-0.5 hover:bg-white sm:right-5 sm:top-5"
                    aria-label="Close welcome tour and never show it again"
                    title="Close and don’t show again"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="relative min-h-0 overflow-hidden border-b-[3px] border-[#211530] sm:h-[285px] lg:h-full lg:border-b-0 lg:border-r-[3px]">
                    <Image
                        src="/welcome/rekto-mascot-arena.jpg"
                        alt="Rekky, the purple RektoFun axolotl mascot, welcoming players to the arena"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 56vw"
                        className="welcome-mascot object-cover object-left"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#201430]/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#1a1028]/20" />

                    <div className="absolute left-4 top-4 flex items-center gap-2 border-2 border-[#211530] bg-[#211530]/90 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#fff5dc] sm:left-6 sm:top-6 sm:text-xs">
                        <ShieldCheck className="h-4 w-4 text-[#d8b4fe]" />
                        Rekto.Fun is in beta
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-end text-[#fff8ea] sm:bottom-6 sm:left-6 sm:right-6 lg:justify-between">
                        <div className="text-right lg:text-left">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f4c95d]">Your arena master</p>
                            <p className="mt-1 text-2xl font-black sm:text-3xl">REKKY</p>
                        </div>
                        {/* <div className="flex items-center gap-2 border-2 border-[#fff8ea]/60 bg-[#211530]/80 px-3 py-2 text-xs font-bold backdrop-blur-sm">
                            <Trophy className="h-4 w-4 text-[#f4c95d]" />
                            +100 XP awaits
                        </div> */}
                    </div>
                </div>

                <div className="relative flex min-h-0 flex-col overflow-y-auto bg-[radial-gradient(circle_at_85%_15%,rgba(167,139,250,.22),transparent_32%),linear-gradient(145deg,#fffaf0,#efddca)] px-4 pb-4 pt-4 sm:h-[540px] sm:px-9 sm:pb-8 sm:pt-10 lg:h-full lg:px-10 lg:pb-10 lg:pt-12">
                    <div className="flex items-center gap-2" aria-label={`Step ${activeSlide + 1} of ${slides.length}`}>
                        {slides.map((slide, index) => {
                            const StepIcon = slide.icon;
                            const isActive = index === activeSlide;
                            const isDone = index < activeSlide;

                            return (
                                <button
                                    key={slide.eyebrow}
                                    type="button"
                                    onClick={() => setActiveSlide(index)}
                                    aria-label={`Open battle briefing ${index + 1}`}
                                    aria-current={isActive ? "step" : undefined}
                                    className={`flex h-10 flex-1 cursor-pointer items-center justify-center border-2 border-[#211530] transition ${isActive
                                        ? "-translate-y-1 bg-[#7c3aed] text-white shadow-[3px_3px_0_#211530]"
                                        : isDone
                                            ? "bg-[#d8b4fe] text-[#211530]"
                                            : "bg-[#fff8ea] text-[#211530]/45 hover:bg-white"
                                        }`}
                                >
                                    <StepIcon className="h-4 w-4" />
                                </button>
                            );
                        })}
                    </div>

                    <div key={activeSlide} className="welcome-copy my-auto py-4 sm:min-h-[290px] sm:py-8 lg:min-h-0">
                        <div className="mb-3 flex h-10 w-10 rotate-3 items-center justify-center border-[3px] border-[#211530] bg-[#f4c95d] text-[#211530] shadow-[3px_3px_0_#211530] sm:mb-5 sm:h-14 sm:w-14 sm:shadow-[4px_4px_0_#211530]">
                            <CurrentIcon className="h-7 w-7" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#7c3aed]">{currentSlide.eyebrow}</p>
                        <h2 id="welcome-title" className="mt-2 text-2xl font-black leading-[.95] tracking-[-0.04em] text-[#211530] min-[380px]:text-3xl sm:mt-3 sm:text-5xl">
                            {currentSlide.title}
                        </h2>
                        <p className="mt-3 max-w-[44ch] text-sm font-semibold leading-relaxed text-[#3f344b]/85 sm:mt-5 sm:text-lg">
                            {currentSlide.description}
                        </p>
                    </div>

                    <div className="mt-auto">
                        <div className="mb-4 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-[#211530]/55">
                            <span>Briefing progress</span>
                            <span>{activeSlide + 1} / {slides.length}</span>
                        </div>
                        <div className="mb-3 h-2 overflow-hidden border border-[#211530] bg-[#fff8ea] sm:mb-6">
                            <div
                                className="h-full bg-gradient-to-r from-[#7c3aed] to-[#c084fc] transition-all duration-300"
                                style={{ width: `${((activeSlide + 1) / slides.length) * 100}%` }}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveSlide((prev) => Math.max(prev - 1, 0))}
                                disabled={activeSlide === 0}
                                className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[#211530] bg-[#fff8ea] text-[#211530] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label="Previous briefing"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => isLastSlide ? handleClosePermanently() : setActiveSlide((prev) => prev + 1)}
                                className="rekto-button group flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 border-2 border-[#211530] bg-[#211530] px-5 text-sm font-black uppercase tracking-[0.08em] text-[#fff8ea] transition hover:-translate-y-1 hover:bg-[#7c3aed]"
                            >
                                {currentSlide.cta}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                        <p className="mt-4 hidden text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#211530]/45 sm:block">
                            Use ← → to navigate · Esc to close
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
