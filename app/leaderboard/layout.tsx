import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the top-ranked RektoFun predictors and challenge market traders, including their wins, volume, and performance.",
  alternates: { canonical: "/leaderboard" },
  openGraph: { url: "/leaderboard", title: "Leaderboard | RektoFun", description: "Discover the top predictors and challenge market traders on RektoFun.", images: [{ url: "/logos/social_share.png", width: 1731, height: 909, alt: "RektoFun challenge markets on Solana" }] },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) { return children; }
