"use client";

import { useState } from "react";
import Image from "next/image";
import { Member } from "./types";
import RoleBadge from "./RoleBadge";
import { SearchIcon } from "./icons";

interface ClanMembersProps {
    members: Member[];
    currentMembers: number;
    maxMembers: number;
}

const ClanMembers = ({ members, currentMembers, maxMembers }: ClanMembersProps) => {
    const [memberSearch, setMemberSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");

    const filteredMembers = members.filter((m) => {
        const matchSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase());
        const matchRole = roleFilter === "All" || m.role === roleFilter;
        return matchSearch && matchRole;
    });

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                    Members{" "}
                    <span className="text-gray-400 font-normal text-sm">
                        ({currentMembers}/{maxMembers})
                    </span>
                </h2>
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-2 mb-4">
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

            {/* Member List */}
            <div className="space-y-3">
                {filteredMembers.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center gap-3 py-2 border-b border-gray-100/80 last:border-0"
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
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClanMembers;
