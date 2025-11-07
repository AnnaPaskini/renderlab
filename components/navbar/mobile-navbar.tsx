"use client";
import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { useState } from "react";
import { IoIosMenu } from "react-icons/io";
import { IoIosClose } from "react-icons/io";
import { Button } from "../button";
import { Logo } from "../Logo";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { ModeToggle } from "../mode-toggle";
import { Z } from "@/lib/z-layer-guide";

export const MobileNavbar = ({ navItems }: any) => {
  const [open, setOpen] = useState(false);

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
        "nav-surface nav-overlay flex w-full items-center justify-between rounded-full border border-white/20 px-2.5 py-1.5 text-white text-shadow-soft transition duration-200 dark:border-white/20",
        "shadow-[0_24px_48px_-20px_rgba(12,12,24,0.55)]",
        showBackground &&
          "shadow-[0_30px_60px_-20px_rgba(12,12,24,0.65)]"
      )}
    >
      <Logo />
      <IoIosMenu
        className="h-6 w-6 text-white drop-shadow"
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div
          className={`fixed inset-0 z-[${Z.MODAL}] flex flex-col items-start justify-start space-y-10 bg-[radial-gradient(circle_at_12%_20%,rgba(244,114,182,0.2),transparent_45%),radial-gradient(circle_at_88%_25%,rgba(250,204,21,0.14),transparent_40%),radial-gradient(circle_at_50%_88%,rgba(129,140,248,0.2),transparent_50%)] bg-white/20 text-white text-shadow-soft transition duration-200 dark:bg-[#050505]/75 glass-blur-24`}
        >
          <div className="flex items-center justify-between w-full px-5">
            <Logo />
            <div className="flex items-center space-x-2">
              <ModeToggle />
              <IoIosClose
                className="h-8 w-8 text-white drop-shadow"
                onClick={() => setOpen(!open)}
              />
            </div>
          </div>
          <div className="flex flex-col items-start justify-start gap-[14px] px-8">
            {navItems.map((navItem: any, idx: number) => (
              <>
                {navItem.children && navItem.children.length > 0 ? (
                  <>
                    {navItem.children.map((childNavItem: any, idx: number) => (
                      <Link
                        key={`link=${idx}`}
                        href={childNavItem.link}
                        onClick={() => setOpen(false)}
                        className="relative max-w-[15rem] text-left text-2xl"
                      >
                        <span className="block text-white text-shadow-soft">
                          {childNavItem.title}
                        </span>
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    key={`link=${idx}`}
                    href={navItem.link}
                    onClick={() => setOpen(false)}
                    className="relative font-semibold tracking-tight"
                  >
                    <span className="block text-[26px] text-white text-shadow-soft">
                      {navItem.title}
                    </span>
                  </Link>
                )}
              </>
            ))}
          </div>
          <div className="flex flex-row w-full items-start gap-2.5 px-8 py-4">
            <Button
              as={Link}
              href="/signup"
              className="aura bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 font-semibold tracking-tight text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] transition-colors hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400 focus-visible:ring-2 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-0"
            >
              Sign Up
            </Button>
            <Button
              variant="simple"
              as={Link}
              href="/login"
              className="aura bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 font-semibold tracking-tight text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_15px_rgba(150,100,255,0.4)] transition-colors hover:from-purple-400 hover:via-fuchsia-400 hover:to-indigo-400 focus-visible:ring-2 focus-visible:ring-fuchsia-300 focus-visible:ring-offset-0"
            >
              Login
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
