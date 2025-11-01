"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { Z } from "@/lib/z-layer-guide"

type ActionsPanelProps = {
  onDuplicate: () => void;
  onRename: () => void;
  onSave: () => void;
  onAddTemplate: () => void;
  onBack: () => void;
};

export function ActionsPanel({ onDuplicate, onRename, onSave, onAddTemplate, onBack }: ActionsPanelProps) {
  const [open, setOpen] = useState(false);
useEffect(() => {
  document.body.classList.toggle("actions-open", open);
  return () => document.body.classList.remove("actions-open");
}, [open]);

  useEffect(() => {
    if (open) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const closePanel = () => setOpen(false);

  const handleDuplicate = () => {
    onDuplicate();
    closePanel();
  };

  const handleRename = () => {
    onRename();
    closePanel();
  };

  const handleSave = () => {
    onSave();
    closePanel();
  };

  const handleAddTemplateClick = () => {
    onAddTemplate();
    closePanel();
  };

  const handleBack = () => {
    onBack();
    closePanel();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md p-2 text-neutral-700 transition-all hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
        aria-label="Open collection actions"
      >
        <IconMenu2 size={20} stroke={1.5} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
  onClick={closePanel}
  className="fixed inset-0 bg-black/20 backdrop-blur-sm"
  style={{ zIndex: Z.OVERLAY }}
/>

            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`fixed top-0 right-0 h-full w-80 max-w-full rounded-l-2xl border-l border-neutral-200 bg-white shadow-xl`}
              style={{ zIndex: Z.SIDEBAR }}
            >
              <div className="relative flex h-full flex-col overflow-hidden">
                <div className="pointer-events-none absolute left-0 right-0 top-0 h-24 bg-gradient-to-b from-white/60 to-transparent dark:from-neutral-900/60" />
                <div className="flex items-center justify-between border-b border-neutral-200/40 px-5 py-4 dark:border-neutral-800/40">
                  <h3 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Collection Actions</h3>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="rounded-full p-2 transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label="Close collection actions"
                  >
                    <IconX size={18} stroke={1.5} />
                  </button>
                </div>

                <div className="flex flex-col items-center space-y-3 mt-4">
  {[
    { label: "Duplicate", onClick: onDuplicate },
    { label: "Rename", onClick: onRename },
    { label: "Save", onClick: onSave },
    { label: "+ Add Template", onClick: onAddTemplate },
    { label: "Back", onClick: onBack },
  ].map(({ label, onClick }) => (
    <Button
      key={label}
      variant="ghost"
      onClick={onClick}
      className="min-w-[260px] bg-gray-100 text-gray-900 text-base font-semibold py-2 px-6 rounded-lg hover:bg-gray-200 transition"
    >
      {label}
    </Button>
  ))}
</div>



                <div className="mt-auto border-t border-neutral-200/30 p-4 text-center text-xs text-neutral-400 dark:border-neutral-800/30">
                  RenderLab Panel
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
