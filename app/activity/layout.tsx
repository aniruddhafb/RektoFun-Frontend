import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Activity",
  description: "Follow the latest activity across RektoFun challenge markets, including new positions, market updates, and results.",
  alternates: { canonical: "/activity" },
  openGraph: { url: "/activity", title: "Live Activity | RektoFun", description: "Follow the latest activity across RektoFun challenge markets.", images: [{ url: "/logos/social_share.png", width: 1731, height: 909, alt: "RektoFun challenge markets on Solana" }] },
};

export default function ActivityLayout({ children }: { children: React.ReactNode }) { return children; }
