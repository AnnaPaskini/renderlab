"use client";

import { DesktopNavbar } from "./desktop-navbar";
import { MobileNavbar } from "./mobile-navbar";
import { motion } from "framer-motion";
import clsx from "clsx";
import { usePathname } from "next/navigation";

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
        "fixed top-0 left-0 right-0 z-20 backdrop-blur-md bg-white/80 shadow-sm transition-all duration-300"
      )}
    >
      <div className="flex w-full items-center justify-between px-4 py-3 md:px-8">
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
