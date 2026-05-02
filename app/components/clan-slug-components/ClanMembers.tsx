"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClanMember } from "@/app/lib/clan-service/clanMembers";
import { getClanMembers } from "@/app/lib/clan-service/clanMembers";
import RoleBadge from "./RoleBadge";
import { SearchIcon } from "./icons";

interface ClanMembersProps {
    clanId: string;
    maxMembers: number;
    refreshKey?: number;
}

const ClanMembers = ({ clanId, maxMembers, refreshKey }: ClanMembersProps) => {
    const [members, setMembers] = useState<ClanMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [memberSearch, setMemberSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    useEffect(() => {
        async function fetchMembers() {
            try {
                setLoading(true);
                setError(null);
                const response = await getClanMembers(clanId);
                console.log("Fetched members:", response);
                setMembers(response.members);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch members");
            } finally {
                setLoading(false);
            }
        }

        if (clanId) {
            fetchMembers();
        }
    }, [clanId, refreshKey]);

    const filteredMembers = members.filter((m) => {
        const matchSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase());
        const matchRole = roleFilter === "All" || m.role === roleFilter;
        return matchSearch && matchRole;
    });

    const currentMembers = members.length;

    if (loading) {
        return (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5 flex flex-col max-h-[600px] items-center justify-center">
                <p className="text-gray-500 text-sm">Loading members...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5 flex flex-col max-h-[600px] items-center justify-center">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5 flex flex-col max-h-[600px]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900">
                    Members{" "}
                    <span className="text-gray-400 font-normal text-sm">
                        ({currentMembers}/{maxMembers})
                    </span>
                </h2>
            </div>

            {/* Search - Outside Scroll Area */}
            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-[#f3e1d7]/60 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                </div>
            </div>

            {/* Member List - Scrollable */}
            <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin">
                <div className="space-y-3">
                    {filteredMembers.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">No members found</p>
                    ) : (
                        filteredMembers.map((member) => (
                            <Link
                                key={member.id}
                                href={`/profile/${member.wallet_address}`}
                                className="flex items-center gap-3 py-2 border-b border-gray-100/80 last:border-0 hover:bg-gray-50/50 transition-colors duration-200 rounded-lg"
                            >
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border border-white shadow-sm">
                                    <Image
                                        src={member.avatar}
                                        alt={member.name}
                                        width={36}
                                        height={36}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-sm font-semibold text-gray-900 truncate">{member.name}</span>
                                        <RoleBadge role={member.role} />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="text-sm font-bold text-gray-900">{member.rektPoints}</span>
                                    <span className="text-[10px] text-gray-400">REKT Points</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClanMembers;
