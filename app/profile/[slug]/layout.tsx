import type { Metadata } from "next";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { slug } = await params;
  const profile = decodeURIComponent(slug).slice(0, 80);
  const title = "User Profile";
  const description = `View ${profile}'s RektoFun profile, challenge markets, activity, and performance.`;
  return {
    title,
    description,
    alternates: { canonical: `/profile/${encodeURIComponent(slug)}` },
    openGraph: { title: `${title} | RektoFun`, description, url: `/profile/${encodeURIComponent(slug)}`, images: [{ url: "/logos/social_share.png", width: 1731, height: 909, alt: "RektoFun challenge markets on Solana" }] },
  };
}

export default function ProfileLayout({ children }: Props) { return children; }
