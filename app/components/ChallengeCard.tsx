"use client";

import Image from "next/image";
import { lamportsToSol, formatTimeRemaining, type OnChainChallenge } from "../lib/rektofun-program";

interface ChallengeCardProps {
  challenge: OnChainChallenge;
  onRekt: (c: OnChainChallenge) => void;
}

interface Coin {
  symbol: string;
  name: string;
  logo: string;
}

const coins: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", logo: "/scribbles/btc.png" },
  { symbol: "ETH", name: "Ethereum", logo: "/scribbles/coins.png" },
  { symbol: "SOL", name: "Solana", logo: "/scribbles/sol.png" },
  { symbol: "PEPE", name: "Pepe", logo: "/scribbles/pepe.png" },
  { symbol: "BONK", name: "Bonk", logo: "/scribbles/doge.png" },
];

export function ChallengeCard({ challenge, onRekt }: ChallengeCardProps) {
  const betSol = lamportsToSol(challenge.betAmount);
  const timeLeft = formatTimeRemaining(challenge.expiresAt);
  const isExpired = challenge.expiresAt < Math.floor(Date.now() / 1000);
  const targetPrice = Number(challenge.targetPriceUsdCents) / 100;

  const assetLogo = coins.find((c) => c.symbol === challenge.asset)?.logo ?? "/scribbles/coins.png";

  return (
    <div className="bg-[#f8ede7] rounded-2xl p-4 shadow-sm border border-white/50 hover:shadow-lg transition-shadow block">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
            <Image src={assetLogo} alt={challenge.asset} width={32} height={32} className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-base leading-tight">
              {challenge.asset} {challenge.direction} ${targetPrice.toLocaleString()}?
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              {challenge.creator.toBase58().slice(0, 8)}…
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          challenge.status === "Open" ? "bg-emerald-100 text-emerald-700"
          : challenge.status === "Active" ? "bg-blue-100 text-blue-700"
          : challenge.status === "Settled" ? "bg-gray-100 text-gray-600"
          : "bg-red-100 text-red-600"
        }`}>
          {challenge.status}
        </span>
      </div>

      <div className="border-t border-gray-200 my-3" />

      <div className="text-center mb-3">
        <p className="text-xl font-bold text-gray-900">
          <span className="text-emerald-600">◎{betSol.toFixed(3)}</span>{" "}
          <span className="text-gray-700">Bet on {challenge.asset} {challenge.direction} ${targetPrice.toLocaleString()}</span>
        </p>
      </div>

      <div className="flex justify-between text-sm text-gray-500 mb-3">
        <span>Prize pool: <span className="font-semibold text-gray-800">◎{(betSol * 2 * 0.98).toFixed(3)}</span></span>
        <span>Target: <span className="font-semibold text-gray-800">${targetPrice.toLocaleString()}</span></span>
      </div>

      {challenge.status === "Open" && !isExpired ? (
        <button
          onClick={() => onRekt(challenge)}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-xl text-gray-900 font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-amber-400/50 flex items-center justify-center gap-2"
        >
          REKT HIM <span className="text-xl">😈</span>
        </button>
      ) : (
        <div className="w-full py-2.5 px-4 bg-gray-100 rounded-xl text-gray-500 font-bold text-base text-center">
          {isExpired ? "Expired" : challenge.status}
        </div>
      )}

      <p className="text-center text-xs text-gray-600 mt-1.5">
        {isExpired ? "Challenge expired" : <>Expires in <span className="font-medium text-gray-900">{timeLeft}</span></>}
      </p>
    </div>
  );
}