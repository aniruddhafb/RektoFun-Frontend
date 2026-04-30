"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { ClanData } from "./types";
import { ClanMessage, getClanMessages, createClanMessage } from "@/app/lib/clan-service/clanMessages";
import { useWalletData } from "@/app/lib/useWalletData";
import { getUserByWallet } from "@/app/lib/users-service/users";

interface ChatSectionProps {
    clanData: ClanData;
}

const ChatSection = ({ clanData }: ChatSectionProps) => {
    const [messages, setMessages] = useState<ClanMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Wallet data hook - provides walletAddress
    const { walletAddress } = useWalletData();

    // Current user state - will be populated from backend
    const [currentUser, setCurrentUser] = useState<{
        id: string;
        username: string;
        avatar: string;
    } | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch current user data when wallet connects
    useEffect(() => {
        const fetchCurrentUser = async () => {
            if (walletAddress) {
                try {
                    const userData = await getUserByWallet(walletAddress);
                    setCurrentUser({
                        id: userData.id,
                        username: userData.username || "Anonymous",
                        avatar: userData.profile_image || "/profiles/1.svg",
                    });
                } catch (err) {
                    console.error("Failed to fetch user:", err);
                    setCurrentUser({
                        id: "",
                        username: "You",
                        avatar: "/profiles/1.svg",
                    });
                }
            }
        };
        fetchCurrentUser();
    }, [walletAddress]);

    // Fetch messages from backend
    const fetchMessages = useCallback(async () => {
        if (!clanData.slug) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getClanMessages(clanData.slug, 50, 0);
            // Messages come newest first, reverse for display
            setMessages([...data.messages].reverse());
        } catch (err) {
            console.error("Failed to fetch messages:", err);
            setError("Failed to load messages. Please try again.");
            // Fallback to empty array on error
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, [clanData.slug]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser?.id || !walletAddress || sending) return;

        setSending(true);
        try {
            const message = await createClanMessage(clanData.slug, {
                clan_id: "", // Backend will verify via slug
                sender_id: currentUser.id,
                message: newMessage.trim(),
            });

            setMessages((prev) => [...prev, message]);
            setNewMessage("");
        } catch (err) {
            console.error("Failed to send message:", err);
            setError("Failed to send message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: ClanMessage[] }[] = [];
    let currentDate = "";
    let currentGroup: ClanMessage[] = [];

    messages.forEach((msg) => {
        const msgDate = formatDate(msg.created_at);
        if (msgDate !== currentDate) {
            if (currentGroup.length > 0) {
                groupedMessages.push({ date: currentDate, messages: currentGroup });
            }
            currentDate = msgDate;
            currentGroup = [msg];
        } else {
            currentGroup.push(msg);
        }
    });
    if (currentGroup.length > 0) {
        groupedMessages.push({ date: currentDate, messages: currentGroup });
    }

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm overflow-hidden flex flex-col" style={{ height: "600px" }}>
            {/* Header */}
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Clan Chat</span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400 ml-auto">{clanData.members} members</span>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-b border-red-100">
                    {error}
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f3e1d7]/30">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Be the first to say hello!</p>
                    </div>
                ) : (
                    <>
                        {groupedMessages.map((group, groupIndex) => (
                            <div key={groupIndex}>
                                {/* Date Separator */}
                                <div className="flex items-center justify-center my-4">
                                    <div className="bg-white/80 px-3 py-1 rounded-full shadow-sm">
                                        <span className="text-xs text-gray-500 font-medium">{group.date}</span>
                                    </div>
                                </div>

                                {/* Messages for this date */}
                                {group.messages.map((msg) => {
                                    const isOwnMessage = msg.sender_id === currentUser?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                                <Image
                                                    src={msg.sender_avatar || "/profiles/1.svg"}
                                                    alt={msg.sender_username || "User"}
                                                    width={32}
                                                    height={32}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className={`max-w-[75%] ${isOwnMessage ? "items-end" : ""}`}>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-xs font-medium ${isOwnMessage ? "text-gray-500" : "text-gray-700"}`}>
                                                        {msg.sender_username || "Anonymous"}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                                                </div>
                                                <div
                                                    className={`px-3 py-2 rounded-2xl text-sm ${isOwnMessage
                                                        ? "bg-gray-900 text-white rounded-br-md"
                                                        : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                                                        }`}
                                                >
                                                    {msg.message}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Login Required Banner */}
            {!walletAddress && (
                <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 text-center">
                    <span className="text-sm text-amber-700">Connect your wallet to join the chat</span>
                </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={walletAddress ? "Type a message..." : "Connect wallet to chat"}
                        disabled={!walletAddress || sending}
                        className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !walletAddress || sending}
                        className="w-10 h-10 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                    >
                        {sending ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 text-white" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatSection;
