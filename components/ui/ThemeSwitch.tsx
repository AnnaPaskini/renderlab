"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitch() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("rl-theme");
    const current = document.documentElement.getAttribute("data-theme");
    
    if (saved === "dark" || current === "dark") {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      setTheme("light");
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    if (newTheme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("rl-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("rl-theme", "light");
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-[var(--rl-surface)] border border-[var(--rl-border)] opacity-50"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-[var(--rl-surface)] border border-[var(--rl-border)] hover:bg-[var(--rl-accent)] hover:text-white transition-all duration-200"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
