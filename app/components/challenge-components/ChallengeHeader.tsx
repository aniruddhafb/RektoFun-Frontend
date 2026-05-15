interface ChallengeHeaderProps {
    onOpenModal: () => void;
}

export function ChallengeHeader({ onOpenModal }: ChallengeHeaderProps) {
    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
                    <p className="text-gray-600 mt-1">Battle other traders in PvP prediction markets</p>
                </div>
                <button
                    onClick={onOpenModal}
                    className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-white/50 border border-gray-900 hover:bg-white/80 text-black text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Challenge
                </button>
            </div>
        </div>
    );
}
