import { ChevronDown, Search, Shapes, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import type { RefObject } from "react";
import type { CategoryFilter, VerificationFilter } from "./types";
import { CATEGORY_OPTIONS, VERIFICATION_OPTIONS } from "./types";

type Props = {
    search: string;
    categoryFilter: CategoryFilter;
    verificationFilter: VerificationFilter;
    isCategoryOpen: boolean;
    isVerificationOpen: boolean;
    categoryRef: RefObject<HTMLDivElement | null>;
    verificationRef: RefObject<HTMLDivElement | null>;
    onSearchChange: (value: string) => void;
    onCategoryToggle: () => void;
    onVerificationToggle: () => void;
    onCategorySelect: (value: CategoryFilter) => void;
    onVerificationSelect: (value: VerificationFilter) => void;
    onOpenMobileFilters: () => void;
};

export function MastersFiltersBar({
    search,
    categoryFilter,
    verificationFilter,
    isCategoryOpen,
    isVerificationOpen,
    categoryRef,
    verificationRef,
    onSearchChange,
    onCategoryToggle,
    onVerificationToggle,
    onCategorySelect,
    onVerificationSelect,
    onOpenMobileFilters,
}: Props) {
    return (
        <div className="max-w-7xl pb-8">
            <div className="flex flex-col items-stretch gap-3 sm:gap-3 lg:flex-row lg:items-center">
                <div className="relative hidden w-full sm:block lg:max-w-md lg:flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search masters..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full rounded-full border border-black/15 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-[2px_2px_0_rgba(0,0,0,0.16)] placeholder:text-gray-400 outline-none transition hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)] focus:border-black/25 focus:bg-white focus:ring-4 focus:ring-gray-900/[0.04]"
                    />
                </div>

                <button
                    type="button"
                    onClick={onOpenMobileFilters}
                    className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-black/15 bg-white/75 px-4 py-3 text-sm font-medium text-gray-800 !shadow-none transition hover:border-black/25 hover:bg-white hover:!shadow-none active:!shadow-none sm:hidden"
                >
                    <span>Filters</span>
                    <span className="max-w-[65%] truncate text-right text-xs text-gray-500">
                        {categoryFilter} • {verificationFilter}
                    </span>
                </button>

                <div className="hidden w-full items-stretch gap-3 sm:grid sm:grid-cols-2 lg:w-auto">
                    <div className="relative w-full min-w-0" ref={categoryRef}>
                        <button
                            onClick={onCategoryToggle}
                            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${isCategoryOpen
                                ? "border-black/25 bg-white text-gray-950 shadow-[3px_3px_0_rgba(0,0,0,0.2)] ring-4 ring-gray-900/[0.04]"
                                : "border-black/15 bg-white/70 text-gray-700 hover:border-black/25 hover:bg-white hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)]"
                                }`}
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <Shapes className="h-4 w-4 text-gray-500" />
                                <span className="truncate">{categoryFilter}</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isCategoryOpen ? "rotate-180 text-gray-700" : ""}`} />
                        </button>
                        {isCategoryOpen ? (
                            <div className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-black/15 bg-white p-1.5 sm:w-auto sm:min-w-[14rem]">
                                {CATEGORY_OPTIONS.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => onCategorySelect(option)}
                                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${categoryFilter === option
                                            ? "bg-gray-950 font-semibold text-white"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
                                            }`}
                                    >
                                        <Shapes className={`h-4 w-4 ${categoryFilter === option ? "text-white" : "text-gray-500"}`} />
                                        <span className="truncate">{option}</span>
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="relative w-full min-w-0" ref={verificationRef}>
                        <button
                            onClick={onVerificationToggle}
                            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${isVerificationOpen
                                ? "border-black/25 bg-white text-gray-950 shadow-[3px_3px_0_rgba(0,0,0,0.2)] ring-4 ring-gray-900/[0.04]"
                                : "border-black/15 bg-white/70 text-gray-700 hover:border-black/25 hover:bg-white hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)]"
                                }`}
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <Shield className="h-4 w-4 text-gray-500" />
                                <span className="truncate">{verificationFilter}</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isVerificationOpen ? "rotate-180 text-gray-700" : ""}`} />
                        </button>
                        {isVerificationOpen ? (
                            <div className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-black/15 bg-white p-1.5 sm:w-auto sm:min-w-[14rem]">
                                {VERIFICATION_OPTIONS.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => onVerificationSelect(option)}
                                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${verificationFilter === option
                                            ? "bg-gray-950 font-semibold text-white"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
                                            }`}
                                    >
                                        {option === "Verified" ? (
                                            <ShieldCheck className={`h-4 w-4 ${verificationFilter === option ? "text-white" : "text-gray-500"}`} />
                                        ) : option === "Unverified" ? (
                                            <ShieldOff className={`h-4 w-4 ${verificationFilter === option ? "text-white" : "text-gray-500"}`} />
                                        ) : (
                                            <Shield className={`h-4 w-4 ${verificationFilter === option ? "text-white" : "text-gray-500"}`} />
                                        )}
                                        <span>{option}</span>
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
