import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "./types";

type Props = {
    currentStart: number;
    currentEnd: number;
    totalItems: number;
    safeCurrentPage: number;
    totalPages: number;
    pageButtons: Array<number | string>;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (size: number) => void;
};

export function MastersPagination({
    currentStart,
    currentEnd,
    totalItems,
    safeCurrentPage,
    totalPages,
    pageButtons,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
}: Props) {
    const hasResults = totalItems > 0;

    return (
        <div className="mt-10 rounded-xl border border-black/[0.08] bg-white/75 p-3 backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                <div className="text-center text-sm font-medium text-gray-500 lg:text-left">
                    {hasResults ? (
                        <>
                            Showing <span className="font-bold text-gray-900">{currentStart}-{currentEnd}</span> of{" "}
                            <span className="font-bold text-gray-900">{totalItems}</span>
                        </>
                    ) : (
                        "No results to show"
                    )}
                </div>

                <nav className="flex max-w-full items-center justify-start gap-1 overflow-x-auto pb-1 sm:justify-center sm:pb-0" aria-label="Masters pagination">
                    <button
                        onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
                        disabled={safeCurrentPage === 1}
                        className="grid h-10 w-10 place-items-center rounded-lg border border-black/[0.08] bg-white text-gray-500 transition hover:border-black/[0.16] hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    {pageButtons.map((item) =>
                        typeof item === "number" ? (
                            <button
                                key={item}
                                onClick={() => onPageChange(item)}
                                aria-current={safeCurrentPage === item ? "page" : undefined}
                                className={`grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-bold transition ${safeCurrentPage === item ? "bg-gray-950 text-white" : "border border-black/[0.08] bg-white text-gray-600 hover:border-black/[0.16] hover:bg-gray-50 hover:text-gray-950"}`}
                            >
                                {item}
                            </button>
                        ) : (
                            <span key={item} className="grid h-10 min-w-7 place-items-center text-sm font-bold text-gray-400">
                                ...
                            </span>
                        ),
                    )}

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
                        disabled={safeCurrentPage === totalPages}
                        className="grid h-10 w-10 place-items-center rounded-lg border border-black/[0.08] bg-white text-gray-500 transition hover:border-black/[0.16] hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-45"
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </nav>

                <div className="flex items-center justify-center gap-2 lg:justify-end">
                    <span className="text-sm font-medium text-gray-500">Rows</span>
                    <label className="relative inline-flex items-center">
                        <span className="sr-only">Items per page</span>
                        <select
                            value={itemsPerPage}
                            onChange={(event) => onItemsPerPageChange(Number(event.target.value))}
                            className="h-10 appearance-none rounded-lg border border-black/[0.08] bg-white py-2 pl-3 pr-9 text-sm font-bold text-gray-700 outline-none transition hover:border-black/[0.16] focus:border-gray-400 focus:ring-4 focus:ring-gray-900/[0.04]"
                        >
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-gray-400" />
                    </label>
                </div>
            </div>
        </div>
    );
}
