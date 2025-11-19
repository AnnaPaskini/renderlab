"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const AppNavbar = () => {
    const pathname = usePathname();

    const navItems = [
        { name: "Workspace", href: "/workspace" },
        { name: "Inpaint", href: "/inpaint" },
        { name: "Templates", href: "/templates" },
        { name: "Collections", href: "/collections" },
        { name: "History", href: "/history" },
        { name: "Prompts Library", href: "/prompts" },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-neutral-950/80 border-b border-white/[0.08]">
            <div className="max-w-full px-8">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">R</span>
                        </div>
                        <span className="text-white font-semibold text-base">
                            RenderLab
                        </span>
                    </Link>

                    {/* Navigation Tabs - Apple style */}
                    <div className="flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${pathname === item.href
                                    ? "text-white"
                                    : "text-neutral-400 hover:text-white"
                                    }`}
                            >
                                {item.name}
                                {pathname === item.href && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Credits Badge */}
                        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <span>3 credits</span>
                        </div>

                        {/* User Avatar */}
                        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all">
                            A
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};