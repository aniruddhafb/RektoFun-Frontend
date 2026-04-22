"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSolanaWallet } from "../../lib/useSolanaWallet";
import {
  buildCreateChallengeTx,
  type CreateChallengeArgs,
} from "../../lib/rektofun-program";
import { DatePickerModal } from "./DatePickerModal";
import { DurationPickerModal } from "./DurationPickerModal";

interface Coin {
  symbol: string;
  name: string;
  logo: string;
}

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const coins: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", logo: "/scribbles/btc.png" },
  { symbol: "ETH", name: "Ethereum", logo: "/scribbles/coins.png" },
  { symbol: "SOL", name: "Solana", logo: "/scribbles/sol.png" },
  { symbol: "PEPE", name: "Pepe", logo: "/scribbles/pepe.png" },
  { symbol: "BONK", name: "Bonk", logo: "/scribbles/doge.png" },
];

export function CreateChallengeModal({
  isOpen,
  onClose,
  onCreated,
}: CreateChallengeModalProps) {
  const { authenticated, login, program, sendTransaction, publicKey } = useSolanaWallet();

  const [selectedCoin, setSelectedCoin] = useState<Coin>(coins[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [betAmount, setBetAmount] = useState(0.1);
  const [predictionDirection, setPredictionDirection] = useState("Above");
  const [isDirectionDropdownOpen, setIsDirectionDropdownOpen] = useState(false);
  const [predictionPrice, setPredictionPrice] = useState("66500");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [duration, setDuration] = useState({ hours: 4, minutes: 0 });
  const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const formatDuration = (dur: { hours: number; minutes: number }) => {
    if (dur.hours === 0 && dur.minutes === 0) return "Select duration";
    const days = Math.floor(dur.hours / 24);
    const remainingHours = dur.hours % 24;
    let result = "";
    if (days > 0) result += `${days}d `;
    if (remainingHours > 0) result += `${remainingHours}h `;
    if (dur.minutes > 0) result += `${dur.minutes}m`;
    return result.trim();
  };

  async function handleCreate() {
    if (!authenticated) { login(); return; }
    if (!program || !publicKey) { setTxError("Solana wallet not ready. Please wait or reconnect."); return; }

    setIsSubmitting(true);
    setTxError(null);
    setTxSig(null);

    try {
      const now = Math.floor(Date.now() / 1000);
      const expiryDurationSecs = duration.hours * 3600 + duration.minutes * 60;
      const expiresAt = now + expiryDurationSecs;
      const resolvesAt = expiresAt + 3600;

      const args: CreateChallengeArgs = {
        asset: selectedCoin.symbol,
        betAmountSol: betAmount,
        targetPriceUsdCents: Math.round(Number(predictionPrice) * 100),
        directionAbove: predictionDirection === "Above",
        expiresAt,
        resolvesAt,
      };

      const tx = await buildCreateChallengeTx(program, publicKey, args);
      const sig = await sendTransaction(tx);
      setTxSig(sig);
      onCreated();
      setTimeout(onClose, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTxError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#f3e1d7] rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[#f3e1d7] rounded-t-3xl px-6 pt-6 pb-4 border-b border-[#e8d5c8]">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <h2 className="text-2xl font-bold text-gray-900 flex-1 text-center">Create Challenge</h2>
            <div className="flex-1 flex justify-end">
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#e8d5c8] hover:bg-[#dcc9bc] transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-center text-gray-600 text-sm mt-1">Set your terms and invite degenerates to challenge you.</p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Coin</label>
            <div className="relative">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden">
                    <Image src={selectedCoin.logo} alt={selectedCoin.symbol} width={24} height={24} className="w-6 h-6 object-contain" />
                  </div>
                  <span className="font-semibold text-gray-900">{selectedCoin.symbol}</span>
                </div>
                <svg className={`w-5 h-5 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden">
                  {coins.map((coin) => (
                    <button key={coin.symbol} onClick={() => { setSelectedCoin(coin); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f3e1d7] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden">
                        <Image src={coin.logo} alt={coin.symbol} width={24} height={24} className="w-6 h-6 object-contain" />
                      </div>
                      <span className="font-medium text-gray-900">{coin.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bet Amount (SOL)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">◎</span>
              <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} step="0.01" min="0.01" className="w-full pl-8 pr-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:border-[#d4b8a8]" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Predict Price</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <button onClick={() => setIsDirectionDropdownOpen(!isDirectionDropdownOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors">
                  <span className="font-semibold text-gray-900">{selectedCoin.name} {predictionDirection}</span>
                  <svg className={`w-5 h-5 text-gray-500 transition-transform ${isDirectionDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isDirectionDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl shadow-lg z-10 overflow-hidden">
                    {["Above", "Below"].map((dir) => (
                      <button key={dir} onClick={() => { setPredictionDirection(dir); setIsDirectionDropdownOpen(false); }} className="w-full px-4 py-3 text-left hover:bg-[#f3e1d7] transition-colors font-medium text-gray-900">
                        {selectedCoin.name} {dir}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative w-32">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                <input type="number" value={predictionPrice} onChange={(e) => setPredictionPrice(e.target.value)} className="w-full pl-8 pr-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:border-[#d4b8a8]" placeholder="66500" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">End Date</label>
            <button onClick={() => setIsDatePickerOpen(true)} className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors">
              <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Challenge Expiry</label>
            <button onClick={() => setIsDurationPickerOpen(true)} className="w-full flex items-center justify-between px-4 py-3 bg-[#faf0eb] border border-[#e8d5c8] rounded-xl hover:border-[#d4b8a8] transition-colors">
              <span className="font-medium text-gray-900">{formatDuration(duration)}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="text-center py-2">
            <p className="text-gray-700">
              You win <span className="font-bold text-gray-900">◎{(betAmount * 2 * 0.98).toFixed(3)}</span> if {selectedCoin.symbol} closes {predictionDirection.toLowerCase()} ${Number(predictionPrice).toLocaleString()} in {formatDuration(duration)}
            </p>
            <p className="text-xs text-gray-500 mt-1">2% platform fee applies</p>
          </div>

          {txError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              ⚠️{" "}
              {txError.includes("https://faucet.solana.com") ? (
                <>
                  {txError.split("https://faucet.solana.com")[0]}
                  <a
                    href="https://faucet.solana.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    https://faucet.solana.com
                  </a>
                </>
              ) : (
                txError
              )}
            </div>
          )}
          {txSig && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
              ✅ Challenge created!{" "}
              <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="underline">View on Explorer</a>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-full text-gray-900 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-amber-400/50 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isSubmitting ? "Creating on-chain…" : !authenticated ? "Connect Wallet to Create" : "CREATE CHALLENGE"}
          </button>

          <p className="text-center text-sm text-gray-600">
            You can&apos;t cancel your challenge once it&apos;s accepted, so bet wisely!
          </p>
        </div>
      </div>

      <DatePickerModal isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <DurationPickerModal isOpen={isDurationPickerOpen} onClose={() => setIsDurationPickerOpen(false)} selectedDuration={duration} onSelectDuration={setDuration} />
    </div>
  );
}