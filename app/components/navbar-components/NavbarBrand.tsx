"use client";

import Image from "next/image";
import Link from "next/link";

export function NavbarBrand() {
    return (
        <div className="flex items-center gap-2 relative">
            <div className="absolute -top-3 -left-[-128px] hidden md:block">
                <div className="relative w-10 h-10">
                    <svg viewBox="0 0 80 80" className="w-full h-full rotate-12">
                        <polygon
                            points="40,0 45,15 60,10 52,25 65,35 50,40 55,55 40,48 25,55 30,40 15,35 28,25 20,10 35,15"
                            fill="#e85a2d"
                        />
                    </svg>
                    <span className="absolute inset-0 mb-1 flex items-center justify-center text-white text-[8px] font-bold rotate-12">
                        Beta
                    </span>
                </div>
            </div>

            <Link href="/" className="hover:opacity-80 transition-opacity">
                <Image
                    src="/logos/mainlogo.png"
                    alt="REKTO"
                    width={220}
                    height={60}
                    className="h-6 sm:h-8 w-auto"
                    priority
                />
            </Link>
        </div>
    );
}
