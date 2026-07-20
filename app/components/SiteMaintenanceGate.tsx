"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock3, Construction, Radio } from "lucide-react";
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
  siteSettingsFromRow,
  type SiteSettings,
  type SiteSettingsRow,
} from "@/app/lib/site-settings";
import { getSupabaseBrowserClient } from "@/app/lib/supabase-browser";

export function SiteMaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await getSiteSettings();
        if (active) setSettings(next);
      } catch {
        if (active) setSettings(DEFAULT_SITE_SETTINGS);
      }
    };
    void load();
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      ?.channel("site-settings-global")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_settings", filter: "id=eq.global" },
        (payload) => {
          if (active) setSettings(siteSettingsFromRow(payload.new as SiteSettingsRow));
        },
      )
      .subscribe();
    // Reconcile occasionally in case the device was asleep or Realtime reconnects.
    const timer = window.setInterval(load, 5 * 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, []);

  if (isAdminRoute) return children;
  if (!settings) {
    return <div className="min-h-screen bg-[#f3e1d7]" aria-label="Loading site status" />;
  }
  if (!settings.siteMaintenance) return children;

  return <MaintenancePage />;
}

function MaintenancePage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#f3e1d7] px-5 py-10 text-[#17120f]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#111_1px,transparent_1px),linear-gradient(90deg,#111_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rotate-12 border-[3px] border-black bg-[#f5d547] shadow-[12px_12px_0_#111]" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 -rotate-12 border-[3px] border-black bg-[#e85a2d] shadow-[-12px_-12px_0_#111]" />

      <section className="relative z-10 m-auto w-full max-w-2xl border-[3px] border-black bg-[#fffaf6] p-6 text-center shadow-[9px_9px_0_#111] sm:p-10">
        <div className="mx-auto mb-7 flex w-fit items-center gap-3 border-2 border-black bg-white px-4 py-2 shadow-[3px_3px_0_#111]">
          <Image src="/fav_old.png" alt="RektoFun" width={38} height={38} className="h-9 w-9" />
          <span className="text-xl font-black tracking-tight">RektoFun</span>
        </div>

        <div className="mx-auto mb-6 flex h-20 w-20 rotate-3 items-center justify-center border-[3px] border-black bg-[#f5d547] shadow-[5px_5px_0_#111]">
          <Construction className="h-10 w-10 -rotate-3" strokeWidth={2.5} />
        </div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[#e85a2d]">
          Scheduled pit stop
        </p>
        <h1 className="text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl">
          Under Maintenance
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base font-bold leading-relaxed text-black/60 sm:text-lg">
          RektoFun is temporarily under maintenance while we make things faster,
          safer, and sharper. Your challenges and funds remain safe.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 border-2 border-black bg-[#a8d85b] p-4 text-left">
            <Clock3 className="h-6 w-6 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Status</p>
              <p className="text-sm font-bold">Back as soon as the work is done</p>
            </div>
          </div>
          <a
            href="https://x.com/Rektofun"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border-2 border-black bg-white p-4 text-left transition-transform hover:-translate-y-0.5"
          >
            <Radio className="h-6 w-6 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Updates</p>
              <p className="text-sm font-bold">Follow @Rektofun on X</p>
            </div>
          </a>
        </div>
      </section>
    </main>
  );
}
