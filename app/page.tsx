import { HeroSection, WaysToWinSection, FAQSection } from "@/app/components/homepage-components";

export default function Home() {
  return (
    <div className="bg-[#f3e1d7] font-sans flex flex-col">
      <HeroSection />
      <WaysToWinSection />
      <FAQSection />
    </div>
  );
}
