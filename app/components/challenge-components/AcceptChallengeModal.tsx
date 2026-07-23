"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
    Clock3,
    Check,
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
    joinCountdown: string;
    joinLabel: string;
    currentPoolAmount: number;
    selectedSidePoolAmount: number;
    isTeam: boolean;
    requiresCreatorStakeMatch: boolean;
    joinSide: "TEAM_A" | "TEAM_B";
    onClose: () => void;
    onSubmit: (event: React.SubmitEvent<HTMLFormElement>) => void;
    onBetInputChange: (value: string) => void;
    onJoinSideChange: (side: "TEAM_A" | "TEAM_B") => void;
}

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];
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
    joinCountdown,
    joinLabel,
    currentPoolAmount,
    selectedSidePoolAmount,
    isTeam,
    requiresCreatorStakeMatch,
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
    const validStake = Number.isFinite(parsedBet) && parsedBet > 0 ? parsedBet : 0;
    const potentialPayout = validStake > 0
        ? (validStake / Math.max(selectedSidePoolAmount + validStake, validStake))
            * Math.max(currentPoolAmount + validStake, validStake)
        : 0;
    const potentialProfit = Math.max(potentialPayout - validStake, 0);
    const formatAmount = (amount: number) => amount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

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
            return isTeam
                ? `The opponent side must first match the creator's stake. Bet at least ${minAcceptBet} ${betCurrency}.`
                : `Your bet must match or exceed the challenger's ${minAcceptBet} ${betCurrency} stake.`;
        }

        if (typeof maxAcceptBet === "number" && parsedBet > maxAcceptBet) {
            return `Maximum bet is ${maxAcceptBet} ${betCurrency}.`;
        }

        return "";
    }, [betInput, betCurrency, isTeam, maxAcceptBet, minAcceptBet, parsedBet, usdcBalance]);

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

    const displayedError = liveValidationError || betError;
    const submitLabel = isLoading
        ? "Accepting challenge"
        : liveValidationError
            ? "Accept challenge"
            : `Accept for ${parsedBet.toLocaleString()} ${betCurrency}`;

    return createPortal(
        <div className="fixed inset-0 z-[10020] flex items-center justify-center p-3 min-[380px]:p-4 sm:p-5">
            <button
                type="button"
                onClick={handleClose}
                className="absolute inset-0 cursor-pointer bg-black/45 backdrop-blur-[2px]"
                aria-label="Close accept challenge dialog"
            />

            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="accept-challenge-title"
                className="accept-challenge-modal rekto-modal-panel relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden border-2 border-black bg-[#fffaf6] min-[380px]:max-h-[calc(100dvh-2rem)] sm:max-h-[90vh]"
            >
                <header className="flex shrink-0 items-center gap-2.5 border-b-2 border-black px-3 py-2.5 sm:px-5 sm:py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-[#f5d547] text-black sm:h-9 sm:w-9">
                        <Swords className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2.5} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 id="accept-challenge-title" className="text-base font-black tracking-tight text-[#17120f] sm:text-lg">
                            Accept challenge
                        </h2>
                        <p className="text-[11px] font-bold text-[#7a6961]">
                            Pick a side. Back your call.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-[#f5d547] disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
                        aria-label="Close"
                    >
                        <X className="h-4.5 w-4.5" strokeWidth={2.5} />
                    </button>
                </header>

                <form onSubmit={onSubmit} className="min-h-0 overflow-y-auto overscroll-contain bg-[#fffaf6] px-3 py-3 sm:px-4 sm:py-4">
                    <div className="grid grid-cols-2 divide-x-2 divide-black overflow-hidden border-2 border-black bg-[#f3e1d7]">
                        <div className="min-w-0 px-3 py-2" title={joinLabel || undefined}>
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#b45309]">
                                <Clock3 className="h-3 w-3" />
                                Joins close
                            </div>
                            <p className="mt-0.5 truncate text-sm font-black leading-tight text-[#17120f]">
                                {joinCountdown || "Closing soon"}
                            </p>
                        </div>
                        <div className="min-w-0 px-3 py-2" title={resolveLabel || undefined}>
                            <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#8a776b]">Resolves in</p>
                            <p className="mt-0.5 truncate text-sm font-black leading-tight text-[#201a16]">
                                {resolveCountdown || "Resolution pending"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#302722]">Your side</p>
                        {isTeam ? (
                            <div className="grid grid-cols-2 gap-2 border-2 border-black bg-[#f3e1d7] p-1.5">
                                <button
                                    type="button"
                                    onClick={() => onJoinSideChange("TEAM_A")}
                                    aria-pressed={joinSide === "TEAM_A"}
                                    className={`flex cursor-pointer items-center justify-center gap-1.5 border-2 px-3 py-2.5 text-sm font-black transition ${joinSide === "TEAM_A"
                                        ? "border-black bg-black text-white shadow-[3px_3px_0_#f5d547]"
                                        : "border-transparent bg-white text-[#6f6158] hover:border-black hover:text-black"
                                        }`}
                                >
                                    {joinSide === "TEAM_A" ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                                    Creator side
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onJoinSideChange("TEAM_B")}
                                    aria-pressed={joinSide === "TEAM_B"}
                                    className={`flex cursor-pointer items-center justify-center gap-1.5 border-2 px-3 py-2.5 text-sm font-black transition ${joinSide === "TEAM_B"
                                        ? "border-black bg-black text-white shadow-[3px_3px_0_#e85a2d]"
                                        : "border-transparent bg-white text-[#6f6158] hover:border-black hover:text-black"
                                        }`}
                                >
                                    {joinSide === "TEAM_B" ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                                    Opponent side
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between border-2 border-black bg-[#f3e1d7] px-3.5 py-2.5">
                                <span className="text-sm font-semibold text-[#53635b]">Joining as</span>
                                <span className="border border-black bg-black px-3 py-1 text-xs font-black text-white shadow-[2px_2px_0_#e85a2d]">Opponent</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <label htmlFor="accept-challenge-bet-amount" className="text-[10px] font-black uppercase tracking-[0.12em] text-[#302722]">
                                Your stake
                            </label>
                            <p className="text-xs font-semibold text-[#786a61]">
                                Min {minAcceptBet ?? 0} · Balance <span className="text-[#302722]">{formattedBalance} {betCurrency}</span>
                            </p>
                        </div>

                        {isTeam && !requiresCreatorStakeMatch ? (
                            <p className="mb-2 text-[10px] font-bold text-emerald-700">
                                The opponent side has covered the creator stake. New bets can start from 1 {betCurrency}.
                            </p>
                        ) : null}

                        <div className="flex items-center border-2 border-black bg-white px-4 transition focus-within:shadow-[3px_3px_0_#f5d547]">
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
                                        className={`cursor-pointer border-2 px-1 py-2 text-xs font-black transition sm:text-sm ${isActive
                                            ? "border-black bg-[#f5d547] text-black shadow-[2px_2px_0_#111]"
                                            : "border-black/20 bg-white text-[#5d5048] hover:border-black"
                                            } disabled:cursor-not-allowed disabled:bg-[#f4efec] disabled:text-[#b5a8a0]`}
                                    >
                                        {amount}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={handleMaxClick}
                                className="cursor-pointer border-2 border-black/20 bg-white px-1 py-2 text-xs font-black text-[#5d5048] transition hover:border-black sm:text-sm"
                            >
                                Max
                            </button>
                        </div>

                        {validStake > 0 && !liveValidationError ? (
                            <div className="mt-3 flex items-center justify-between gap-4 border-2 border-black bg-[#fff5bd] px-3 py-3 shadow-[2px_2px_0_#111] sm:px-4">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-[0.09em] text-[#8a6500]">If your side wins</p>
                                    <p className="mt-0.5 text-xs font-semibold text-[#6f6259]">
                                        +{formatAmount(potentialProfit)} {betCurrency} potential profit
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-2xl font-black leading-none text-[#08764b]">
                                        {formatAmount(potentialPayout)} <span className="text-xs">{betCurrency}</span>
                                    </p>
                                    <p className="mt-1 text-[10px] font-semibold text-[#807268]">estimated payout · before fees</p>
                                </div>
                            </div>
                        ) : null}

                        {displayedError ? (
                            <p id="accept-challenge-error" className="mt-2 text-xs font-semibold text-red-600" role="alert">
                                {displayedError}
                            </p>
                        ) : null}

                        {hasLowBalance ? (
                            <div className="mt-3 flex flex-col gap-3 border-2 border-black bg-amber-50 px-3.5 py-3 sm:flex-row sm:items-center">
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
                                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border-2 border-black bg-black px-3 py-2 text-xs font-black text-white transition hover:bg-[#27211e] hover:shadow-[2px_2px_0_#e85a2d]"
                                >
                                    <CircleDollarSign className="h-4 w-4" />
                                    Deposit USDC
                                </button>
                            </div>
                        ) : null}
                    </div>

                    {escrowHref && escrowAddressDisplay ? (
                        <div className="group relative mt-3 flex justify-end focus-within:z-10">
                            <a
                                href={escrowHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex cursor-pointer items-center gap-1.5 border border-black/30 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.06em] text-[#6b5e56] transition hover:border-black hover:text-black focus:outline-none focus:ring-2 focus:ring-[#f5d547]"
                                aria-describedby="accept-escrow-tooltip"
                            >
                                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                                View escrow
                                <ExternalLink className="h-3 w-3" />
                            </a>
                            <div
                                id="accept-escrow-tooltip"
                                role="tooltip"
                                className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 w-64 border border-black bg-black px-3 py-2 text-xs font-bold leading-relaxed text-white opacity-0 shadow-[2px_2px_0_#e85a2d] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                            >
                                Your funds stay locked in escrow until resolution{resolveLabel ? ` on ${resolveLabel}` : ""}.
                                <span className="absolute right-5 top-full border-4 border-transparent border-t-[#201a16]" />
                            </div>
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isLoading || Boolean(liveValidationError)}
                        className="rekto-button mt-5 flex h-12 w-full cursor-pointer items-center justify-center gap-2 border-2 border-black bg-black px-5 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-[#27211e] hover:shadow-[3px_3px_0_#e85a2d] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 sm:text-base"
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
