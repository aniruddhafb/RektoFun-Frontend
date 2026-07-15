import type { Metadata } from "next";
import { HeroSection, WaysToWinSection, FAQSection } from "@/app/components/homepage-components";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://rekto.fun/#organization",
      name: "RektoFun",
      url: "https://rekto.fun",
      logo: "https://rekto.fun/logos/mainlogo.png",
      sameAs: ["https://x.com/rekto_fun"],
    },
    {
      "@type": "WebSite",
      "@id": "https://rekto.fun/#website",
      name: "RektoFun",
      url: "https://rekto.fun",
      description: "Permissionless challenge markets on Solana.",
      publisher: { "@id": "https://rekto.fun/#organization" },
      inLanguage: "en-US",
    },
  ],
};

export default function Home() {
  return (
    <div className="bg-[#f3e1d7] font-sans flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <HeroSection />
      <WaysToWinSection />
      <FAQSection />
    </div>
  );
}
