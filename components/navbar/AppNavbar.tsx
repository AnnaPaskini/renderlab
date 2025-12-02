"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabaseBrowser";
import { ChevronDown, FileText, LogOut, PenLine, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Apple-style MenuItem component
const MenuItem = ({ icon, label, href, onClick, onNavigate }: { icon: React.ReactNode; label: string; href?: string; onClick?: () => void; onNavigate?: () => void }) => {
    const content = (
        <button className="w-full flex items-center gap-3 px-3 h-12 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition">
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </button>
    );

    if (href) {
        return <Link href={href} onClick={onNavigate}>{content}</Link>;
    }

    return <div onClick={onClick}>{content}</div>;
};

export const AppNavbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [email, setEmail] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load user email
    useEffect(() => {
        async function fetchUser() {
            const { data, error } = await supabase.auth.getUser();
            if (!error && data?.user?.email) {
                setEmail(data.user.email);
            }
        }
        fetchUser();
    }, [supabase]);

    // Close dropdown on route change
    useEffect(() => {
        setIsDropdownOpen(false);
    }, [pathname]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Logout handler
    const handleLogout = async () => {
        setIsDropdownOpen(false);
        await supabase.auth.signOut();
        router.replace("/login");
    };

    // Close dropdown handler for menu items
    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    // Check if current page is a Studio page
    const studioPages = ['/workspace', '/batch', '/inpaint', '/upscale', '/templates', '/collections', '/custom'];
    const isStudioActive = studioPages.some(page => pathname?.startsWith(page));

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
                    <div className="flex items-center space-x-6">
                        {/* Studio Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={`relative px-1 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-1 focus:outline-none focus-visible:outline-none ${isStudioActive
                                        ? "text-white"
                                        : "text-neutral-400 hover:text-white"
                                        }`}
                                >
                                    Studio
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    {isStudioActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600" />
                                    )}
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 mt-3 z-[60]">
                                <Link href="/workspace">
                                    <DropdownMenuItem className="cursor-pointer">
                                        Workspace
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/batch">
                                    <DropdownMenuItem className="cursor-pointer">
                                        Batch Studio
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/inpaint">
                                    <DropdownMenuItem className="cursor-pointer">
                                        InPaint
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/upscale">
                                    <DropdownMenuItem className="cursor-pointer">
                                        Upscale
                                    </DropdownMenuItem>
                                </Link>
                                <div className="h-px bg-white/10 my-1 mx-2" />
                                <Link href="/templates">
                                    <DropdownMenuItem className="cursor-pointer">
                                        My Templates
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/collections">
                                    <DropdownMenuItem className="cursor-pointer">
                                        My Collections
                                    </DropdownMenuItem>
                                </Link>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Explore */}
                        <Link
                            href="/prompts"
                            className={`relative px-1 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:outline-none ${pathname === '/prompts'
                                ? "text-white"
                                : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            Explore
                            {pathname === '/prompts' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600" />
                            )}
                        </Link>

                        {/* History */}
                        <Link
                            href="/history"
                            className={`relative px-1 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:outline-none ${pathname === '/history'
                                ? "text-white"
                                : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            History
                            {pathname === '/history' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600" />
                            )}
                        </Link>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* User Menu Dropdown */}
                        <div ref={dropdownRef} className="relative dropdown-container">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/20 transition-all focus:outline-none"
                            >
                                {email ? (() => {
                                    const username = email.split("@")[0] || "U";
                                    return username.charAt(0).toUpperCase();
                                })() : "A"}
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-[60px] w-64 rounded-2xl backdrop-blur-xl bg-neutral-900/95 border border-white/10 shadow-2xl shadow-black/50 p-2 z-50">
                                    <MenuItem icon={<Settings className="w-5 h-5" />} label="Account Settings" href="/account?tab=profile" onNavigate={closeDropdown} />
                                    <div className="w-full h-px bg-white/10 my-1" />
                                    <MenuItem icon={<FileText className="w-5 h-5" />} label="My Prompts" href="/account?tab=prompts" onNavigate={closeDropdown} />
                                    <MenuItem icon={<PenLine className="w-5 h-5" />} label="Submit Prompt" href="/prompts/submit" onNavigate={closeDropdown} />
                                    <div className="w-full h-px bg-white/10 my-1" />
                                    <MenuItem icon={<LogOut className="w-5 h-5" />} label="Logout" onClick={handleLogout} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};