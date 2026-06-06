interface ChallengeHeaderProps {
    onOpenModal: () => void;
}

export function ChallengeHeader({ onOpenModal }: ChallengeHeaderProps) {
    return (
        <div className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Challenges</h1>
                    <p className="mt-1 text-base text-gray-500">Battle other traders in PvP prediction markets</p>
                </div>
                <button
                    type="button"
                    onClick={(event) => {
                        event.currentTarget.blur();
                        onOpenModal();
                    }}
                    className="hidden cursor-pointer items-center justify-center rounded-lg border border-gray-950 bg-gray-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-black hover:shadow-md active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e85a2d]/30 md:inline-flex"
                >
                    <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Challenge
                </button>
            </div>
        </div>
    );
}
