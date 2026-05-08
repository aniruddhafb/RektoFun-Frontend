"use client";

import React from "react";

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
    resolutionSource?: string;
    isPoolMode: boolean;
    joinSide: "challenger" | "opponent";
    onClose: () => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onBetInputChange: (value: string) => void;
    onJoinSideChange: (side: "challenger" | "opponent") => void;
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
    resolutionSource,
    isPoolMode,
    joinSide,
    onClose,
    onSubmit,
    onBetInputChange,
    onJoinSideChange,
}: AcceptChallengeModalProps) {
    if (!isOpen) return null;
    const isPriceFeedResolution = String(resolutionSource ?? "").toLowerCase() === "price_feed";

    const parsedBet = Number(betInput);
    const isValidNumber = Number.isFinite(parsedBet) && parsedBet > 0;
    const amountForDisplay = isValidNumber ? parsedBet.toFixed(2) : "0.00";
    const liveValidationError = React.useMemo(() => {
        if (!betInput.trim()) return "Please enter a valid bet amount.";

        if (!Number.isFinite(parsedBet) || parsedBet <= 0) {
            return "Please enter a valid bet amount.";
        }

        if (
            typeof usdcBalance === "number" &&
            Number.isFinite(usdcBalance) &&
            parsedBet > usdcBalance
        ) {
            return "Not enough balance.";
        }

        if (typeof minAcceptBet === "number" && parsedBet < minAcceptBet) {
            return `Bet amount must be at least ${minAcceptBet} ${betCurrency}.`;
        }

        if (typeof maxAcceptBet === "number" && parsedBet > maxAcceptBet) {
            return `Bet amount must be at most ${maxAcceptBet} ${betCurrency}.`;
        }

        return "";
    }, [betInput, betCurrency, maxAcceptBet, minAcceptBet, parsedBet, usdcBalance]);

    const handlePresetClick = (value: number) => {
        onBetInputChange(String(value));
    };

    const handleMaxClick = () => {
        if (typeof usdcBalance === "number" && Number.isFinite(usdcBalance) && usdcBalance > 0) {
            const cappedByChallengeMax =
                typeof maxAcceptBet === "number" && Number.isFinite(maxAcceptBet)
                    ? Math.min(usdcBalance, maxAcceptBet)
                    : usdcBalance;
            onBetInputChange(String(cappedByChallengeMax));
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

    const escrowAddressDisplay = React.useMemo(() => {
        if (!escrowAddress) return "Not available";
        if (escrowAddress.length <= 14) return escrowAddress;
        return `${escrowAddress.slice(0, 6)}...${escrowAddress.slice(-6)}`;
    }, [escrowAddress]);
    const escrowHref = React.useMemo(() => {
        if (!escrowAddress) return null;
        return `https://solscan.io/account/${encodeURIComponent(escrowAddress)}?cluster=devnet`;
    }, [escrowAddress]);

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm md:p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#e8d5c8] bg-[#f8ede7] shadow-2xl"
            >
                <div className="relative overflow-hidden bg-gradient-to-r from-[#f6efe9] via-[#f8ede7] to-[#f4ebe3] px-4 py-4 md:px-8 md:py-5">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.8),transparent_45%)]" />
                    <div className="relative flex items-start justify-between gap-3">
                        <div className="flex flex-1 flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4 md:gap-6">
                            <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-[#efe5dc] ring-1 ring-[#e8d9cd] sm:h-[120px] sm:w-[120px] md:h-[150px] md:w-[150px]">
                                <video
                                    src="/animations/Sword%20Battle.webm"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="mt-2 text-2xl font-black leading-tight text-[#171411] sm:mt-3 sm:text-3xl">Counter This Challenge</h3>
                                <p className="mt-1.5 text-sm text-[#6f6a63] sm:mt-2">Confirm your bet to join this prediction battle.</p>
                                {isPoolMode ? (
                                    <div className="mt-3 space-y-2 sm:mt-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#6f6a63]">
                                            Which side do you want to join?
                                        </p>
                                        <div className="inline-flex rounded-xl border border-[#d7ebe1] bg-[#f5fcf8] p-1">
                                            <button
                                                type="button"
                                                onClick={() => onJoinSideChange("challenger")}
                                                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition ${joinSide === "challenger"
                                                    ? "bg-emerald-600 text-white"
                                                    : "text-[#2a8f66] hover:bg-emerald-100"
                                                    }`}
                                            >
                                                Challenger
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onJoinSideChange("opponent")}
                                                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition ${joinSide === "opponent"
                                                    ? "bg-emerald-600 text-white"
                                                    : "text-[#2a8f66] hover:bg-emerald-100"
                                                    }`}
                                            >
                                                Opponent
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-3 space-y-2 sm:mt-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#6f6a63]">
                                            You are joining as an
                                        </p>
                                        <div className="inline-flex rounded-xl border border-[#d7ebe1] bg-[#f5fcf8] p-1">
                                            <button
                                                type="button"
                                                onClick={() => onJoinSideChange("opponent")}
                                                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition ${joinSide === "opponent"
                                                    ? "bg-emerald-600 text-white"
                                                    : "text-[#2a8f66] hover:bg-emerald-100"
                                                    }`}
                                            >
                                                Opponent
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="group h-9 w-9 shrink-0 cursor-pointer rounded-full border border-[#e7d9ce] bg-white text-base font-semibold text-[#6f6a63] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#d9c6b8] hover:bg-[#fffaf7] hover:text-[#2d1f1a] hover:shadow disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-10 sm:text-lg"
                            aria-label="Close"
                        >
                            <span className="leading-none">×</span>
                        </button>
                    </div>

                    <div className="mt-5 grid gap-3 rounded-2xl border border-[#e4d6cc] bg-white/75 p-3 md:grid-cols-2 md:p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-lg">⏱️</div>
                            <div>
                                <p className="text-xs font-medium text-gray-900">
                                    {isPriceFeedResolution ? "Challenge resolves in" : "Challenge resolves on"}
                                </p>
                                <p className="text-2xl font-bold text-[#1f1b16]">
                                    {isPriceFeedResolution ? resolveCountdown : "Match day"}
                                </p>
                                <p className="text-xs text-gray-900">
                                    {isPriceFeedResolution ? resolveLabel : "community resolves this after match ends"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 border-t border-[#eee2d8] pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg">💵</div>
                            <div>
                                <p className="text-xs font-medium text-gray-900">Min bet</p>
                                <p className="text-2xl font-bold text-[#1f1b16]">${(minAcceptBet ?? 0)}</p>
                                <p className="text-xs text-gray-900">You can bet ${(minAcceptBet ?? 0)} or more</p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="space-y-4 px-4 py-4 md:px-8 md:py-5">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6f6a63]">Your bet amount</p>
                        <div className="grid overflow-hidden rounded-2xl border border-[#d4c1b5] bg-white md:grid-cols-[220px_1fr]">
                            <div className="flex items-center gap-3 border-b border-[#eee2d8] bg-[#f9f3ee] px-4 py-4 md:border-b-0 md:border-r">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-base">💲</div>
                                <p className="text-lg font-semibold text-[#2d1f1a]">{betCurrency}</p>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                                <input
                                    id="accept-challenge-bet-amount"
                                    type="number"
                                    min={minAcceptBet ?? 0}
                                    max={maxAcceptBet}
                                    step="any"
                                    value={betInput}
                                    onChange={(e) => onBetInputChange(e.target.value)}
                                    className="w-1/2 bg-transparent text-3xl font-black text-[#1f1b16] outline-none sm:text-4xl"
                                    placeholder="0"
                                />
                                {/* fetch the balance  */}
                                <div className="text-right">
                                    <p className="text-xs font-semibold uppercase text-[#9d958d]">Balance</p>
                                    <p className="text-2xl font-semibold text-[#53473f]">${usdcBalance}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-6">
                            {PRESET_AMOUNTS.map((amount) => {
                                const isActive = parsedBet === amount;
                                return (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => handlePresetClick(amount)}
                                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${isActive
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-[#e6d7cc] bg-white text-[#53473f] hover:border-[#ccb6a8]"
                                            }`}
                                    >
                                        {amount}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={handleMaxClick}
                                className="rounded-xl border border-[#e6d7cc] bg-white px-3 py-2 text-sm font-semibold text-[#53473f] transition hover:border-[#ccb6a8]"
                            >
                                MAX
                            </button>
                        </div>
                        <p className="mt-1 text-[11px] text-[#7b746d]">
                            Available balance: {typeof usdcBalance === "number" && Number.isFinite(usdcBalance) ? usdcBalance.toFixed(2) : "0.00"} {betCurrency}
                        </p>

                        {liveValidationError || betError ? (
                            <p className="mt-2 text-xs text-red-600">{liveValidationError || betError}</p>
                        ) : null}
                    </div>

                    {/* info section  */}
                    <div className="grid gap-2 sm:grid-cols-2">
                        {/* contract section  */}
                        <div className="grid rounded-xl border border-[#e7ddd5] bg-white p-2.5">
                            <div className="flex items-center gap-2 md:pr-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-[#1f1b16]">
                                        Your funds are secure <span className="text-emerald-600">🔒</span>
                                    </p>
                                    <p className="truncate text-xs text-[#66615b]">
                                        Bet stays in escrow until challenge resolution.
                                    </p>
                                    <p className="text-[11px] text-[#7b746d]">Escrow Contract</p>
                                    <div className="mt-0.5 flex items-center gap-1">
                                        {escrowHref ? (
                                            <a
                                                href={escrowHref}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-bold text-emerald-700 underline-offset-2 hover:underline"
                                            >
                                                {escrowAddressDisplay} ↗
                                            </a>
                                        ) : (
                                            <p className="text-sm font-bold text-emerald-700">{escrowAddressDisplay} ↗</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* winner section  */}
                        <div className="flex items-center gap-2 rounded-xl border border-[#d9ece3] bg-[#eff8f3] px-2.5 py-2">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[#2d2a26]">Prize is distributed after challenge gets resolved 🏆</p>
                                <p className=" text-xs text-[#67615b]">Fair play guaranteed. Back your prediction with confidence.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || Boolean(liveValidationError)}
                        className="cursor-pointer w-full rounded-2xl bg-[#11895a] px-5 py-3.5 text-lg font-black text-white shadow-lg transition hover:bg-[#0f7b50] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isLoading ? "PROCESSING..." : "ACCEPT & PROCEED"}
                    </button>

                </form>
            </div>
        </div>
    );
}
