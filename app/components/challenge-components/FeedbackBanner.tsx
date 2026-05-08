interface FeedbackBannerProps {
    rektTxSig: string | null;
    rektError: string | null;
    targetCreator: string | null;
}

export function FeedbackBanner({
    rektTxSig,
    rektError,
    targetCreator,
}: FeedbackBannerProps) {
    if (!rektTxSig && !rektError) return null;

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-4">
            {rektTxSig && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
                    ✅ You just REKT {targetCreator}…!{" "}
                    <a
                        href={`https://explorer.solana.com/tx/${rektTxSig}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        View on Explorer
                    </a>
                </div>
            )}
            {rektError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    ⚠️ {rektError}
                </div>
            )}
        </div>
    );
}
