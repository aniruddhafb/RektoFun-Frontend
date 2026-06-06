import Link from "next/link";
import { Info } from "lucide-react";

export function MastersPageHeader() {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Explore Masters</h1>
                <p className="mt-1 text-base text-gray-500">Discover top challenge creators and their track record</p>
            </div>
            {/* <Link href="https://rektofun.gitbook.io/rektofun/introduction/what-is-rektofun" target="_blank" className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700">
                <Info className="h-4 w-4" />
                How it works?
            </Link> */}
        </div>
    );
}
