"use client";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Link } from "next-view-transitions";
import { useState } from "react";
import { Logo } from "../Logo";
import { Button } from "../button";
import { NavBarItem } from "./navbar-item";

type Props = {
  navItems: {
    link: string;
    title: string;
    target?: "_blank";
  }[];
};

export const DesktopNavbar = ({ navItems }: Props) => {
  const { scrollY } = useScroll();

  const [showBackground, setShowBackground] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    if (value > 100) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  });
  return (
    <div
      className={cn(
        "nav-surface nav-overlay relative flex w-full items-center justify-between gap-4 rounded-full border border-white/20 px-4 py-2 text-white text-shadow-soft transition duration-200 dark:border-white/20",
        "shadow-[0_24px_48px_-20px_rgba(12,12,24,0.55)]",
        showBackground &&
        "shadow-[0_30px_60px_-20px_rgba(12,12,24,0.65)]"
      )}
    >
      <AnimatePresence>
        {showBackground && (
          <motion.div
            key={String(showBackground)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1,
            }}
            className="pointer-events-none absolute inset-0 h-full w-full rounded-full bg-[radial-gradient(circle_at_12%_20%,rgba(255,107,53,0.18),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(250,204,21,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(255,138,85,0.15),transparent_45%)]"
          />
        )}
      </AnimatePresence>
      <div className="flex flex-row items-center gap-2 text-sm font-medium tracking-tight">
        <Logo />
        <div className="flex items-center gap-1.5 text-white">
          {navItems.map((item) => (
            <NavBarItem href={item.link} key={item.title} target={item.target}>
              {item.title}
            </NavBarItem>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="simple"
          as={Link}
          href="/login"
          className="aura bg-[#ff6b35] hover:bg-[#ff8555] font-semibold tracking-tight text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-200 border-0 focus-visible:ring-[#ff6b35] focus:border-[#ff6b35]"
        >
          Login
        </Button>
        <Button
          as={Link}
          href="/signup"
          className="aura bg-[#ff6b35] hover:bg-[#ff8555] font-semibold tracking-tight text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-200 border-0 focus-visible:ring-[#ff6b35] focus:border-[#ff6b35]"
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
};
