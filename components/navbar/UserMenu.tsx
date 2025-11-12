"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseBrowser";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import UserCredits from "./UseCredits";


export default function UserMenu() {
  const router = useRouter();
  const supabase = createClient(); // создаём клиент один раз
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  // Загружаем email текущего пользователя
  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.email) {
        setEmail(data.user.email);
      }
    }
    fetchUser();
  }, [supabase]);

  // Выход из аккаунта
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="relative flex items-center isolation-isolate">
      {/* Капсула с аватаром и email */}
      <div
        onClick={() => setOpen(!open)}
        className="group nav-surface nav-overlay flex cursor-pointer items-center gap-2 rounded-2xl border border-white/20 px-3.5 py-1.5 text-white text-shadow-soft shadow-[inset_0_0_10px_rgba(0,0,0,0.06),0_12px_32px_-12px_rgba(12,12,24,0.55)] transition-all duration-300 dark:border-white/20"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_0_0_1px_rgba(255,255,255,0.22)] ring-1 ring-white/30 backdrop-blur-md">
          <UserIcon size={15} className="text-white" />
        </div>
        <span className="text-shadow-soft text-sm font-medium tracking-tight text-white max-w-[140px] truncate">
  {email || "Loading..."}
</span>
<UserCredits />

<ChevronDown
  size={14}
  className={`text-white transition-transform ${open ? "rotate-180" : ""}`}
/>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="panel-dimmer panel-soft absolute right-0 top-full z-50 mt-3 w-52 overflow-hidden rounded-2xl"
          >
            <button
              onClick={() => {
                router.push("/account");
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-neutral-900 dark:text-white text-shadow-soft
                         hover:bg-gradient-to-r hover:from-[#ff6b35]/20 hover:via-[#ffb385]/15 hover:to-[#ff6b35]/20
                         transition-all"
            >
              Account Settings
            </button>
            
            <button
              onClick={() => {
                router.push("/account?tab=prompts");
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-neutral-900 dark:text-white text-shadow-soft
                         hover:bg-gradient-to-r hover:from-[#ff6b35]/20 hover:via-[#ffb385]/15 hover:to-[#ff6b35]/20
                         transition-all"
            >
              My Prompts
            </button>
            
            <button
              onClick={() => {
                router.push("/prompts/submit");
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-neutral-900 dark:text-white text-shadow-soft
                         hover:bg-gradient-to-r hover:from-[#ff6b35]/20 hover:via-[#ffb385]/15 hover:to-[#ff6b35]/20
                         transition-all"
            >
              Submit Prompt
            </button>
            
            {/* Divider */}
            <div className="my-1 border-t border-neutral-200/50 dark:border-white/10"></div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm 
                         text-neutral-900 dark:text-white text-shadow-soft transition-all hover:bg-gradient-to-r
                         hover:from-[#ff6b35]/20 hover:via-[#ffb385]/15 hover:to-[#ff6b35]/20"
            >
              <LogOut size={14} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
