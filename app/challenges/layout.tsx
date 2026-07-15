import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest Challenge Markets",
  description: "Discover the latest and trending challenge markets on RektoFun. Join crypto, sports, PvP, and community challenges on Solana.",
  alternates: { canonical: "/challenges" },
  openGraph: { url: "/challenges", title: "Latest Challenge Markets | RektoFun", description: "Explore trending crypto, sports, and PvP challenge markets on Solana.", images: [{ url: "/logos/social_share.png", width: 1731, height: 909, alt: "RektoFun challenge markets on Solana" }] },
};

export default function ChallengesLayout({ children }: { children: React.ReactNode }) { return children; }
