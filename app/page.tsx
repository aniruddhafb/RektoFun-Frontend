import { HeroSection, WaysToWinSection } from "@/components/homepage-components";

export default function Home() {
  return (
    <div className="bg-[#f3e1d7] font-sans flex flex-col">
      <HeroSection />
      <WaysToWinSection />
    </div>
  );
}
