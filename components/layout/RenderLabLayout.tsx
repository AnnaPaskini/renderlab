"use client";
import { motion } from "framer-motion";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";

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
            <h1 className="text-xl font-semibold">Hey, Anna – Keep Crafting ✨</h1>
            <ThemeSwitch />
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
