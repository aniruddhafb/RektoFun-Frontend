"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
    Clock3,
    CircleAlert,
    CircleDollarSign,
    ExternalLink,
    LoaderCircle,
    ShieldCheck,
    Swords,
    X,
} from "lucide-react";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { getSolscanClusterQuery } from "@/app/lib/solana-config";

interface AcceptChallengeModalProps {
    isOpen: boolean;
    isLoading: boolean;
    usdcBalance?: number | null;
    betInput: string;
    betError: string;
    betCurrency: string;
    minAcceptBet?: number;
    maxAcceptBet?: number;
    escrowAddress?: string;
    resolveCountdown: string;
    resolveLabel: string;
    isTeam: boolean;
    joinSide: "TEAM_A" | "TEAM_B";
    onClose: () => void;
    onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
    onBetInputChange: (value: string) => void;
    onJoinSideChange: (side: "TEAM_A" | "TEAM_B") => void;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];
const GENERIC_ACCEPT_ERROR = "Something went wrong. Please try again.";

export function AcceptChallengeModal({
    isOpen,
    isLoading,
    usdcBalance,
    betInput,
    betError,
    betCurrency,
    minAcceptBet,
    maxAcceptBet,
    escrowAddress,
    resolveCountdown,
    resolveLabel,
    isTeam,
    joinSide,
    onClose,
    onSubmit,
    onBetInputChange,
    onJoinSideChange,
}: AcceptChallengeModalProps) {
    useBodyScrollLock(isOpen);

    const parsedBet = Number(betInput);
    const hasKnownBalance = typeof usdcBalance === "number" && Number.isFinite(usdcBalance);
    const requiredStake = Number.isFinite(parsedBet) && parsedBet > 0
        ? Math.max(parsedBet, minAcceptBet ?? 0)
        : (minAcceptBet ?? 0);
    const balanceShortfall = hasKnownBalance
        ? Math.max(requiredStake - (usdcBalance as number), 0)
        : 0;
    const hasLowBalance = balanceShortfall > 0;
    const formattedBalance =
        typeof usdcBalance === "number" && Number.isFinite(usdcBalance)
            ? usdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })
            : "0";

    const liveValidationError = React.useMemo(() => {
        if (!betInput.trim()) return "Enter a bet amount.";

        if (!Number.isFinite(parsedBet) || parsedBet <= 0) {
            return "Enter a valid bet amount.";
        }

        if (
            typeof usdcBalance === "number" &&
            Number.isFinite(usdcBalance) &&
            parsedBet > usdcBalance
        ) {
            return "Your balance is too low for this amount.";
        }

        if (typeof minAcceptBet === "number" && parsedBet < minAcceptBet) {
            return `Minimum bet is ${minAcceptBet} ${betCurrency}.`;
        }

        if (typeof maxAcceptBet === "number" && parsedBet > maxAcceptBet) {
            return `Maximum bet is ${maxAcceptBet} ${betCurrency}.`;
        }

        return "";
    }, [betInput, betCurrency, maxAcceptBet, minAcceptBet, parsedBet, usdcBalance]);

    const handleClose = React.useCallback(() => {
        if (!isLoading) onClose();
    }, [isLoading, onClose]);

    React.useEffect(() => {
        if (!isOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [handleClose, isOpen]);

    const handleMaxClick = () => {
        if (typeof usdcBalance === "number" && Number.isFinite(usdcBalance) && usdcBalance > 0) {
            const cappedAmount =
                typeof maxAcceptBet === "number" && Number.isFinite(maxAcceptBet)
                    ? Math.min(usdcBalance, maxAcceptBet)
                    : usdcBalance;
            onBetInputChange(String(cappedAmount));
            return;
        }

        if (typeof maxAcceptBet === "number" && Number.isFinite(maxAcceptBet)) {
            onBetInputChange(String(maxAcceptBet));
            return;
        }

        if (typeof minAcceptBet === "number" && Number.isFinite(minAcceptBet)) {
            onBetInputChange(String(minAcceptBet));
        }
    };

    const handleDeposit = () => {
        onClose();
        window.setTimeout(() => {
            window.dispatchEvent(new Event("rektofun:open-deposit"));
        }, 0);
    };

    const isPresetDisabled = (amount: number) => {
        if (typeof minAcceptBet === "number" && amount < minAcceptBet) return true;
        if (typeof maxAcceptBet === "number" && amount > maxAcceptBet) return true;
        return typeof usdcBalance === "number" && Number.isFinite(usdcBalance) && amount > usdcBalance;
    };

    const escrowAddressDisplay = React.useMemo(() => {
        if (!escrowAddress) return null;
        if (escrowAddress.length <= 14) return escrowAddress;
        return `${escrowAddress.slice(0, 6)}...${escrowAddress.slice(-6)}`;
    }, [escrowAddress]);
    const escrowHref = React.useMemo(() => {
        if (!escrowAddress) return null;
        return `https://solscan.io/account/${encodeURIComponent(escrowAddress)}${getSolscanClusterQuery()}`;
    }, [escrowAddress]);

    if (!isOpen) return null;

    // Never expose wallet, RPC, API, or program errors in the UI. Input
    // validation remains specific because it is safe and actionable.
    const displayedError = liveValidationError || (betError ? GENERIC_ACCEPT_ERROR : "");
    const submitLabel = isLoading
        ? "Accepting challenge"
        : liveValidationError
            ? "Accept challenge"
            : `Accept for ${parsedBet.toLocaleString()} ${betCurrency}`;

    return createPortal(
        <div className="fixed inset-0 z-[10020] flex items-center justify-center p-3 sm:p-5">
            <button
                type="button"
                onClick={handleClose}
                className="absolute inset-0 cursor-pointer bg-black/55 backdrop-blur-[3px]"
                aria-label="Close accept challenge dialog"
            />

            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="accept-challenge-title"
                className="rekto-modal-panel relative z-10 flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#ddcabe] bg-[#fffaf7] shadow-2xl"
            >
                <header className="flex items-start gap-3 border-b border-[#eadbd2] bg-white/70 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5d547] text-[#201a16] sm:h-12 sm:w-12">
                        <Swords className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.4} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 id="accept-challenge-title" className="text-xl font-black leading-tight text-[#201a16] sm:text-2xl">
                            Accept challenge
                        </h2>
                        <p className="mt-1 text-sm font-medium text-[#786a61]">
                            Review your side and stake.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#d9c8bd] bg-white text-[#665950] transition hover:border-[#201a16] hover:text-[#201a16] disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="h-4.5 w-4.5" strokeWidth={2.5} />
                    </button>
                </header>

                <form onSubmit={onSubmit} className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                    <div className="grid gap-0 overflow-hidden rounded-xl border border-[#e4d4ca] bg-white sm:grid-cols-[1.35fr_1fr] sm:divide-x sm:divide-[#eadbd2]">
                        <div className="min-w-0 border-b border-[#eadbd2] px-4 py-3.5 sm:border-b-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#8a776b]">
                                <Clock3 className="h-3.5 w-3.5" />
                                Resolves
                            </div>
                            <p className="mt-1 text-base font-black leading-tight text-[#201a16] sm:text-lg">
                                {resolveCountdown || "Resolution pending"}
                            </p>
                            <p className="mt-1 text-xs font-medium leading-snug text-[#786a61]">
                                {resolveLabel || "The result will be verified after the challenge ends."}
                            </p>
                        </div>
                        <div className="px-4 py-3.5">
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#8a776b]">Minimum</p>
                            <p className="mt-1 text-base font-black text-[#201a16] sm:text-lg">
                                {minAcceptBet ?? 0} {betCurrency}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-[#786a61]">Match or raise the challenger&apos;s stake</p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <label htmlFor="accept-challenge-bet-amount" className="text-sm font-black text-[#302722]">
                                Your stake
                            </label>
                            <p className="text-xs font-semibold text-[#786a61]">
                                Balance <span className="text-[#302722]">{formattedBalance} {betCurrency}</span>
                            </p>
                        </div>

                        <div className="flex items-center rounded-xl border-2 border-[#d8c7bc] bg-white px-4 transition focus-within:border-[#11895a] focus-within:ring-4 focus-within:ring-emerald-100">
                            <input
                                id="accept-challenge-bet-amount"
                                type="number"
                                min={minAcceptBet ?? 0}
                                max={maxAcceptBet}
                                step="any"
                                value={betInput}
                                onChange={(event) => onBetInputChange(event.target.value)}
                                className="min-w-0 flex-1 bg-transparent py-3.5 text-3xl font-black text-[#201a16] outline-none placeholder:text-[#c4b7af] sm:text-4xl"
                                placeholder="0"
                                aria-describedby={displayedError ? "accept-challenge-error" : undefined}
                                aria-invalid={Boolean(displayedError)}
                                autoFocus
                            />
                            <span className="ml-3 text-sm font-black text-[#665950]">{betCurrency}</span>
                        </div>

                        <div className="mt-2.5 grid grid-cols-6 gap-1.5 sm:gap-2">
                            {PRESET_AMOUNTS.map((amount) => {
                                const isActive = parsedBet === amount;
                                const isDisabled = isPresetDisabled(amount);
                                return (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => onBetInputChange(String(amount))}
                                        disabled={isDisabled}
                                        className={`cursor-pointer rounded-lg border px-1 py-2 text-xs font-bold transition sm:text-sm ${isActive
                                            ? "border-[#11895a] bg-emerald-50 text-[#08764b]"
                                            : "border-[#e1d3ca] bg-white text-[#5d5048] hover:border-[#9d887b]"
                                            } disabled:cursor-not-allowed disabled:bg-[#f4efec] disabled:text-[#b5a8a0]`}
                                    >
                                        {amount}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={handleMaxClick}
                                className="cursor-pointer rounded-lg border border-[#e1d3ca] bg-white px-1 py-2 text-xs font-bold text-[#5d5048] transition hover:border-[#9d887b] sm:text-sm"
                            >
                                Max
                            </button>
                        </div>

                        {displayedError ? (
                            <p id="accept-challenge-error" className="mt-2 text-xs font-semibold text-red-600" role="alert">
                                {displayedError}
                            </p>
                        ) : null}

                        {hasLowBalance ? (
                            <div className="mt-3 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 sm:flex-row sm:items-center">
                                <CircleAlert className="h-5 w-5 shrink-0 text-amber-700" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-amber-950">More USDC needed</p>
                                    <p className="text-xs font-medium text-amber-800">
                                        Deposit at least {balanceShortfall.toLocaleString(undefined, { maximumFractionDigits: 6 })} more {betCurrency} to join with this stake.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDeposit}
                                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#201a16] px-3 py-2 text-xs font-black text-white transition hover:bg-black"
                                >
                                    <CircleDollarSign className="h-4 w-4" />
                                    Deposit USDC
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-5">
                        <p className="mb-2 text-sm font-black text-[#302722]">Your side</p>
                        {isTeam ? (
                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#eee6e1] p-1">
                                <button
                                    type="button"
                                    onClick={() => onJoinSideChange("TEAM_A")}
                                    aria-pressed={joinSide === "TEAM_A"}
                                    className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-bold transition ${joinSide === "TEAM_A"
                                        ? "bg-white text-[#08764b] shadow-sm ring-1 ring-black/5"
                                        : "text-[#6f6158] hover:text-[#302722]"
                                        }`}
                                >
                                    Creator side
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onJoinSideChange("TEAM_B")}
                                    aria-pressed={joinSide === "TEAM_B"}
                                    className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-bold transition ${joinSide === "TEAM_B"
                                        ? "bg-white text-[#08764b] shadow-sm ring-1 ring-black/5"
                                        : "text-[#6f6158] hover:text-[#302722]"
                                        }`}
                                >
                                    Opponent side
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between rounded-xl border border-[#cde6d9] bg-[#eff9f4] px-3.5 py-3">
                                <span className="text-sm font-semibold text-[#53635b]">Joining as</span>
                                <span className="rounded-full bg-[#11895a] px-3 py-1 text-xs font-black text-white">Opponent</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#d8e9df] bg-[#f3faf6] px-3.5 py-3">
                        <ShieldCheck className="h-5 w-5 shrink-0 text-[#11895a]" strokeWidth={2.3} />
                        <p className="min-w-0 flex-1 text-xs font-semibold text-[#53635b] sm:text-sm">
                            Funds stay in escrow until resolution.
                        </p>
                        {escrowHref && escrowAddressDisplay ? (
                            <a
                                href={escrowHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-black text-[#08764b] hover:underline"
                                title={`View escrow ${escrowAddressDisplay}`}
                            >
                                View escrow
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        ) : null}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || Boolean(liveValidationError)}
                        className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[#0b6844] bg-[#11895a] px-5 py-3.5 text-base font-black text-white shadow-[0_3px_0_#0b6844] transition hover:-translate-y-0.5 hover:bg-[#0f7b50] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 sm:text-lg"
                    >
                        {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
                        {submitLabel}
                    </button>
                </form>
            </section>
        </div>,
        document.body,
    );
}
