"use client";

import { useState, useEffect } from "react";
import { CreateClanModal } from "./CreateClanModal";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import { getUserIdByWallet, hasClanByLeader } from "@/app/lib/clan-service/clans";
import AutoDismissErrorToast from "@/app/components/message-components/AutoDismissErrorToast";

interface ClanHeaderProps {
    onClanCreated?: () => void;
}

export function ClanHeader({ onClanCreated }: ClanHeaderProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { publicKey } = useSolanaWallet();
    const [userId, setUserId] = useState<string | undefined>(undefined);
    const [hasCreatedClan, setHasCreatedClan] = useState(false);
    const [showHasClanToast, setShowHasClanToast] = useState(false);

    // Fetch user ID when wallet is connected
    useEffect(() => {
        const fetchUserId = async () => {
            if (publicKey) {
                try {
                    const id = await getUserIdByWallet(publicKey.toBase58());
                    setUserId(id);
                    const userHasClan = await hasClanByLeader(id);
                    setHasCreatedClan(userHasClan);
                } catch (error) {
                    console.error("Failed to fetch user ID:", error);
                    setUserId(undefined);
                    setHasCreatedClan(false);
                }
            } else {
                setUserId(undefined);
                setHasCreatedClan(false);
            }
        };
        fetchUserId();
    }, [publicKey]);

    const showAlreadyHasClanError = () => {
        if (!hasCreatedClan) return;
        setShowHasClanToast(true);
    };

    return (
        <>
            <AutoDismissErrorToast
                isOpen={showHasClanToast}
                onClose={() => setShowHasClanToast(false)}
                title="You already have created one clan"
                description="A user can create only one clan."
                theme="red"
            />

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
                    <div>
                        <button
                            onClick={() => {
                                if (hasCreatedClan) {
                                    showAlreadyHasClanError();
                                    return;
                                }
                                setIsCreateModalOpen(true);
                            }}
                            className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-white/50 border border-gray-400 hover:bg-white/80 text-black text-sm font-medium rounded-full hover:bg-gray-800 transition-colors disabled:opacity-60"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Clan
                        </button>
                    </div>
                </div>
            </div>

            <CreateClanModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                userId={userId}
                hasCreatedClan={hasCreatedClan}
                onClanCreated={() => {
                    onClanCreated?.();
                    setHasCreatedClan(true);
                }}
            />
        </>
    );
}
