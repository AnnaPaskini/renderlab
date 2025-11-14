"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { DesktopNavbar } from "./desktop-navbar";
import { MobileNavbar } from "./mobile-navbar";

export function NavBar() {
  const pathname = usePathname();
  const showNavbar =
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/contact");

  if (!showNavbar) {
    return null;
  }
  const navItems = [
    { title: "Pricing", link: "/pricing" },
    { title: "Blog", link: "/blog" },
    { title: "Contact", link: "/contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{
        ease: [0.6, 0.05, 0.1, 0.9],
        duration: 0.8,
      }}
      className={clsx(
        "fixed top-0 left-0 right-0 z-[60] w-full border-b border-white/10 transition-all duration-300",
        "nav-overlay nav-surface shadow-[0_22px_48px_-22px_rgba(12,12,18,0.6)]"
      )}
      style={{ height: '64px' }}
    >
      <div className="relative z-[1] flex w-full h-full items-center justify-between px-4 py-3 text-sm font-medium text-white tracking-tight md:px-8 md:text-base">
        <div className="hidden w-full lg:block">
          <DesktopNavbar navItems={navItems} />
        </div>

        <div className="flex h-full w-full items-center lg:hidden">
          <MobileNavbar navItems={navItems} />
        </div>
      </div>
    </motion.nav>
  );
}
