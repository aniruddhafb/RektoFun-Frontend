"use client";

import Image from "next/image";

type NavbarProfileModalProps = {
    defaultUsername: string;
    editInviteCode: string;
    editProfileIndex: number;
    editUsername: string;
    isOpen: boolean;
    onClose: () => void;
    onEditInviteCodeChange: (value: string) => void;
    onEditUsernameChange: (value: string) => void;
    onRandomizeProfile: () => void;
    onSave: () => void;
    profileSvgs: string[];
};

export function NavbarProfileModal({
    defaultUsername,
    editInviteCode,
    editProfileIndex,
    editUsername,
    isOpen,
    onClose,
    onEditInviteCodeChange,
    onEditUsernameChange,
    onRandomizeProfile,
    onSave,
    profileSvgs,
}: NavbarProfileModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-[#f3e1d7] rounded-2xl shadow-2xl border border-gray-300 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-300">
                    <h2 className="text-lg font-semibold text-gray-900">Edit Profile</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <svg
                            className="w-5 h-5 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                            <Image
                                src={profileSvgs[editProfileIndex]}
                                alt="Profile"
                                fill
                                sizes="128px"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={onRandomizeProfile}
                            className="mt-3 flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            Randomize
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            value={editUsername}
                            onChange={(event) => onEditUsernameChange(event.target.value)}
                            placeholder={defaultUsername}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Invite Code (Optional)
                        </label>
                        <input
                            type="text"
                            value={editInviteCode}
                            onChange={(event) => onEditInviteCodeChange(event.target.value)}
                            placeholder="Enter invite code"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
                        />
                        <p className="text-xs text-gray-500">
                            Enter an invite code to get bonus rewards
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 p-4 border-t border-gray-300 bg-white/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
