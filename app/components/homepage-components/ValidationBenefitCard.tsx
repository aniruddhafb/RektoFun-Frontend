import type { ReactNode } from "react";

interface ValidationBenefitCardProps {
    icon: ReactNode;
    text: string;
}

export function ValidationBenefitCard({
    icon,
    text,
}: ValidationBenefitCardProps) {
    return (
        <div className="flex items-start gap-3 bg-[#fdf8f5] rounded-xl p-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#fdf0eb] border border-[#f5c9b8] flex items-center justify-center">
                {icon}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
        </div>
    );
}
