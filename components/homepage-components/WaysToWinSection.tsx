import Link from "next/link";

import { EarningCard } from "./EarningCard";
import { earningCards } from "./homepageData";
import { ValidationBenefitCard } from "./ValidationBenefitCard";

export function WaysToWinSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 xl:px-12 py-16 sm:py-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <div className="flex flex-col items-center gap-3 mb-3">
            <h2 className="text-4xl sm:text-5xl font-bold text-black leading-tight text-center">
              MULTIPLE WAYS TO <span className="text-[#e85a2d]">WIN {"\u{1F3C6}"}</span>
            </h2>
          </div>
          <p className="text-gray-500 text-base sm:text-lg text-center mt-4">
            PREDICT &amp; COMPETE | CLIMB &amp; WIN {"\u{1F4B0}"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {earningCards.map((card) => (
            <EarningCard key={card.number} {...card} />
          ))}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-6 pb-4 md:pb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                  <span className="text-[#e85a2d] font-bold text-lg">05</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black mb-2">
                    Validating Challenges (Coming soon)
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                    Help validate outcomes of real-world event challenges and keep the
                    platform fair and trustworthy.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fdf0eb] border border-[#f5c9b8] rounded-full mb-4">
                <span className="text-[#e85a2d] text-xs font-semibold">
                  How you win:
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ValidationBenefitCard
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                      <path d="M12 2L14 8H20L15 12L17 18L12 14L7 18L9 12L4 8H10L12 2Z" fill="#e85a2d" opacity="0.7" />
                    </svg>
                  }
                  text="Win from the validation reward pool"
                />
                <ValidationBenefitCard
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                      <circle cx="10" cy="8" r="4" stroke="#e85a2d" strokeWidth="1.5" />
                      <circle cx="16" cy="10" r="3" stroke="#e85a2d" strokeWidth="1.5" />
                      <path d="M2 20C2 16 6 14 10 14C14 14 18 16 18 20" stroke="#e85a2d" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  }
                  text="The more validations you perform, the more you win"
                />
                <ValidationBenefitCard
                  icon={
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                      <path d="M12 2L13.5 8H20L14.5 12L16.5 18L12 14.5L7.5 18L9.5 12L4 8H10.5L12 2Z" fill="#f5c842" />
                      <path d="M8 20H16" stroke="#d4a820" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  }
                  text="Exclusive to Rekto Masters NFT holders"
                />
              </div>
            </div>
            <div className="flex items-center justify-center p-6 md:w-48">
              <div className="w-32 h-32">
                <svg viewBox="0 0 120 120" className="w-full h-full" fill="none">
                  <path d="M60 10 L100 28 L100 65 C100 88 60 110 60 110 C60 110 20 88 20 65 L20 28 Z" fill="#d4c4b0" stroke="#b8a890" strokeWidth="2" />
                  <path d="M60 22 L88 36 L88 65 C88 82 60 98 60 98 C60 98 32 82 32 65 L32 36 Z" fill="#c8b8a4" />
                  <circle cx="60" cy="62" r="18" fill="#e85a2d" />
                  <path d="M50 62 L57 70 L72 54" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="60" cy="104" r="8" fill="#f5c842" stroke="#d4a820" strokeWidth="1.5" />
                  <path d="M56 108 L60 100 L64 108" fill="#d4a820" />
                  <path d="M18 40L19.5 46L18 47.5L16.5 46L18 40Z" fill="#f5c842" />
                  <path d="M18 52L19.5 46L18 44.5L16.5 46L18 52Z" fill="#f5c842" />
                  <path d="M12 46L18 47.5L19.5 46L18 44.5L12 46Z" fill="#f5c842" />
                  <path d="M24 46L18 47.5L16.5 46L18 44.5L24 46Z" fill="#f5c842" />
                  <path d="M102 50L103.5 56L102 57.5L100.5 56L102 50Z" fill="#f5c842" />
                  <path d="M102 62L103.5 56L102 54.5L100.5 56L102 62Z" fill="#f5c842" />
                  <path d="M96 56L102 57.5L103.5 56L102 54.5L96 56Z" fill="#f5c842" />
                  <path d="M108 56L102 57.5L100.5 56L102 54.5L108 56Z" fill="#f5c842" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 bg-[#1e2939] rounded-2xl px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16">
              <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
                <path d="M40 8 C40 8 58 20 58 44 L40 56 L22 44 C22 20 40 8 40 8Z" fill="#e85a2d" />
                <circle cx="40" cy="34" r="7" fill="white" opacity="0.9" />
                <circle cx="40" cy="34" r="4" fill="#5ba8d8" />
                <path d="M22 44 L12 58 L26 52 Z" fill="#c04020" />
                <path d="M58 44 L68 58 L54 52 Z" fill="#c04020" />
                <path d="M32 56 C32 56 36 68 40 72 C44 68 48 56 48 56" fill="#f5d547" opacity="0.9" />
                <path d="M35 60 C35 60 38 70 40 73 C42 70 45 60 45 60" fill="white" opacity="0.6" />
                <circle cx="16" cy="20" r="2" fill="white" opacity="0.8" />
                <circle cx="64" cy="16" r="1.5" fill="white" opacity="0.8" />
                <circle cx="12" cy="36" r="1.5" fill="white" opacity="0.6" />
                <circle cx="68" cy="30" r="2" fill="white" opacity="0.6" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg sm:text-xl">Predict. Compete. Win.</p>
              <p className="text-gray-400 text-sm">Your skill. Your edge. Your rewards.</p>
            </div>
          </div>
          <Link
            href="/challenges"
            className="flex-shrink-0 px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all hover:scale-105 text-sm sm:text-base"
          >
            Get Started {"\u2192"}
          </Link>
        </div>
      </div>
    </section>
  );
}
