export const PROFILE_SVGS = Array.from(
    { length: 31 },
    (_, index) => `/profiles/${index + 1}.svg`,
);

export const NAV_LINKS = [
    { href: "/challenges", label: "Live Challenges" },
    { href: "/markets", label: "Challenge Markets" },
    { href: "/clans", label: "Explore Clans" },
    { href: "/activity", label: "Live Activity" },
];

export const MORE_LINKS = [
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/referral", label: "Refer & Earn" },
    // { href: "/resolve", label: "Resolve Challenges" },
    // { href: "/resolve/nft", label: "Rekto Masters NFT" },
    {
        href: "https://rektofun.gitbook.io/rektofun/roadmap/whats-next",
        label: "Our Roadmap",
    },
];
