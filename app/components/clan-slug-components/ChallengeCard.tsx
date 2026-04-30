import Image from "next/image";
import { ClanChallenge } from "./types";
import { ClockIcon, InfoIcon, ShareIcon } from "./icons";

const ChallengeCard = ({ challenge }: { challenge: ClanChallenge }) => {
    const isAccept = challenge.action === "ACCEPT";

    return (
        <div className="bg-white/50 rounded-xl border border-white/70 p-3 sm:p-4 hover:bg-white/60 transition-all">
            {/* Top row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: challenge.assetColor }}
                    >
                        {challenge.asset === "SOL" ? "◎" : challenge.asset === "BTC" ? "₿" : challenge.asset === "ETH" ? "Ξ" : challenge.asset[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2">{challenge.title}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-green-500 flex-shrink-0" />
                            <span className="text-[10px] sm:text-xs text-gray-500">{challenge.creator}</span>
                        </div>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-500 font-medium">{challenge.mode}</span>
                    <InfoIcon className="w-3.5 h-3.5 text-gray-400" />
                </div>
            </div>

            {/* Participants + Action */}
            <div className="flex items-center justify-center gap-12 sm:gap-3">
                {/* Challenger */}
                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <span className="text-[8px] sm:text-[10px] font-bold bg-gray-800 text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                        {challenge.challenger.label}
                    </span>
                    <div className="relative">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                            <Image
                                src={challenge.challenger.avatar}
                                alt={challenge.challenger.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {challenge.challenger.pool && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center gap-0.5">
                                <span>💰</span>
                                <span>{challenge.challenger.pool}</span>
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-800 mt-0.5 sm:mt-1 truncate max-w-[60px] sm:max-w-none">{challenge.challenger.name}</span>
                    <span className="hidden sm:inline text-[10px] text-gray-400">{challenge.challenger.sublabel}</span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-[10px] sm:text-xs font-black">VS</span>
                    </div>
                </div>

                {/* Defender */}
                <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                    <span className="text-[8px] sm:text-[10px] font-bold bg-gray-700 text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                        {challenge.defender ? challenge.defender.label : "DEFENDER"}
                    </span>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center">
                        {challenge.defender ? (
                            <Image
                                src={challenge.defender.avatar}
                                alt={challenge.defender.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-gray-400 text-lg sm:text-xl font-bold">?</span>
                        )}
                    </div>
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-800 mt-0.5 sm:mt-1 truncate max-w-[60px] sm:max-w-none">
                        {challenge.defender ? challenge.defender.name : "No one yet!"}
                    </span>
                    <span className="hidden sm:inline text-[10px] text-gray-400">
                        {challenge.defender ? challenge.defender.sublabel : ""}
                    </span>
                </div>


                {/* Spacer */}
                <div className="flex-1 hidden sm:block" />

                {/* Action + Timer */}
                <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                        className={`px-5 py-2.5 rounded-lg font-bold text-sm text-white transition-all shadow-sm hover:opacity-90 active:scale-95 ${isAccept
                            ? "bg-gradient-to-r from-green-600 to-green-500"
                            : "bg-gradient-to-r from-green-700 to-green-600"
                            }`}
                    >
                        {challenge.action} {isAccept ? "⚔️" : ""}
                    </button>
                    <span className="text-[10px] text-gray-400">Expires in</span>
                    <div className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-700">{challenge.expiresIn}</span>
                    </div>
                </div>

            </div>
            {/* Mobile Timer */}
            <div className="flex sm:hidden flex-col items-center gap-0.5 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                    <span className="text-[10px] font-semibold text-gray-700">Expires In</span>
                </div>
                <div className="flex items-center gap-0.5">
                    <ClockIcon className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-[10px] font-semibold text-gray-700">{challenge.expiresIn}</span>
                </div>
            </div>

            {/* challenge btn  */}
            <div className="flex items-center justify-center gap-1 flex-shrink-0 sm:hidden mt-6 mb-6">
                <button
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs text-white transition-all shadow-sm hover:opacity-90 active:scale-95 ${isAccept
                        ? "bg-gradient-to-r from-green-600 to-green-500"
                        : "bg-gradient-to-r from-green-700 to-green-600"
                        }`}
                >
                    {challenge.action}
                </button>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                    <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{challenge.createdAgo}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                    <ShareIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{challenge.shares}</span>
                </div>
                {challenge.views > 0 && (
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                        <span>👁</span>
                        <span>{challenge.views}</span>
                    </div>
                )}
                <span className="ml-auto text-[10px] sm:text-xs text-gray-500 font-medium sm:hidden">{challenge.mode}</span>
            </div>
        </div>
    );
};

export default ChallengeCard;
