"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { AppNotification, getNotifications, markNotificationRead } from "@/app/lib/notifications-service";

export function NotificationBell() {
  const { address } = useAppKitAccount();
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

  const openNotification = async (notification: AppNotification) => {
    setIsOpen(false);
    if (!address || notification.is_read) return;
    await markNotificationRead(address, notification.id);
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    setUnread((count) => Math.max(0, count - 1));
  };

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={toggleModal} className={`relative flex h-10 w-10 cursor-pointer items-center justify-center border-2 border-black shadow-[2px_2px_0_#111] transition-colors ${isOpen ? "bg-[#f5d547]" : "bg-white hover:bg-[#f5d547]"}`} aria-label={`${unread} unread notifications`} aria-expanded={isOpen}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {unread > 0 && <span className="absolute -right-2 -top-2 min-w-5 rounded-full border border-black bg-[#e85a2d] px-1 text-center text-[10px] font-black text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {isOpen && (
        <div className="fixed left-3 right-3 top-[72px] z-[100] overflow-hidden border-2 border-black bg-[#fffaf6] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[410px]">
          <div className="flex items-center justify-between border-b-2 border-black bg-white px-4 py-3">
            <div><h2 className="text-lg font-black text-black">Notifications</h2><p className="text-xs font-bold text-gray-600">Activity from people you follow</p></div>
            {unread > 0 && <button type="button" onClick={markAllRead} className="cursor-pointer text-xs font-black text-[#c74620] underline underline-offset-2">Mark all read</button>}
          </div>

          <div className="max-h-[min(520px,70vh)] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <p className="p-8 text-center text-sm font-bold text-gray-600">Loading notifications…</p>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-[#f5d547]">🔔</div><p className="font-black">Nothing here yet</p><p className="mt-1 text-sm font-medium text-gray-600">Follow users to see when they create or join challenges.</p></div>
            ) : notifications.map((notification) => (
              <Link key={notification.id} href="/challenges" onClick={() => openNotification(notification)} className={`flex gap-3 border-b border-black/15 px-4 py-4 transition-colors last:border-b-0 hover:bg-[#f5d547]/20 ${notification.is_read ? "bg-[#fffaf6]" : "bg-[#fff3b0]"}`}>
                <Image src={notification.actor_profile_image || "/scribbles/pepe.png"} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full border-2 border-black bg-white object-cover" />
                <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-black leading-5 text-black">{notification.message}</p><time className="shrink-0 text-[11px] font-bold text-gray-500">{new Date(notification.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></div><p className="mt-1 text-sm font-medium text-gray-600">{notification.event_type === "challenge_created" ? "A new challenge is ready to join." : "See the challenge they entered."}</p></div>
                {!notification.is_read && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-black bg-[#e85a2d]" />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
