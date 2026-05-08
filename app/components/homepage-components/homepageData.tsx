import type { ReactNode } from "react";

export interface ScribbleItem {
    src: string;
    alt: string;
    wrapperClassName: string;
    innerClassName: string;
}

export interface EarningCardItem {
    number: string;
    title: string;
    description: string;
    readMoreHref?: string;
    illustration: ReactNode;
    bullets: Array<{
        icon: string;
        text: string;
    }>;
}

export const heroScribbles: ScribbleItem[] = [
    {
        src: "/scribbles/stars.png",
        alt: "Stars",
        wrapperClassName:
            "hidden md:block absolute left-[2%] top-[3%] w-32 h-32 md:w-48 md:h-48 animate-airdrop delay-100",
        innerClassName: "w-full h-full scribble-stars",
    },
    {
        src: "/scribbles/btc.png",
        alt: "Bitcoin",
        wrapperClassName:
            "absolute right-[3%] top-[2%] w-28 h-28 md:w-44 md:h-44 animate-airdrop delay-200",
        innerClassName: "w-full h-full scribble-btc",
    },
    {
        src: "/scribbles/dollars.png",
        alt: "Dollars",
        wrapperClassName:
            "hidden md:block absolute left-[1%] top-[22%] w-36 h-36 md:w-52 md:h-52 animate-airdrop delay-300",
        innerClassName: "w-full h-full scribble-dollars",
    },
    {
        src: "/scribbles/sol.png",
        alt: "Solana",
        wrapperClassName:
            "hidden md:block absolute right-[2%] top-[25%] w-32 h-32 md:w-48 md:h-48 animate-airdrop delay-400",
        innerClassName: "w-full h-full scribble-sol",
    },
    {
        src: "/scribbles/coins.png",
        alt: "Coins",
        wrapperClassName:
            "hidden md:block absolute left-[3%] top-[48%] w-40 h-40 md:w-56 md:h-56 animate-airdrop delay-500",
        innerClassName: "w-full h-full scribble-coins",
    },
    {
        src: "/scribbles/bags.png",
        alt: "Money Bags",
        wrapperClassName:
            "hidden md:block absolute right-[2%] top-[50%] w-36 h-36 md:w-52 md:h-52 animate-airdrop delay-600",
        innerClassName: "w-full h-full scribble-bags",
    },
    {
        src: "/scribbles/doge.png",
        alt: "Doge",
        wrapperClassName:
            "absolute left-[6%] bottom-[8%] w-32 h-32 md:w-48 md:h-48 animate-airdrop delay-700",
        innerClassName: "w-full h-full scribble-doge",
    },
    {
        src: "/scribbles/pepe.png",
        alt: "Pepe",
        wrapperClassName:
            "absolute right-[16%] bottom-[6%] w-32 h-32 md:w-48 md:h-48 animate-airdrop delay-800",
        innerClassName: "w-full h-full scribble-pepe",
    },
    {
        src: "/scribbles/pengu.png",
        alt: "Pengu",
        wrapperClassName:
            "hidden md:block absolute left-[12%] top-[35%] w-28 h-28 md:w-40 md:h-40 animate-pop-in delay-300",
        innerClassName: "w-full h-full scribble-pengu",
    },
    {
        src: "/scribbles/shiba.png",
        alt: "Shiba",
        wrapperClassName:
            "hidden md:block absolute right-[12%] top-[38%] w-28 h-28 md:w-40 md:h-40 animate-pop-in delay-500",
        innerClassName: "w-full h-full scribble-shiba",
    },
    {
        src: "/scribbles/trump.png",
        alt: "Trump",
        wrapperClassName:
            "absolute left-[28%] top-[5%] w-24 h-24 md:w-36 md:h-36 animate-airdrop delay-900",
        innerClassName: "w-full h-full scribble-trump",
    },
    {
        src: "/scribbles/phantom (1).png",
        alt: "Phantom",
        wrapperClassName:
            "hidden md:block absolute left-[40%] top-[12%] w-24 h-24 md:w-32 md:h-32 animate-pop-in delay-700",
        innerClassName: "w-full h-full scribble-phantom",
    },
];

export const earningCards: EarningCardItem[] = [
    {
        number: "01",
        title: "Creating Challenges",
        description:
            "Set up your own prediction challenges across crypto, stocks, or real-world events.",
        readMoreHref:
            "https://rektofun.gitbook.io/rektofun/introduction/earning-opportunities#id-1.-creating-challenges",
        illustration: (
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <rect x="18" y="20" width="58" height="68" rx="6" fill="#f5d5c0" stroke="#d4956a" strokeWidth="2" />
                <rect x="35" y="14" width="30" height="14" rx="4" fill="#e8b090" stroke="#d4956a" strokeWidth="2" />
                <rect x="28" y="42" width="38" height="4" rx="2" fill="#d4956a" opacity="0.5" />
                <rect x="28" y="52" width="30" height="4" rx="2" fill="#d4956a" opacity="0.5" />
                <rect x="28" y="62" width="34" height="4" rx="2" fill="#d4956a" opacity="0.5" />
                <rect x="28" y="72" width="8" height="10" rx="1" fill="#e85a2d" opacity="0.7" />
                <rect x="40" y="66" width="8" height="16" rx="1" fill="#e85a2d" opacity="0.8" />
                <rect x="52" y="60" width="8" height="22" rx="1" fill="#e85a2d" />
                <circle cx="76" cy="72" r="12" fill="#e85a2d" />
                <path d="M76 66V78M70 72H82" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        ),
        bullets: [
            {
                icon: "\u{1F3C6}",
                text: "Benefit from participation dynamics and higher activity",
            },
            {
                icon: "\u{1F465}",
                text: "Attract more users with quality challenges",
            },
            {
                icon: "\u{1F4C8}",
                text: "Early creators in trending markets win more",
            },
        ],
    },
    {
        number: "02",
        title: "Accepting Challenges",
        description:
            "Join existing challenges and compete in real-time PvP prediction battles.",
        illustration: (
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <line x1="20" y1="20" x2="80" y2="80" stroke="#c0b090" strokeWidth="6" strokeLinecap="round" />
                <rect x="14" y="14" width="14" height="6" rx="2" fill="#a09070" transform="rotate(-45 21 17)" />
                <rect x="16" y="72" width="20" height="10" rx="3" fill="#c8a870" />
                <line x1="80" y1="20" x2="20" y2="80" stroke="#c0b090" strokeWidth="6" strokeLinecap="round" />
                <rect x="72" y="14" width="14" height="6" rx="2" fill="#a09070" transform="rotate(45 79 17)" />
                <rect x="64" y="72" width="20" height="10" rx="3" fill="#c8a870" />
                <rect x="30" y="28" width="18" height="5" rx="2" fill="#a09070" transform="rotate(-45 39 30)" />
                <rect x="52" y="28" width="18" height="5" rx="2" fill="#a09070" transform="rotate(45 61 30)" />
            </svg>
        ),
        bullets: [
            { icon: "\u{1F3AF}", text: "Win challenges with accurate predictions" },
            { icon: "\u{1F4B0}", text: "Win rewards based on your performance" },
            { icon: "\u2B50", text: "Participate and win REKTO points" },
        ],
    },
    {
        number: "03",
        title: "Ranking on the Leaderboard",
        description:
            "Climb the leaderboard and showcase your trading skills and consistency.",
        illustration: (
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <path d="M38 10 H62 V38 C62 52 50 58 50 58 C50 58 38 52 38 38 Z" fill="#f5c842" stroke="#d4a820" strokeWidth="1.5" />
                <path d="M38 18 C28 18 24 28 30 34 C33 37 38 36 38 36" stroke="#d4a820" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M62 18 C72 18 76 28 70 34 C67 37 62 36 62 36" stroke="#d4a820" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <rect x="46" y="58" width="8" height="10" fill="#d4a820" />
                <rect x="40" y="68" width="20" height="5" rx="2" fill="#d4a820" />
                <circle cx="30" cy="20" r="2" fill="#f5c842" />
                <circle cx="70" cy="18" r="1.5" fill="#f5c842" />
                <circle cx="25" cy="35" r="1.5" fill="#f5c842" />
                <circle cx="75" cy="32" r="2" fill="#f5c842" />
                <rect x="10" y="82" width="22" height="14" rx="2" fill="#c0b090" />
                <text x="21" y="93" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">2</text>
                <rect x="39" y="76" width="22" height="20" rx="2" fill="#e85a2d" />
                <text x="50" y="90" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">1</text>
                <rect x="68" y="85" width="22" height="11" rx="2" fill="#c0b090" />
                <text x="79" y="94" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">3</text>
            </svg>
        ),
        bullets: [
            { icon: "\u{1F4CA}", text: "Top rankings get rewards from prize pools" },
            {
                icon: "\u{1F947}",
                text: "Higher ranks mean more visibility and reputation",
            },
            { icon: "\u{1F451}", text: "Consistency leads to recurring winnings" },
        ],
    },
    {
        number: "04",
        title: "Referring People",
        description: "Invite friends and grow the community while you win.",
        illustration: (
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <circle cx="30" cy="38" r="12" fill="#d4c4b0" />
                <path d="M12 80 C12 62 48 62 48 80" fill="#d4c4b0" />
                <circle cx="58" cy="34" r="12" fill="#c8b8a4" />
                <path d="M40 76 C40 58 76 58 76 76" fill="#c8b8a4" />
                <circle cx="50" cy="42" r="14" fill="#bfaf9c" />
                <path d="M28 88 C28 68 72 68 72 88" fill="#bfaf9c" />
                <circle cx="78" cy="72" r="13" fill="#e85a2d" />
                <path d="M78 65V79M71 72H85" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        ),
        bullets: [
            {
                icon: "\u{1F381}",
                text: "Win REKTO points for every successful referral",
            },
            { icon: "%", text: "Unlock future incentives from referral activity" },
            {
                icon: "\u{1F4C8}",
                text: "Climb the referral leaderboard for extra rewards",
            },
        ],
    },
];
