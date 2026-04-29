"use client";

import { useState } from "react";
import * as ClanComponents from "@/app/components/clan-slug-components";
import type { Tab } from "@/app/components/clan-slug-components";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClanDetailPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const [activeTab, setActiveTab] = useState<Tab>("Overview");

    const tabs: Tab[] = ["Overview", "Chat", "Settings"];

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* ── Clan Header ── */}
                <ClanComponents.ClanHeader clanData={ClanComponents.clanData} />

                {/* ── Tabs ── */}
                <ClanComponents.ClanTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabs={tabs}
                />

                {/* ── Overview Tab ── */}
                {activeTab === "Overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        {/* Left: Clan Challenges */}
                        <div className="lg:col-span-2">
                            <ClanComponents.ClanChallenges challenges={ClanComponents.challengesData} />
                        </div>

                        {/* Right: Members */}
                        <div className="lg:col-span-1">
                            <ClanComponents.ClanMembers
                                members={ClanComponents.membersData}
                                currentMembers={ClanComponents.clanData.members}
                                maxMembers={ClanComponents.clanData.maxMembers}
                            />
                        </div>
                    </div>
                )}

                {/* ── Chat Tab ── */}
                {activeTab === "Chat" && <ClanComponents.ChatSection clanData={ClanComponents.clanData} />}

                {/* ── Settings Tab ── */}
                {activeTab === "Settings" && (
                    <ClanComponents.ClanSettings clanData={ClanComponents.clanData} />
                )}

            </div>
        </div>
    );
}
