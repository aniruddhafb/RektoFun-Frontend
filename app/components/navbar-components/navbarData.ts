export const PROFILE_SVGS = Array.from(
    { length: 31 },
    (_, index) => `/profiles/${index + 1}.svg`,
);

export const NAV_LINKS = [
    { href: "/challenges", label: "Live Challenges" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/activity", label: "Live Activity" },
];
