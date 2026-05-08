export function RankBadge({ rank }: { rank: number }) {
    const colors: Record<number, { bg: string; text: string; border: string }> = {
        1: { bg: "bg-amber-400", text: "text-white", border: "border-amber-500" },
        2: { bg: "bg-gray-400", text: "text-white", border: "border-gray-500" },
        3: { bg: "bg-amber-700", text: "text-white", border: "border-amber-800" },
    };
    const style = colors[rank] ?? { bg: "bg-gray-300", text: "text-gray-700", border: "border-gray-400" };

    return (
        <div className={`absolute -top-1 -left-1 w-8 h-10 flex flex-col items-center justify-start pt-1 rounded-sm ${style.bg} ${style.text} z-10`}>
            <span className="text-xs font-bold leading-none">{rank}</span>
            {/* ribbon tail */}
            <div className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${rank === 1 ? "border-t-amber-400" : rank === 2 ? "border-t-gray-400" : rank === 3 ? "border-t-amber-700" : "border-t-gray-300"} mt-auto`} />
        </div>
    );
}