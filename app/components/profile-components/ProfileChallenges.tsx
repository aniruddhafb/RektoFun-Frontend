"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChallengeCard } from "@/app/components/challenge-components/ChallengeCard";
import { Challenge } from "@/app/lib/challenges-service/challenges";

interface ProfileChallengesProps {
    challenges: Challenge[];
    loading?: boolean;
    onChallengeClick: (challenge: Challenge) => void;
}

export function ProfileChallenges({
    challenges,
    loading,
    onChallengeClick,
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
            <div className="bg-[#f8ede7] rounded-2xl p-6 border border-[#e8d5c8] text-[#5c4a42] mt-4">
                No challenges found for this user yet.
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
