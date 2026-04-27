export const PROFILE_SVGS = Array.from(
    { length: 31 },
    (_, index) => `/profiles/${index + 1}.svg`,
);

export const NAV_LINKS = [
    { href: "/challenges", label: "Challenges" },
    { href: "/markets", label: "Markets" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/referral", label: "Referral" },
    { href: "/activity", label: "Activity" },
    {
        href: "https://rektofun.gitbook.io/rektofun/roadmap/whats-next",
        label: "Roadmap",
    },
];
