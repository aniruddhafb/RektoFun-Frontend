"use client";

import Image from "next/image";
import Link from "next/link";

export function NavbarBrand() {
    return (
        <div className="relative flex min-w-0 shrink items-center gap-2">
            {/* <div className="absolute -top-3 -left-[-128px] hidden md:block">
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
            </div> */}

            <Link href="/" className="relative min-w-0 border-2 border-transparent px-1 py-1 transition-all hover:border-black hover:bg-white hover:shadow-[2px_2px_0_#111] sm:px-2">
                <Image
                    src="/logos/mainlogo.png"
                    alt="REKTO"
                    width={220}
                    height={60}
                    className="h-7 w-auto min-[380px]:h-8 sm:h-8"
                    priority
                />
                <span className="absolute -right-1 -top-1 rotate-3 border border-black bg-[#e85a2d] px-1 py-px text-[7px] font-black leading-none tracking-[0.08em] text-white shadow-[1px_1px_0_#111] sm:right-0 sm:text-[8px]">
                    BETA
                </span>
            </Link>
        </div>
    );
}
