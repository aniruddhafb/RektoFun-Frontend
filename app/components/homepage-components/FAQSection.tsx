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
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8 xl:px-12">
            <div className="pointer-events-none absolute left-0 top-12 h-64 w-64 rounded-full bg-[#e85a2d]/15 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-80 rounded-full bg-[#a8d85b]/20 blur-3xl" />

            <div className="relative z-10 max-w-3xl mx-auto">
                <div className="mb-12 text-center">
                    {/* <div className="mx-auto mb-5 inline-flex items-center gap-2 border border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[3px_3px_0_#111]">
                        <span className="h-2 w-2 bg-[#5ba8d8]" />
                        Need Intel?
                    </div> */}
                    <h2 className="text-4xl sm:text-5xl font-black text-black leading-tight">
                        <span className="text-[#e85a2d] drop-shadow-[1px_1px_0_#111]">FAQs</span>
                    </h2>
                    <p className="text-gray-700 mt-4 text-base font-medium sm:text-lg">
                        Everything you need to know about getting started with RektoFun.
                    </p>
                </div>

                <div className="space-y-5">
                    {faqData.map((faq, index) => (
                        <div
                            key={index}
                            className="group overflow-hidden border-2 border-black bg-white shadow-none transition-all duration-200 hover:-translate-y-1 hover:bg-[#fffaf6] hover:shadow-[3px_3px_0_#111]"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-5 py-5 flex items-center justify-between gap-4 text-left transition-colors sm:px-6"
                            >
                                <span className="text-base font-black text-black sm:text-lg">{faq.question}</span>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-[#f5d547] transition group-hover:bg-[#a8d85b]">
                                    <ChevronDown
                                        className={`w-5 h-5 text-black transition-transform duration-300 ${openIndex === index ? "rotate-180" : ""
                                            }`}
                                    />
                                </span>
                            </button>
                            <div
                                className={`px-5 overflow-hidden transition-all duration-300 ease-in-out sm:px-6 ${openIndex === index ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <p className="border-t-2 border-black pt-4 text-sm font-medium leading-relaxed text-gray-700 sm:text-base">
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
