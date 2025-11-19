"use client";
import { motion } from "framer-motion";

interface RenderLabLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  maxWidth?: string;
}

export function RenderLabLayout({
  children,
  showHeader = true,
  maxWidth = "1600px"
}: RenderLabLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--rl-bg)] text-[var(--rl-text)] transition-colors duration-300">
      <div className="mx-auto p-6" style={{ maxWidth }}>
        {showHeader && (
          <header className="flex items-center justify-between pb-4">
            <div className="relative w-fit">
              <h1 className="text-xl font-semibold">Hey, Anna – Keep Crafting ✨</h1>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-[2px] rounded-xl px-6 py-4"></div>
            </div>
          </header>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.6, 0.05, 0.1, 0.9] }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
