"use client";

import { useEffect, useState } from "react";

type ToastTheme = "red" | "yellow";

interface AutoDismissErrorToastProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    durationMs?: number;
    theme?: ToastTheme;
}

const THEME_CLASSES: Record<ToastTheme, {
    container: string;
    closeButton: string;
    progressTrack: string;
}> = {
    red: {
        container: "border-[#d6a4a4] bg-[#b85a5a]",
        closeButton: "text-[#f7dfdf] hover:text-white",
        progressTrack: "bg-[#9f4e4e]/60",
    },
    yellow: {
        container: "border-[#d9bf8f] bg-[#b98a42]",
        closeButton: "text-[#f8edd8] hover:text-white",
        progressTrack: "bg-[#a97a35]/60",
    },
};

export default function AutoDismissErrorToast({
    isOpen,
    onClose,
    title,
    description,
    durationMs = 3000,
    theme = "red",
}: AutoDismissErrorToastProps) {
    const [progress, setProgress] = useState(100);
    const styles = THEME_CLASSES[theme];

    useEffect(() => {
        if (!isOpen) return;

        setProgress(100);
        const start = Date.now();
        const interval = window.setInterval(() => {
            const elapsed = Date.now() - start;
            const nextProgress = Math.max(0, 100 - (elapsed / durationMs) * 100);
            setProgress(nextProgress);
        }, 50);

        const timeout = window.setTimeout(() => {
            onClose();
            setProgress(100);
        }, durationMs);

        return () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
        };
    }, [durationMs, isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={`fixed right-4 top-40 sm:top-40 z-[60] w-[min(92vw,24rem)] overflow-hidden rounded-xl border text-white shadow-2xl ${styles.container}`}>
            <button
                type="button"
                onClick={onClose}
                className={`absolute right-3 top-2 text-lg leading-none transition ${styles.closeButton}`}
                aria-label="Close error notification"
            >
                ×
            </button>
            <div className="px-5 pb-4 pt-4 pr-10">
                <p className="text-base font-semibold">{title}</p>
                {description ? <p className="mt-1 text-sm">{description}</p> : null}
            </div>
            <div className={`h-1.5 w-full ${styles.progressTrack}`}>
                <div
                    className="h-full bg-white/90 transition-[width] duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
