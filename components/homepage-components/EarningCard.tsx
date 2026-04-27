import type { ReactNode } from "react";

interface EarningCardProps {
  number: string;
  title: string;
  description: string;
  illustration: ReactNode;
  bullets: Array<{
    icon: string;
    text: string;
  }>;
  readMoreHref?: string;
}

export function EarningCard({
  number,
  title,
  description,
  illustration,
  bullets,
  readMoreHref,
}: EarningCardProps) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
              <span className="text-[#e85a2d] font-bold text-lg">{number}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-black mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {description}
              </p>
              {readMoreHref ? (
                <a
                  href={readMoreHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#e85a2d] text-xs font-medium hover:underline mt-2"
                >
                  Read more {"\u2192"}
                </a>
              ) : null}
            </div>
          </div>
          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24">
            {illustration}
          </div>
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fdf0eb] border border-[#f5c9b8] rounded-full mb-4">
          <span className="text-[#e85a2d] text-xs font-semibold">
            How you win:
          </span>
        </div>
        <ul className="space-y-2.5">
          {bullets.map((bullet) => (
            <li
              key={`${number}-${bullet.text}`}
              className="flex items-center gap-3 text-sm text-gray-600"
            >
              <span className="text-base" aria-hidden="true">
                {bullet.icon}
              </span>
              {bullet.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
