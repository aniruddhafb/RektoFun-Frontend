"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useAppKitAccount } from "@reown/appkit/react";
import { getUserByPubkey, createUser, type User } from "@/app/lib/users-service/users";
import { useUserStore } from "@/app/store/useUserStore";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

const PROFILE_COUNT = 31;

function getRandomProfileIndex() {
  return Math.floor(Math.random() * PROFILE_COUNT) + 1;
}

function getProfileImageUrl(index: number) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/profiles/${index}.svg`;
}

export function UserOnboarding() {
  const { address, isConnected } = useAppKitAccount();
  const { user, setUser } = useUserStore();

  const [checkedPubkey, setCheckedPubkey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profileIndex, setProfileIndex] = useState(getRandomProfileIndex);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBodyScrollLock(isOpen);

  const handleUserLoaded = useCallback(
    (loadedUser: User) => {
      setUser(loadedUser);
      setCheckedPubkey(loadedUser.pubkey || null);
      setIsOpen(false);
    },
    [setUser]
  );

  useEffect(() => {
    if (!isConnected || !address) return;
    if (checkedPubkey === address) return;
    if (user?.pubkey === address) return;

    let cancelled = false;

    async function checkUser() {
      if (!address) return;
      setIsLoading(true);
      try {
        const existingUser = await getUserByPubkey(address);
        if (!cancelled) {
          handleUserLoaded(existingUser);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "";
          const isNotFound =
            message.toLowerCase().includes("not found") ||
            message.includes("404");

          if (isNotFound) {
            setCheckedPubkey(address);
            setProfileIndex(getRandomProfileIndex());
            setIsOpen(true);
          } else {
            console.error("[UserOnboarding] Failed to look up user:", err);
            setCheckedPubkey(address);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    checkUser();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, checkedPubkey, user, handleUserLoaded]);

  const handleCreateUser = async () => {
    if (!address) return;

    setError(null);

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter an email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdUser = await createUser({
        username: username.trim(),
        email: email.trim(),
        pubkey: address,
        profile_image: getProfileImageUrl(profileIndex),
        bio: bio.trim(),
      });

      setUser(createdUser);
      setCheckedPubkey(createdUser.pubkey);
      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create account.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 px-3 py-5 backdrop-blur-[3px] sm:px-6">
      <div className="relative w-full max-w-[28rem] overflow-hidden rounded-[24px] border-2 border-black bg-[#eedcd2] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="px-5 pb-7 pt-6 sm:px-7 sm:pt-7">
          <h2 className="text-center text-2xl font-black text-black">Create your profile</h2>
          <p className="mt-2 text-center text-sm font-medium text-black/70">
            Welcome to RektoFun! Fill in a few details to get started.
          </p>

          <div className="mt-5 flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-black bg-white shadow-sm">
              <Image
                src={`/profiles/${profileIndex}.svg`}
                alt="Selected profile avatar"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => setProfileIndex(getRandomProfileIndex())}
              className="text-xs font-bold text-black/70 underline underline-offset-2 transition hover:text-black"
            >
              Randomize avatar
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="onboarding-username" className="block text-sm font-bold text-black">
                Username
              </label>
              <input
                id="onboarding-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="trader_007"
                className="mt-1 w-full rounded-xl border border-black/20 bg-white px-4 py-2.5 text-sm font-semibold text-black placeholder:text-black/40 focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="onboarding-email" className="block text-sm font-bold text-black">
                Email
              </label>
              <input
                id="onboarding-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-black/20 bg-white px-4 py-2.5 text-sm font-semibold text-black placeholder:text-black/40 focus:border-black focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="onboarding-bio" className="block text-sm font-bold text-black">
                Bio
              </label>
              <textarea
                id="onboarding-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about yourself..."
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-black/20 bg-white px-4 py-2.5 text-sm font-semibold text-black placeholder:text-black/40 focus:border-black focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCreateUser}
            disabled={isSubmitting || isLoading}
            className="rekto-button mt-6 min-h-11 w-full rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-[#eedcd2] transition hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
          >
            {isSubmitting ? "Creating profile..." : "Create profile"}
          </button>
        </div>
      </div>
    </div>
  );
}