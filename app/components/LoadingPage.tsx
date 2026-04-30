"use client";

interface LoadingPageProps {
    variant?: "full" | "inline" | "skeleton" | "simple";
    message?: string;
    minHeight?: string;
}

export function LoadingPage({
    variant = "full",
    message = "Loading...",
    minHeight = "100vh"
}: LoadingPageProps) {
    if (variant === "simple") {
        return (
            <div className="fixed inset-0 min-h-screen bg-[#f3e1d7] flex items-center justify-center overflow-hidden">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a2e] mx-auto mb-4"></div>
                    <p className="text-[#1a1a2e]">{message}</p>
                </div>
            </div>
        );
    }

    if (variant === "inline") {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-[#f3e1d7] rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-gray-900 rounded-full animate-spin" />
                </div>
                {message && (
                    <p className="text-sm font-medium text-gray-600">{message}</p>
                )}
            </div>
        );
    }

    if (variant === "skeleton") {
        return (
            <div className="animate-pulse space-y-6 p-6">
                {/* Header skeleton */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#f3e1d7] rounded-2xl" />
                    <div className="space-y-2 flex-1">
                        <div className="h-5 bg-[#f3e1d7] rounded w-1/3" />
                        <div className="h-4 bg-[#f3e1d7] rounded w-1/4" />
                    </div>
                </div>
                {/* Content skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 bg-[#f3e1d7] rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    // Full page loading variant
    return (
        <div
            className="flex flex-col items-center justify-center bg-[#f3e1d7] min-h-screen"
            style={{ minHeight }}
        >
            {/* Logo animation */}
            <div className="relative mb-8">
                <div className="w-24 h-24 bg-gray-900 rounded-3xl flex items-center justify-center animate-bounce">
                    <span className="text-4xl">😈</span>
                </div>
                {/* Spinning ring */}
                <div className="absolute inset-0 -z-10">
                    <div className="w-28 h-28 border-4 border-transparent border-t-gray-900/30 rounded-full animate-spin mx-auto mt-[-2px]" />
                </div>
            </div>

            {/* Loading text */}
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">RektoFun</h2>
                <p className="text-sm text-gray-600">{message}</p>
            </div>

            {/* Progress dots */}
            <div className="flex gap-2 mt-8">
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
        </div>
    );
}

// Convenience component for section loading
export function LoadingSection({
    height = "200px",
    message = "Loading..."
}: {
    height?: string;
    message?: string;
}) {
    return (
        <div
            className="flex items-center justify-center bg-[#f3e1d7]/50 rounded-2xl"
            style={{ height }}
        >
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#f3e1d7] border-t-gray-900 rounded-full animate-spin" />
                <p className="text-xs font-medium text-gray-500">{message}</p>
            </div>
        </div>
    );
}

// Skeleton card for content loading
export function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div className={`bg-[#f3e1d7] rounded-2xl animate-pulse ${className}`}>
            <div className="aspect-video rounded-t-2xl bg-[#e8d4c5]" />
            <div className="p-4 space-y-2">
                <div className="h-4 bg-[#e8d4c5] rounded w-3/4" />
                <div className="h-3 bg-[#e8d4c5] rounded w-1/2" />
            </div>
        </div>
    );
}