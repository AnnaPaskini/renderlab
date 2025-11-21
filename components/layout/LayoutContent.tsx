"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export const LayoutContent = ({ children }: { children: ReactNode }) => {
    const pathname = usePathname();

    // Determine if we should show the app navbar (internal pages)
    const showAppNavbar =
        pathname.startsWith("/workspace") ||
        pathname.startsWith("/custom") ||
        pathname.startsWith("/prompts") ||
        pathname.startsWith("/history") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/inpaint") ||
        pathname.startsWith("/templates") ||
        pathname.startsWith("/collections");

    // Internal pages get grid background
    if (showAppNavbar) {
        return (
            <div className="relative min-h-screen bg-transparent">
                {/* Content */}
                <div className="relative z-10 min-h-screen">
                    {children}
                </div>
            </div>
        );
    }

    // Landing page without grid
    return <>{children}</>;
};
