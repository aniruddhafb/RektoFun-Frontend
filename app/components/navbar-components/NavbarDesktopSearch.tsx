"use client";

type NavbarDesktopSearchProps = {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
};

export function NavbarDesktopSearch({
    searchQuery,
    onSearchQueryChange,
}: NavbarDesktopSearchProps) {
    return (
        <div className="hidden md:flex items-center gap-6 flex-1 justify-center max-w-2xl mx-8">
            <div className="relative flex-1 max-w-md">
                <input
                    type="text"
                    placeholder="Search Challenges..."
                    value={searchQuery}
                    onChange={(event) => onSearchQueryChange(event.target.value)}
                    className="w-full px-4 py-2.5 pl-10 bg-white/50 border border-gray-300 rounded-full text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
                />
                <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>

            <a
                href="https://rektofun.gitbook.io/rektofun/introduction/how-it-works"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-gray-700 hover:text-black transition-colors whitespace-nowrap"
            >
                How it works?
            </a>
        </div>
    );
}
