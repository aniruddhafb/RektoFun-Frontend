"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChallengeCard } from "@/app/components/challenge-components/ChallengeCard";
import { Challenge } from "@/app/lib/challenges-service/challenges";

interface ProfileChallengesProps {
    challenges: Challenge[];
    loading?: boolean;
    onChallengeClick: (challenge: Challenge) => void;
    onCreateChallenge: () => void;
}

export function ProfileChallenges({
    challenges,
    loading,
    onChallengeClick,
    onCreateChallenge,
}: ProfileChallengesProps) {
    const PAGE_SIZE = 6;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target || visibleCount >= challenges.length) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || isLoadingMore) return;
            setIsLoadingMore(true);
            window.setTimeout(() => {
                setVisibleCount((count) => Math.min(count + PAGE_SIZE, challenges.length));
                setIsLoadingMore(false);
            }, 250);
        }, { rootMargin: "300px" });
        observer.observe(target);
        return () => observer.disconnect();
    }, [challenges.length, isLoadingMore, visibleCount]);

    const skeletons = (count: number) => Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-[300px] border-2 border-black bg-white/70 p-5 animate-pulse" aria-hidden="true">
            <div className="h-6 w-3/4 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
            <div className="mt-8 h-4 w-full rounded bg-gray-200" />
            <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
            <div className="mt-10 h-10 w-full rounded-xl bg-gray-200" />
        </div>
    ));

    if (loading) {
        return (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{skeletons(6)}</div>
        );
    }

    if (!challenges.length) {
        return (
            <div className="mx-auto mt-8 max-w-2xl px-6 py-10 text-center sm:py-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center border border-black/15 bg-[#f5d547] shadow-[3px_3px_0_#111]">
                    <svg className="h-7 w-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="mt-6 text-xl font-black text-gray-950 sm:text-2xl">No challenges found</h2>
                <button
                    type="button"
                    onClick={onCreateChallenge}
                    className="mt-7 inline-flex cursor-pointer items-center justify-center border-2 border-black bg-white/70 px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-gray-800 shadow-[4px_4px_0_#e85a2d] transition-colors hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#e85a2d]/25"
                >
                    <span className="mr-2 text-lg leading-none">+</span>
                    Create a challenge
                </button>
            </div>
        );
    }

    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {challenges.slice(0, visibleCount).map((challenge) => (
                <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={onChallengeClick}
                    showPin={false}
                />
            ))}
            {isLoadingMore && skeletons(3)}
            <div ref={loadMoreRef} className="col-span-full h-1" aria-hidden="true" />
        </div>
    );
}
