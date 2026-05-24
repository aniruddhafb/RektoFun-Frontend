"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";

type Slide = {
    description: string;
    accent: string;
    cta: string;
    image: string;
};

const slides: Slide[] = [
    {
        description:
            "welcome to rektofun, your social prediction arena for crypto and sports. this quick guided flow gets you battle ready in seconds.",
        accent: "Quick start for new users",
        cta: "Start Tutorial",
        image: "/welcome/111.png",
    },
    {
        description:
            "rektofun is a pvp prediction battleground where players challenge each other with real outcomes and real stakes in real time.",
        accent: "PvP predictions built for speed",
        cta: "Next",
        image: "/welcome/22.png",
    },
    {
        description:
            "Create your own challenge in seconds or join active battles from the community. pick your side, lock in and compete.",
        accent: "Pick your side & lock in",
        cta: "Next",
        image: "/welcome/3.png",
    },
    {
        description:
            "Earn Rekto Points by referring friends and creating challenges. stay active, grow your network, and climb the ranks faster.",
        accent: "Referral + creator rewards",
        cta: "Next",
        image: "/welcome/44.png",
    },
    {
        description:
            "RektoFun is currently live on Solana Devnet. Connect your wallet and try the full experience right now.",
        accent: "Test it safely on Devnet",
        cta: "Try RektoFun",
        image: "/welcome/5.png",
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

    const isLastSlide = activeSlide === slides.length - 1;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsDismissedForSession(true);
                return;
            }

            if (event.key === "ArrowRight") {
                setActiveSlide((prev) => Math.min(prev + 1, slides.length - 1));
            }

            if (event.key === "ArrowLeft") {
                setActiveSlide((prev) => Math.max(prev - 1, 0));
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen]);

    const handleFinishTutorial = () => {
        window.localStorage.setItem(TUTORIAL_COMPLETED_KEY, "true");
        setIsDismissedForSession(true);
    };

    if (!isOpen) {
        return null;
    }

    const currentSlide = slides[activeSlide];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-3 py-5 backdrop-blur-[3px] sm:px-6">
            <div className="relative w-full max-w-[38rem] overflow-hidden rounded-[24px] border-2 border-black bg-[#eedcd2] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <button
                    type="button"
                    onClick={() => setIsDismissedForSession(true)}
                    className="absolute right-3 top-3 z-20 rounded-full border border-[#eedcd2]/80 bg-black/80 px-4 py-1.5 text-sm font-bold text-[#eedcd2] shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition hover:bg-black hover:text-white cursor-pointer"
                    aria-label="Close tutorial"
                >
                    → Skip
                </button>

                <div className="relative mx-3 mt-3 aspect-[3/2] w-auto overflow-hidden rounded-2xl border-2 border-black bg-[#000000] sm:mx-5 sm:mt-5">
                    <Image
                        src={currentSlide.image}
                        alt="RektoFun tutorial visual"
                        fill
                        className="object-contain object-center p-2 brightness-110 contrast-105 sm:p-3"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/20" />
                </div>

                <div className="px-4 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-6">
                    <p className="text-center text-lg font-bold uppercase tracking-[0.18em] text-black/55">{currentSlide.accent}</p>
                    <p className="mt-3 text-center text-base leading-relaxed text-black/80 sm:text-lg">{currentSlide.description}</p>

                    <div className="mt-4 flex items-center justify-center gap-2">
                        {slides.map((slide, index) => (
                            <button
                                key={slide.image}
                                type="button"
                                onClick={() => setActiveSlide(index)}
                                aria-label={`Open slide ${index + 1}`}
                                className={`h-2.5 rounded-full transition-all ${index === activeSlide ? "w-8 bg-black" : "w-2.5 bg-black/25 hover:bg-black/45"
                                    } cursor-pointer`}
                            />
                        ))}
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setActiveSlide((prev) => Math.max(prev - 1, 0))}
                            disabled={activeSlide === 0}
                            className="min-h-11 flex-1 rounded-xl border border-black/25 bg-white/55 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/75 cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 sm:text-base"
                        >
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={() => (isLastSlide ? handleFinishTutorial() : setActiveSlide((prev) => prev + 1))}
                            className="min-h-11 flex-[1.45] rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-[#eedcd2] transition hover:bg-[#111] cursor-pointer sm:text-base"
                        >
                            {currentSlide.cta}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
