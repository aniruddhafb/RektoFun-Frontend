"use client";

import React from "react";
import { createPortal } from "react-dom";
import { CircleDollarSign, LoaderCircle, RotateCcw, Trophy, X } from "lucide-react";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

type ChallengeAction = "cancel" | "refund" | "winnings";

interface ChallengeActionModalProps {
    action: ChallengeAction | null;
    isExpired?: boolean;
    isLoading: boolean;
    error?: string;
    onClose: () => void;
    onConfirm: () => void;
}

const ACTION_CONTENT = {
    cancel: {
        eyebrow: "Permanent action",
        title: "Cancel challenge?",
        description: "This will close the challenge and return your stake to your wallet.",
        confirmLabel: "Cancel and refund",
        icon: RotateCcw,
        accent: "bg-[#e85a2d]",
        header: "bg-[#fff7f3]",
        notice: "Your wallet will ask you to approve the cancellation transaction.",
        button: "bg-[#d64d26] hover:bg-[#b94020]",
        buttonText: "text-white",
    },
    refund: {
        eyebrow: "Stake recovery",
        title: "Claim refund",
        description: "Your deposited stake is ready to be released from escrow and returned to your wallet.",
        confirmLabel: "Claim refund",
        icon: CircleDollarSign,
        accent: "bg-[#67d5c4]",
        header: "bg-[#effbf8]",
        notice: "Your full eligible stake will be sent back to your connected wallet.",
        button: "bg-[#087f70] hover:bg-[#06675b]",
        buttonText: "text-white",
    },
    winnings: {
        eyebrow: "Challenge won",
        title: "Redeem your winnings",
        description: "You backed the winning side. Your share of the prize pool is ready to claim.",
        confirmLabel: "Redeem winnings",
        icon: Trophy,
        accent: "bg-[#f5d547]",
        header: "bg-[#fff9dc]",
        notice: "Your payout will be transferred securely from escrow to your connected wallet.",
        button: "bg-[#f5d547] hover:bg-[#e8c72f]",
        buttonText: "text-black",
    },
} as const;

export function ChallengeActionModal({
    action,
    isExpired = false,
    isLoading,
    error,
    onClose,
    onConfirm,
}: ChallengeActionModalProps) {
    useBodyScrollLock(Boolean(action));

    React.useEffect(() => {
        if (!action) return;
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isLoading) onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [action, isLoading, onClose]);

    if (!action) return null;

    const displayAction: ChallengeAction = action === "cancel" && isExpired ? "refund" : action;
    const content = ACTION_CONTENT[displayAction];
    const Icon = content.icon;

    return createPortal(
        <div className="fixed inset-0 z-[10040] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-[2px]"
                onClick={onClose}
                disabled={isLoading}
                aria-label="Close confirmation"
            />
            <section
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="challenge-action-title"
                aria-describedby="challenge-action-description"
                className="relative z-10 w-full max-w-md border-2 border-black bg-[#fffaf7]"
            >
                <header className={`flex items-start gap-3 border-b-2 border-black p-4 ${content.header}`}>
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black text-black ${content.accent}`}>
                        <Icon className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="mb-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#7b6a62]">{content.eyebrow}</p>
                        <h2 id="challenge-action-title" className="text-lg font-black text-[#17120f]">{content.title}</h2>
                        <p id="challenge-action-description" className="mt-1 text-sm font-medium leading-relaxed text-[#6d5d55]">{content.description}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border border-black bg-white hover:bg-[#f5d547] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="p-4">
                    <div className="border border-black/15 bg-[#f7efe9] px-3 py-2 text-xs font-semibold text-[#6d5d55]">
                        {content.notice}
                    </div>
                    {error ? <p className="mt-2 text-xs font-bold text-red-700" role="alert">{error}</p> : null}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="h-11 cursor-pointer border-2 border-black bg-white text-sm font-black text-black hover:bg-[#f3e1d7] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Go back
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex h-11 cursor-pointer items-center justify-center gap-2 border-2 border-black text-sm font-black disabled:cursor-not-allowed disabled:opacity-60 ${content.button} ${content.buttonText}`}
                        >
                            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                            {isLoading ? "Processing..." : content.confirmLabel}
                        </button>
                    </div>
                </div>
            </section>
        </div>,
        document.body,
    );
}
