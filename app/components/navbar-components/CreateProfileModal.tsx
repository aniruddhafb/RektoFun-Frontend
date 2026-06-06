"use client";

type CreateProfileModalProps = {
    isOpen: boolean;
    editProfileIndex: number;
    editUsername: string;
    editBio: string;
    editInviteCode: string;
    profileFormError: string | null;
    onRandomizeProfile: () => void;
    onRandomizeUsername: () => void;
    onEditUsernameChange: (value: string) => void;
    onEditBioChange: (value: string) => void;
    onEditInviteCodeChange: (value: string) => void;
    onSubmit: () => void;
};

export function CreateProfileModal({
    isOpen,
    editProfileIndex,
    editUsername,
    editBio,
    editInviteCode,
    profileFormError,
    onRandomizeProfile,
    onRandomizeUsername,
    onEditUsernameChange,
    onEditBioChange,
    onEditInviteCodeChange,
    onSubmit,
}: CreateProfileModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="rekto-modal-panel relative z-10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">
                                Create Profile*
                            </h2>
                            <p className="text-sm text-gray-600">
                                Get started by creating a profile
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Profile Character
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-black shadow-lg">
                                    <img
                                        src={`https://earningrecords.com/assets/rektofun/profiles/${editProfileIndex + 1}.svg`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    onClick={onRandomizeProfile}
                                    className="px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                                >
                                    Randomize
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Username*
                                </label>
                                <button
                                    type="button"
                                    onClick={onRandomizeUsername}
                                    className="px-3 py-1.5 bg-white/80 border border-gray-800 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white transition-colors"
                                >
                                    Randomize
                                </button>
                            </div>
                            <input
                                maxLength={18}
                                type="text"
                                value={editUsername}
                                onChange={(e) => onEditUsernameChange(e.target.value)}
                                className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent required"
                                placeholder="Enter username"
                            />
                            <p className="mt-1 text-xs text-gray-500">Create a unique username</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bio
                            </label>
                            <textarea
                                maxLength={100}
                                value={editBio}
                                onChange={(e) => onEditBioChange(e.target.value)}
                                className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent required"
                                placeholder="Write a short bio (optional)"
                            />
                        </div>
                        {profileFormError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                {profileFormError}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Invite Code (Optional)
                            </label>
                            <input
                                maxLength={10}
                                type="text"
                                value={editInviteCode}
                                onChange={(e) => onEditInviteCodeChange(e.target.value)}
                                className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                                placeholder="Enter invite code"
                            />
                        </div>
                        <button
                            onClick={onSubmit}
                            disabled={!editUsername.trim()}
                            className="rekto-button cursor-pointer w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
