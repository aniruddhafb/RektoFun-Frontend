
"use client";

export function PageMarginWrapper({ children }: { children: React.ReactNode }) {
    // Navbar is visible on all pages, so always add margin for the fixed navbar
    return <div className="mt-12 md:mt-8">{children}</div>;
}
