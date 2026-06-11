"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAppKitAccount } from "@reown/appkit/react";
import { getUserByWallet, updateUser } from "@/app/lib/users-service/users";
import { blockedContentError, hasBlockedContent } from "@/app/lib/content-moderation";
import { useUserStore } from "@/app/store/useUserStore";

const PROFILE_SVGS = Array.from({ length: 31 }, (_, i) => `/profiles/${i + 1}.svg`);

export default function SettingsPage() {
  const { address, isConnected } = useAppKitAccount();
  const { user, setUser } = useUserStore();

  // Profile state
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [editProfileIndex, setEditProfileIndex] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!address) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const userData = await getUserByWallet(address);
        setUsername(userData.username || "");
        setDescription(userData.description || "");
        if (userData.profile_image) {
          const profileMatch = userData.profile_image.match(/profiles\/(\d+)\.svg/);
          if (profileMatch) {
            setEditProfileIndex(parseInt(profileMatch[1]) - 1);
          }
        }
        setUser(userData);
      } catch (error) {
        console.error("[Settings] Could not fetch user data:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserData();
  }, [address, setUser]);

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Not connected";

  // Copy wallet address
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // Randomize profile
  const randomizeProfile = () => {
    const randomIndex = Math.floor(Math.random() * 31);
    setEditProfileIndex(randomIndex);
  };

  // Save profile changes
  const saveProfile = async () => {
    if (!address || !user) return;

    if (hasBlockedContent(username)) {
      setSaveError(blockedContentError("Username"));
      return;
    }
    if (hasBlockedContent(description)) {
      setSaveError(blockedContentError("Bio"));
      return;
    }

    setSaveError(null);
    setIsSavingProfile(true);

    try {
      const profileIndex = editProfileIndex + 1;
      const updatedUser = await updateUser(user.id, {
        username: username,
        description: description,
        profile_image: `https://earningrecords.com/assets/rektofun/profiles/${profileIndex}.svg`,
      });
      setUser(updatedUser);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error("[Settings] Failed to save profile:", error);
      setSaveError("Failed to save profile, username already exists!");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Show connect prompt if not connected
  if (!isConnected) {
    return (
      <div className="rekto-page min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="rekto-surface max-w-md w-full bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-300 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Required</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to access the settings page and manage your profile.
          </p>
          <appkit-button />
        </div>
      </div>
    );
  }

  return (
    <div className="rekto-page min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your profile and wallet</p>
        </div>

        {/* Profile Section */}
        <section className="rekto-card-hover bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-300/50 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            {/* Profile Photo */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white">
                  <img
                    src={PROFILE_SVGS[editProfileIndex]}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <button
                onClick={randomizeProfile}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Randomize
              </button>
            </div>

            {/* Profile Editor */}
            <div className="flex-1 space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  maxLength={18}
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (saveError) setSaveError(null);
                  }}
                  className={`w-full px-4 py-2 bg-white/80 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20 ${saveError ? "border-red-300" : "border-gray-300"}`}
                  placeholder="Enter username"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  maxLength={100}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (saveError) setSaveError(null);
                  }}
                  rows={2}
                  className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Save Button */}
              <button
                onClick={saveProfile}
                disabled={isSavingProfile || isLoadingProfile}
                className="w-full px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>

              {/* Messages */}
              {saveError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  <span>{saveError}</span>
                </div>
              )}
              {showSuccessMessage && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Changes saved successfully!
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Wallet Section */}
        <section className="rekto-card-hover bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-300/50 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Wallet</h2>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border-2 bg-orange-50/50 border-orange-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Connected Wallet</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">{displayAddress}</p>
                  {address && (
                    <button
                      onClick={copyAddress}
                      className="p-1 rounded-md hover:bg-orange-100 transition-colors"
                      title={copiedAddress ? "Copied!" : "Copy address"}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 10h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                  {copiedAddress && <span className="text-xs text-green-700 font-medium">Copied!</span>}
                </div>
              </div>
            </div>
            <appkit-button />
          </div>
        </section>
      </div>
    </div>
  );
}