import { Search, Shapes, Shield, ShieldCheck, ShieldOff } from "lucide-react";
import { createPortal } from "react-dom";
import type { CategoryFilter, VerificationFilter } from "./types";
import { CATEGORY_OPTIONS, VERIFICATION_OPTIONS } from "./types";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

type Props = {
    isOpen: boolean;
    search: string;
    categoryFilter: CategoryFilter;
    verificationFilter: VerificationFilter;
    onClose: () => void;
    onSearchChange: (value: string) => void;
    onCategorySelect: (value: CategoryFilter) => void;
    onVerificationSelect: (value: VerificationFilter) => void;
};

export function MastersMobileFiltersSheet({
    isOpen,
    search,
    categoryFilter,
    verificationFilter,
    onClose,
    onSearchChange,
    onCategorySelect,
    onVerificationSelect,
}: Props) {
    useBodyScrollLock(isOpen);

    if (!isOpen) return null;

    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] sm:hidden">
            <button
                type="button"
                aria-label="Close filters"
                onClick={onClose}
                className="absolute inset-0 bg-black/40"
            />

            <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border border-b-0 border-black/[0.06] bg-white p-4 pb-6">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />

                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">Master Filters</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-2 py-1 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                    >
                        Close
                    </button>
                </div>

                <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Search</p>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search masters..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full rounded-xl border border-black/[0.07] py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-900/[0.04]"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Category</p>
                    <div className="space-y-2">
                        {CATEGORY_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => onCategorySelect(option)}
                                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${categoryFilter === option
                                    ? "border-gray-950 bg-gray-950 font-semibold text-white"
                                    : "border-black/[0.07] text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                <Shapes className="h-4 w-4" />
                                <span className="block truncate">{option}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Verification</p>
                    <div className="space-y-2">
                        {VERIFICATION_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => onVerificationSelect(option)}
                                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${verificationFilter === option
                                    ? "border-gray-950 bg-gray-950 font-semibold text-white"
                                    : "border-black/[0.07] text-gray-700 hover:bg-gray-50"
                                    }`}
                            >
                                {option === "Verified" ? (
                                    <ShieldCheck className="h-4 w-4" />
                                ) : option === "Unverified" ? (
                                    <ShieldOff className="h-4 w-4" />
                                ) : (
                                    <Shield className="h-4 w-4" />
                                )}
                                <span>{option}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
