"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { AppNotification, getNotifications, markNotificationRead } from "@/app/lib/notifications-service";

export function NotificationBell() {
  const { address } = useAppKitAccount();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    if (!address) return;
    const data = await getNotifications(address, 50);
    setNotifications(data.notifications);
    setUnread(data.unread_count);
  };

  useEffect(() => {
    if (!address) return;
    let active = true;
    const refresh = () => getNotifications(address, 50)
      .then((data) => {
        if (active) {
          setNotifications(data.notifications);
          setUnread(data.unread_count);
        }
      })
      .catch(() => undefined);
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [address]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [isOpen]);

  const toggleModal = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && address) {
      setIsLoading(true);
      try { await refresh(); } catch { /* The polling request will retry. */ }
      finally { setIsLoading(false); }
    }
  };

  const markAllRead = async () => {
    if (!address) return;
    await markNotificationRead(address);
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    setUnread(0);
  };

  const markOneRead = (notification: AppNotification) => {
    if (!address || notification.is_read) return;
    void markNotificationRead(address, notification.id).catch(() => undefined);
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    setUnread((count) => Math.max(0, count - 1));
  };

  const openNotification = (notification: AppNotification) => {
    setIsOpen(false);
    markOneRead(notification);
    router.push(`/challenges?challengeId=${encodeURIComponent(notification.challenge_id)}`);
  };

  const openActorProfile = (event: React.MouseEvent, notification: AppNotification) => {
    event.stopPropagation();
    if (!notification.actor_wallet_address) return;
    setIsOpen(false);
    markOneRead(notification);
    router.push(`/profile/${encodeURIComponent(notification.actor_wallet_address)}`);
  };

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={toggleModal} className={`relative flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-black shadow-[2px_2px_0_#111] transition-colors ${isOpen ? "bg-[#f5d547]" : "bg-white hover:bg-[#f5d547]"}`} aria-label={`${unread} unread notifications`} aria-expanded={isOpen}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {unread > 0 && <span className="absolute -right-2 -top-2 min-w-5 rounded-full border border-black bg-[#e85a2d] px-1 text-center text-[10px] font-black text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {isOpen && (
        <div className="fixed left-3 right-3 top-[72px] z-[100] overflow-hidden rounded-2xl border border-black/15 bg-white shadow-[0_20px_60px_rgba(40,25,15,0.22)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-black/10 bg-[#fffaf6] px-5 py-4">
            <div><div className="flex items-center gap-2"><h2 className="text-lg font-black tracking-tight text-black">Notifications</h2>{unread > 0 && <span className="rounded-full bg-[#e85a2d] px-2 py-0.5 text-[10px] font-black text-white">{unread}</span>}</div><p className="mt-0.5 text-xs font-semibold text-gray-500">Updates from people you follow</p></div>
            {unread > 0 && <button type="button" onClick={markAllRead} className="cursor-pointer rounded-lg px-2.5 py-2 text-xs font-black text-[#c74620] transition hover:bg-[#e85a2d]/10">Mark all read</button>}
          </div>

          <div className="max-h-[min(520px,70vh)] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <p className="p-8 text-center text-sm font-bold text-gray-600">Loading notifications…</p>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#f5d547]">🔔</div><p className="font-black">Nothing here yet</p><p className="mt-1 text-sm font-medium text-gray-600">Follow users to see when they create or join challenges.</p></div>
            ) : notifications.map((notification) => (
              <div key={notification.id} role="button" tabIndex={0} onClick={() => openNotification(notification)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openNotification(notification); }} className={`group relative flex cursor-pointer gap-3 border-b border-black/10 px-4 py-4 outline-none transition last:border-b-0 hover:bg-[#fff7dc] focus-visible:bg-[#fff7dc] ${notification.is_read ? "bg-white" : "bg-[#fffaf0]"}`}>
                {!notification.is_read && <span className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-[#e85a2d]" />}
                <button type="button" onClick={(event) => openActorProfile(event, notification)} disabled={!notification.actor_wallet_address} className="relative h-12 w-12 shrink-0 cursor-pointer rounded-full outline-none ring-[#e85a2d] transition hover:scale-105 focus-visible:ring-2 disabled:cursor-default" aria-label={`Open ${notification.actor_username || "user"}'s profile`}>
                  <Image src={notification.actor_profile_image || "/scribbles/pepe.png"} alt="" width={48} height={48} className="h-12 w-12 rounded-full border-2 border-black/80 bg-white object-cover" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-[#f5d547] text-[10px]">{notification.event_type === "challenge_created" ? "+" : "↗"}</span>
                </button>
                <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><p className="text-sm font-extrabold leading-5 text-gray-950">{notification.message}</p><time className="shrink-0 pt-0.5 text-[11px] font-bold text-gray-400">{new Date(notification.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></div><p className="mt-1 text-xs font-semibold leading-5 text-gray-500">{notification.event_type === "challenge_created" ? "A new challenge is ready to join." : "View the challenge they joined."}</p><span className="mt-2 inline-flex text-[11px] font-black text-[#c74620] opacity-0 transition-opacity group-hover:opacity-100">View challenge →</span></div>
                {!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#e85a2d]" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
