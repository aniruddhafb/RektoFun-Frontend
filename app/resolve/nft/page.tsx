"use client";

import { useState } from "react";
import Image from "next/image";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const ShieldIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

const MinusIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
);

const TrophyIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0012 0V2z" />
    </svg>
);

const StarIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const NetworkIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="5" r="3" />
        <circle cx="5" cy="19" r="3" />
        <circle cx="19" cy="19" r="3" />
        <line x1="12" y1="8" x2="5.5" y2="16.5" />
        <line x1="12" y1="8" x2="18.5" y2="16.5" />
    </svg>
);

const CollectionIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

const SupplyIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    </svg>
);

const MintedIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const PriceIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
    </svg>
);

const WalletIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
        <path d="M16 3.13a4 4 0 010 7.75" />
        <circle cx="16" cy="13" r="1" fill="currentColor" />
    </svg>
);

const SolanaIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.5 17.5l2.5-2.5h13l-2.5 2.5H4.5zM4.5 9.5l2.5-2.5h13l-2.5 2.5H4.5zM7 13.5l2.5-2.5h13L20 13.5H7z" />
    </svg>
);

// ─── Benefit Card ─────────────────────────────────────────────────────────────
interface BenefitItem {
    number: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    checks?: string[];
    showIcon?: boolean;
}

const BenefitCard = ({ benefit }: { benefit: BenefitItem }) => (
    <div className="flex gap-4">
        {/* Icon Box */}
        {benefit.showIcon !== false && (
            <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: benefit.iconBg }}
            >
                <div style={{ color: benefit.iconColor }} className="w-8 h-8 sm:w-10 sm:h-10">
                    {benefit.icon}
                </div>
            </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: benefit.iconColor }}
                >
                    {benefit.number}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">{benefit.title}</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-2">{benefit.description}</p>
            {benefit.checks && (
                <ul className="space-y-1">
                    {benefit.checks.map((check, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                            <CheckIcon className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-600">{check}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </div>
);

// ─── NFT Detail Row ───────────────────────────────────────────────────────────
const DetailRow = ({
    icon,
    label,
    value,
    valueNode,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    valueNode?: React.ReactNode;
}) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
        <div className="flex items-center gap-2 text-gray-500">
            <span className="w-4 h-4 flex-shrink-0">{icon}</span>
            <span className="text-sm">{label}</span>
        </div>
        {valueNode ?? <span className="text-sm font-semibold text-gray-900">{value}</span>}
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NFTPage() {
    const [quantity, setQuantity] = useState(1);
    const mintPrice = 0.1;
    const totalPrice = (mintPrice * quantity).toFixed(2);

    const benefits: BenefitItem[] = [
        {
            number: "01",
            title: "Challenge Validation Rewards",
            description: "NFT holders can validate outcomes of real-world event challenges.",
            icon: <TrophyIcon className="w-full h-full" />,
            iconBg: "#fef3e2",
            iconColor: "#f97316",
            showIcon: false,
            checks: [
                "Applicable primarily to real-world event markets",
                "A fixed monthly reward pool for validators",
                "The more you validate, the more you win",
                "Only Rekto Master NFT holders can participate",
            ],
        },
        {
            number: "02",
            title: "Weekly REKTO points Allocation",
            description:
                "Holders will receive weekly distributions of REKTO points, giving them a consistent edge in the ecosystem.",
            icon: <StarIcon className="w-full h-full" />,
            iconBg: "#ede9fe",
            iconColor: "#7c3aed",
            showIcon: false,
        },
        {
            number: "03",
            title: "Exclusive Community Perks",
            description: "",
            icon: <UsersIcon className="w-full h-full" />,
            iconBg: "#d1fae5",
            iconColor: "#059669",
            showIcon: false,
            checks: [
                "Special role on Discord",
                "Priority access to new features and updates",
                "Early participation in upcoming releases",
            ],
        },
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* ── Two-column layout ── */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

                    {/* ── LEFT COLUMN ── */}
                    <div className="flex-1 min-w-0">

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                                style={{ background: "linear-gradient(135deg, #a78bfa, #7c3aed)" }}>
                                <ShieldIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mint Rekto Master NFT</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Mint your NFT on Solana Devnet and unlock exclusive ecosystem benefits.
                                </p>
                            </div>
                        </div>

                        {/* NFT Card */}
                        <div className="bg-white/65 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-4 sm:p-6">

                            {/* NFT Content: image + details */}
                            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">

                                {/* NFT Image */}
                                <div className="w-full sm:w-56 md:w-64 flex-shrink-0">
                                    <div className="rounded-2xl overflow-hidden bg-gray-900 aspect-square sm:aspect-auto sm:h-80">
                                        <img
                                            src="https://i.imgur.com/rektomaster.png"
                                            alt="Rekto Master NFT"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback: show a styled placeholder
                                                const target = e.currentTarget;
                                                target.style.display = "none";
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `
                                                        <div style="width:100%;height:100%;background:linear-gradient(135deg,#1a0533,#2d1060,#1a0533);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;">
                                                            <div style="width:80px;height:80px;background:linear-gradient(135deg,#7c3aed,#a78bfa);border-radius:50%;display:flex;align-items:center;justify-content:center;">
                                                                <svg viewBox='0 0 24 24' fill='white' width='40' height='40'><path d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'/></svg>
                                                            </div>
                                                            <div style="text-align:center;">
                                                                <div style="color:white;font-size:22px;font-weight:900;letter-spacing:2px;">REKTO</div>
                                                                <div style="color:#a78bfa;font-size:22px;font-weight:900;letter-spacing:2px;">MASTER</div>
                                                            </div>
                                                        </div>
                                                    `;
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* NFT Details */}
                                <div className="flex-1 min-w-0">
                                    {/* Title + badge */}
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rekto Master</h2>
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 border border-purple-200"
                                            style={{ backgroundColor: "#ede9fe" }}>
                                            DEVNET
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                        The ultimate badge of trust and power in the Rekto ecosystem. Mint on Solana Devnet to join the movement.
                                    </p>

                                    {/* Detail rows */}
                                    <div className="divide-y divide-gray-100">
                                        <DetailRow
                                            icon={<NetworkIcon className="w-4 h-4" />}
                                            label="Network"
                                            valueNode={
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 rounded-full flex items-center justify-center"
                                                        style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}>
                                                        <SolanaIcon className="w-3 h-3 text-white" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900">Solana Devnet</span>
                                                </div>
                                            }
                                        />
                                        <DetailRow
                                            icon={<CollectionIcon className="w-4 h-4" />}
                                            label="Collection"
                                            value="Rekto Master"
                                        />
                                        <DetailRow
                                            icon={<SupplyIcon className="w-4 h-4" />}
                                            label="Supply"
                                            value="10,000"
                                        />
                                        <DetailRow
                                            icon={<MintedIcon className="w-4 h-4" />}
                                            label="Minted"
                                            value="1,245 (12.45%)"
                                        />
                                        <DetailRow
                                            icon={<PriceIcon className="w-4 h-4" />}
                                            label="Mint Price"
                                            value="0.10 SOL"
                                        />
                                        <DetailRow
                                            icon={<WalletIcon className="w-4 h-4" />}
                                            label="Your Balance"
                                            valueNode={
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-gray-900">1.25 SOL</span>
                                                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                                        <RefreshIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            }
                                        />
                                    </div>

                                    {/* Devnet warning */}
                                    <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-xl border border-orange-200"
                                        style={{ backgroundColor: "#fff7ed" }}>
                                        <AlertCircleIcon className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-orange-600">
                                            This NFT is minted on Solana Devnet. It does not hold real value.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quantity + Total + Mint */}
                            <div className="mt-6 pt-5 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                    {/* Quantity */}
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-sm text-gray-500 font-medium">Quantity</span>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                                className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-all shadow-sm"
                                            >
                                                <MinusIcon className="w-4 h-4 text-gray-700" />
                                            </button>
                                            <span className="text-xl font-bold text-gray-900 w-8 text-center">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                                                className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition-all shadow-sm"
                                            >
                                                <PlusIcon className="w-4 h-4 text-gray-700" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Total Price */}
                                    <div className="flex flex-col items-center sm:items-end gap-1">
                                        <span className="text-sm text-gray-500 font-medium">Total Price</span>
                                        <span className="text-3xl font-bold text-gray-900">{totalPrice} SOL</span>
                                    </div>
                                </div>

                                {/* Mint Button */}
                                <button className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-base sm:text-lg transition-all hover:opacity-90 active:scale-[0.99] shadow-md"
                                    style={{ backgroundColor: "#111827" }}>
                                    Mint Now
                                    <SparklesIcon className="w-5 h-5 text-yellow-300" />
                                </button>

                                <p className="text-center text-xs text-gray-400 mt-3">
                                    You will be prompted to confirm the transaction in your wallet
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ background: "linear-gradient(135deg, #9945FF, #14F195)" }}>
                                        <SolanaIcon className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-xs text-gray-500">Powered by Solana Devnet</span>
                                </div>
                                <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                                    View on Explorer
                                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                        <div className="bg-white/65 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5 sm:p-6">

                            {/* Section header */}
                            <div className="mb-6">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Why Mint Rekto Master NFT?</h2>
                                <p className="text-sm text-gray-500 mt-1">Exclusive benefits for NFT holders.</p>
                            </div>

                            {/* Benefits */}
                            <div className="space-y-6">
                                {benefits.map((benefit, i) => (
                                    <div key={i}>
                                        <BenefitCard benefit={benefit} />
                                        {i < benefits.length - 1 && (
                                            <div className="mt-6 border-b border-gray-100" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Bottom tagline */}
                            <div className="mt-6 pt-5 border-t border-gray-100 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                                    <ShieldIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Secure. Transparent. Community Driven.</p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                        Rekto Master NFTs empower the community and strengthen the ecosystem.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
