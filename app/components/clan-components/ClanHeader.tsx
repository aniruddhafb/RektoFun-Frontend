"use client";

import { useState } from "react";
import { PlusIcon, MyClansIcon } from "./Icons";
import { CreateClanModal } from "./CreateClanModal";

export function ClanHeader() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Explore Clans</h1>
                    </div>
                    <p className="text-gray-500 mt-1 text-base">Explore new clans, team up and compete to win together</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* <button className="flex items-center gap-2 px-4 py-2.5 bg-white/70 hover:bg-white/90 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 transition-all shadow-sm">
                        <MyClansIcon className="w-4 h-4" />
                        My Clans
                    </button> */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Create Clan
                    </button>
                </div>
            </div>

            <CreateClanModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </>
    );
}