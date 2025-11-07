"use client";
import { Logo } from "../Logo";
import { Button } from "../button";
import { NavBarItem } from "./navbar-item";
import {
  useMotionValueEvent,
  useScroll,
  motion,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link } from "next-view-transitions";
import { ModeToggle } from "../mode-toggle";

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
            className="pointer-events-none absolute inset-0 h-full w-full rounded-full bg-[radial-gradient(circle_at_12%_20%,rgba(244,114,182,0.18),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(250,204,21,0.14),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(129,140,248,0.2),transparent_45%)]"
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
        <ModeToggle />
        <Button
          variant="simple"
          as={Link}
          href="/login"
          className="aura bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 font-semibold tracking-tight text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] transition-colors hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400 focus-visible:ring-2 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-0"
        >
          Login
        </Button>
        <Button
          as={Link}
          href="/signup"
          className="aura bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 font-semibold tracking-tight text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] transition-colors hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400 focus-visible:ring-2 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-0"
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
};
