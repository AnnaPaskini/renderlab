"use client";

import { DesktopNavbar } from "./desktop-navbar";
import { MobileNavbar } from "./mobile-navbar";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Z } from "@/lib/z-layer-guide";

export function NavBar() {
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
      `fixed top-0 left-0 right-0 backdrop-blur-md bg-white/80 shadow-sm transition-all duration-300 z-[${Z.NAV}]`
    )}
    style={{ zIndex: Z.NAV }}
>
  <div className="flex w-full items-center justify-between px-4 md:px-8 py-3">
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
