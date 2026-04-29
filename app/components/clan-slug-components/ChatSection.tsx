"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { MessageCircle, Send } from "lucide-react";
import { ChatMessage, mockChatUsers, initialMessages, ClanData } from "./types";

const ChatSection = ({ clanData }: { clanData: ClanData }) => {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Current user mock
    const currentUser = { id: "0", name: "You", avatar: "/profiles/1.svg" };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const message: ChatMessage = {
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            message: newMessage.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, message]);
        setNewMessage("");

        // Simulate a response after a short delay
        setTimeout(() => {
            const randomUser = mockChatUsers[Math.floor(Math.random() * mockChatUsers.length)];
            const responses = [
                "That's interesting! 👀",
                "Lol nice one 😂",
                "Let's gooo! 🚀🚀🚀",
                "For real tho 💯",
                "Good point, I was thinking the same",
                "HODL! 💪",
                "This market is wild",
                "Who's ready for profits? 💰",
            ];
            const responseMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                userId: randomUser.id,
                userName: randomUser.name,
                userAvatar: randomUser.avatar,
                message: responses[Math.floor(Math.random() * responses.length)],
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, responseMessage]);
        }, 1500);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm overflow-hidden flex flex-col" style={{ height: "600px" }}>
            {/* Header */}
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">Clan Chat</span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400 ml-auto">{clanData.members} members</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f3e1d7]/30">
                {messages.map((msg) => {
                    const isOwnMessage = msg.userId === currentUser.id;
                    return (
                        <div
                            key={msg.id}
                            className={`flex gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <Image
                                    src={msg.userAvatar}
                                    alt={msg.userName}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className={`max-w-[75%] ${isOwnMessage ? "items-end" : ""}`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-xs font-medium ${isOwnMessage ? "text-gray-500" : "text-gray-700"}`}>
                                        {msg.userName}
                                    </span>
                                    <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
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
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 placeholder-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-10 h-10 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatSection;
