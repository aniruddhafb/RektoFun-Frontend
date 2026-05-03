"use client";

import { MessageCircle } from "lucide-react";
import { SettingsIcon } from "./icons";

export type Tab = "Overview" | "Chat" | "Settings";

interface ClanTabsProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    tabs: Tab[];
}

interface ClanTabsPropsExtended extends ClanTabsProps {
    isMember: boolean;
}

const ClanTabs = ({ activeTab, onTabChange, tabs, isMember }: ClanTabsPropsExtended) => {
    return (
        <div className="flex items-center gap-1 mb-5 border-b border-gray-200/60 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${tab === "Chat" ? "relative" : ""
                        } ${activeTab === tab
                            ? "text-orange-500 border-orange-500"
                            : "text-gray-500 border-transparent hover:text-gray-800"
                        }`}
                >
                    {tab === "Settings" && <SettingsIcon className="w-3.5 h-3.5" />}
                    {tab === "Chat" && (
                        isMember ? <MessageCircle className="w-3.5 h-3.5" /> : <span className="text-gray-400">🔒</span>
                    )}
                    {tab}
                    {tab === "Chat" && isMember && (
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                </button>
            ))}
        </div>
    );
};

export default ClanTabs;
