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
                {/* DOT Grid pattern */}
                <div
                    className="fixed inset-0 pointer-events-none z-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />
                {/* Radial gradient overlay - very strong vignette effect */}
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_30%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-0" />

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
