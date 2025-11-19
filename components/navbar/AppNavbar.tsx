"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const AppNavbar = () => {
    const pathname = usePathname();

    const navItems = [
        { name: "Workspace", href: "/workspace" },
        { name: "Inpaint", href: "/inpaint" },
        { name: "Templates", href: "/custom" },
        { name: "Collections", href: "/custom" },
        { name: "History", href: "/history" },
        { name: "Prompts Library", href: "/prompts" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gradient-to-b from-black/75 via-black/70 to-black/65 border-b border-white/[0.15] shadow-[0_1px_3px_0_rgba(255,255,255,0.12),0_-1px_2px_0_rgba(255,255,255,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.08)]">
            <div className="max-w-full px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-orange-500/50 transition-all">
                            <span className="text-white font-bold text-sm">R</span>
                        </div>
                        <span className="text-white font-semibold text-lg tracking-tight">
                            RenderLab
                        </span>
                    </Link>

                    {/* Navigation Tabs */}
                    <div className="flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full ${pathname === item.href
                                    ? "text-white opacity-100"
                                    : "text-neutral-400 opacity-60 hover:text-white hover:opacity-100"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Credits Badge */}
                        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white flex items-center space-x-1.5 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <span>3 credits</span>
                        </div>

                        {/* User Avatar */}
                        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-105">
                            A
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};