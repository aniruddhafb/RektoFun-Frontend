"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { User, updateUser } from "@/app/lib/users-service/users";
import { getDiceBearAvatarUrl } from "@/app/lib/profile-avatar";
import { blockedContentError, hasBlockedContent } from "@/app/lib/content-moderation";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";

type SolanaMessageProvider = { signMessage: (message: Uint8Array) => Promise<Uint8Array> };

type EditProfileModalProps = {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSaved: (user: User) => void;
};

export function CreateProfileModal({ isOpen, user, onClose, onSaved }: EditProfileModalProps) {
  const { address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<SolanaMessageProvider>("solana");
  const [username, setUsername] = useState(() => user?.username || "");
  const [bio, setBio] = useState(() => user?.description || user?.bio || "");
  const [profileImage, setProfileImage] = useState(() => user?.profile_image || getDiceBearAvatarUrl());
  const [isAvatarLoading, setIsAvatarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinkingX, setIsLinkingX] = useState(false);
  const [isDisconnectingX, setIsDisconnectingX] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const saveProfile = async () => {
    const cleanUsername = username.trim();
    const cleanBio = bio.trim();

    if (!cleanUsername) return setError("Username is required.");
    if (hasBlockedContent(cleanUsername)) return setError(blockedContentError("Username"));
    if (hasBlockedContent(cleanBio)) return setError(blockedContentError("Bio"));

    try {
      setIsSaving(true);
      setError(null);
      const updated = await updateUser(user.id, {
        username: cleanUsername,
        description: cleanBio,
        profile_image: profileImage,
      });
      onSaved(updated);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const randomizeProfile = () => {
    setIsAvatarLoading(true);
    setProfileImage(getDiceBearAvatarUrl());
  };

  const useXProfileImage = () => {
    if (!user.twitter_profile_image) return;
    setIsAvatarLoading(true);
    setProfileImage(user.twitter_profile_image);
  };

  const linkXAccount = async () => {
    if (!address || !walletProvider) {
      setError("Connect your Solana wallet before linking X.");
      return;
    }

    try {
      setIsLinkingX(true);
      setError(null);
      const message = `Link X to RektoFun\nWallet: ${address}\nUser ID: ${user.id}\nTimestamp: ${Date.now()}`;
      const signature = await walletProvider.signMessage(new TextEncoder().encode(message));
      const signatureBase64 = btoa(String.fromCharCode(...signature));
      const response = await fetch("/api/auth/x/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, address, message, signature: signatureBase64 }),
      });
      const data = await response.json();
      if (!response.ok || !data.authorizationUrl) throw new Error(data.error || "Could not start X linking.");
      window.location.assign(data.authorizationUrl);
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Could not link X account.");
      setIsLinkingX(false);
    }
  };

  const disconnectXAccount = async () => {
    try {
      setIsDisconnectingX(true);
      setError(null);
      const updated = await updateUser(user.id, { twitter_username: null });
      onSaved(updated);
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Could not disconnect X account.");
    } finally {
      setIsDisconnectingX(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <button type="button" className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm" onClick={onClose} aria-label="Close edit profile" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border-2 border-black bg-[#fff8f4]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ead7cc] bg-[#fff8f4]/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 id="edit-profile-title" className="text-xl font-black text-gray-950">Edit Profile</h2>
            <p className="text-xs font-semibold text-[#7c6a60]">Update how others see you</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#d7c5ba] bg-white hover:border-black hover:bg-[#ffe8db]" aria-label="Close">
            <X className="h-4 w-4" strokeWidth={2.8} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4 rounded-lg border border-[#ead7cc] bg-white p-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-black">
              <Image
                src={profileImage}
                alt="Profile"
                fill
                sizes="80px"
                className="object-cover"
                onLoad={() => setIsAvatarLoading(false)}
                onError={() => setIsAvatarLoading(false)}
              />
              {isAvatarLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
                  <div
                    className="h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-black"
                    aria-label="Loading randomized avatar"
                  />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900">Profile image</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={randomizeProfile} className="cursor-pointer rounded-md border-2 border-black bg-[#f5d547] px-3 py-2 text-xs font-black">
                  Randomize avatar
                </button>
                {user.twitter_username && user.twitter_profile_image && (
                  <button type="button" onClick={useXProfileImage} className="cursor-pointer rounded-md border-2 border-black bg-black px-3 py-2 text-xs font-black text-white">
                    Use X profile
                  </button>
                )}
              </div>
            </div>
          </div>

          <label className="block text-sm font-bold text-gray-800">Username <span className="text-red-600" aria-hidden="true">*</span>
            <input required aria-required="true" maxLength={18} value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-md border border-[#d7c5ba] bg-white px-3 py-2.5 font-semibold focus:border-[#e85a2d] focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/15" />
            <span className="mt-1 block text-xs font-medium text-gray-500">Required</span>
          </label>
          <label className="block text-sm font-bold text-gray-800">Bio
            <textarea maxLength={100} rows={3} value={bio} onChange={(event) => setBio(event.target.value)} className="mt-2 w-full resize-none rounded-md border border-[#d7c5ba] bg-white px-3 py-2.5 font-semibold focus:border-[#e85a2d] focus:outline-none focus:ring-4 focus:ring-[#e85a2d]/15" placeholder="Tell people about yourself" />
          </label>
          <div className="rounded-lg border border-[#ead7cc] bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-black text-gray-900">X (Twitter)</p>
                <p className="mt-1 truncate text-xs font-medium text-gray-500">
                  {user.twitter_username ? `Connected as @${user.twitter_username}` : "Connect and verify your X account"}
                </p>
              </div>
              <button
                type="button"
                onClick={user.twitter_username ? disconnectXAccount : linkXAccount}
                disabled={isLinkingX || isDisconnectingX}
                className={`shrink-0 cursor-pointer rounded-md border-2 px-4 py-2 text-xs font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${user.twitter_username
                  ? "border-red-600 bg-white text-red-600 hover:bg-red-50"
                  : "border-black bg-black text-white"
                  }`}
              >
                {isDisconnectingX ? "Disconnecting…" : isLinkingX ? "Connecting…" : user.twitter_username ? "Disconnect X" : "Link X"}
              </button>
            </div>
          </div>

          {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
          <button type="button" onClick={saveProfile} disabled={isSaving || !username.trim()} className="w-full cursor-pointer rounded-md bg-gray-950 py-3 text-sm font-black text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSaving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
