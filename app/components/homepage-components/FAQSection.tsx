"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqData = [
    {
        question: "What is RektoFun?",
        answer: "RektoFun is the PvP battleground for predictions where users can create, join, and compete in challenges to prove their skills and win rewards.",
    },
    {
        question: "How do challenges work?",
        answer: "Challenges are set up with specific conditions and timeframes. Users can enter these challenges, and the winners are determined based on the outcome of the event.",
    },
    {
        question: "Who can create a challenge on RektoFun?",
        answer: "Any user can create a challenge, provided they set the necessary parameters and provide the required collateral for the reward pool.",
    },
    {
        question: "How are challenges resolved?",
        answer: "Challenges are resolved through a combination of automated data feeds (price oracles for crypto) and community validation. For sports events, Rekto Masters NFT holders help validate the outcome to ensure fairness.",
    },
    {
        question: "How can I deposit and withdraw funds?",
        answer: "You can deposit funds directly from your Solana wallet into the platform. We are using Privy Wallet Infrastructure for secure and seamless transactions. Withdrawals can be made at any time.",
    },
    {
        question: "When will the platform go live?",
        answer: "The platform is currently live on solana devnet for users to try and test and will be launched soon. Please check back for updates.",
    },
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 py-16 sm:py-20">
            <div className="max-w-3xl mx-auto">
                <div className="mb-12 text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold text-black leading-tight">
                        <span className="text-[#e85a2d]">FAQs</span>
                    </h2>
                    <p className="text-gray-500 mt-4 text-base sm:text-lg">
                        Everything you need to know about getting started with RektoFun.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqData.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/50 transition-colors"
                            >
                                <span className="text-lg font-semibold text-black">{faq.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            <div
                                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <p className="text-gray-600 leading-relaxed">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
