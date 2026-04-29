"use client";

import { ClanData } from "./types";
import { ChevronDownIcon } from "./icons";

interface ClanSettingsProps {
    clanData: ClanData;
}

const ClanSettings = ({ clanData }: ClanSettingsProps) => {
    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Clan Settings</h2>
            <div className="space-y-5 max-w-xl">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Clan Name</label>
                    <input
                        type="text"
                        defaultValue={clanData.name}
                        className="w-full px-4 py-2.5 bg-[#f3e1d7]/60 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                    <textarea
                        defaultValue={`${clanData.tagline} ${clanData.description}`}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-[#f3e1d7]/60 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Clan Type</label>
                    <div className="relative">
                        <select
                            defaultValue="Public"
                            className="w-full appearance-none pl-4 pr-9 py-2.5 bg-[#f3e1d7]/60 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
                        >
                            <option>Public</option>
                            <option>Invite Only</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                <div className="flex gap-3 pt-2">
                    <button className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                        Save Changes
                    </button>
                    <button className="px-5 py-2.5 bg-white/70 hover:bg-white/90 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all shadow-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClanSettings;
