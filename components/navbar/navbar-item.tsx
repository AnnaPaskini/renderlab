"use client";

import { cn } from "@/lib/utils";
import { Link } from "next-view-transitions";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: ReactNode;
  active?: boolean;
  className?: string;
  target?: "_blank";
};

export function NavBarItem({
  children,
  href,
  active,
  target,
  className,
}: Props) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center rounded-xl px-4 py-2 text-sm leading-[110%] text-white text-shadow-soft transition-colors",
        "hover:bg-white/15 hover:text-white",
        (active || pathname?.includes(href)) &&
          "bg-white/20 text-white",
        className
      )}
      target={target}
    >
      {children}
    </Link>
  );
}
