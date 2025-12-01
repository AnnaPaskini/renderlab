"use client";

import { Z } from "@/lib/z-layer-guide";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";


type ActionsPanelProps = {
  onDuplicate: () => void;
  onRename: () => void;
  onSave: () => void;
  onAddTemplate: () => void;
  onDelete?: () => void;
  onBack: () => void;
};

export function ActionsPanel({ onDuplicate, onRename, onSave, onAddTemplate, onDelete, onBack }: ActionsPanelProps) {
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
        className="rounded-md p-2 text-rl-text-secondary transition-all hover:bg-rl-surface"
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
              className="fixed inset-0 bg-black/30"
              style={{ zIndex: Z.OVERLAY }}
            />

            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 h-full w-80 max-w-full rounded-l-2xl rl-panel-sidebar"
              style={{ zIndex: Z.SIDEBAR }}
            >
              <div className="relative flex h-full flex-col overflow-hidden">
                <div className="pointer-events-none absolute left-0 right-0 top-0 h-24 bg-gradient-to-b from-white/60 to-transparent dark:from-neutral-900/60" />
                <div className="flex items-center justify-between border-b border-rl-border px-5 py-4">
                  <h3 className="text-base font-bold tracking-tight text-rl-text">Collection Actions</h3>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="rounded-full p-2 transition-all hover:bg-rl-surface"
                    aria-label="Close collection actions"
                  >
                    <IconX size={18} stroke={1.5} />
                  </button>
                </div>

                <div className="flex flex-col items-center space-y-3 mt-4 px-4">
                  <button
                    onClick={() => {
                      onAddTemplate();
                      closePanel();
                    }}
                    className="w-full text-left px-4 py-3 text-white font-medium rounded-lg bg-transparent hover:bg-[#ff6b35]/10 hover:text-[#ff6b35] transition-all duration-200 border-0"
                  >
                    + Add Template
                  </button>

                  <button
                    onClick={() => {
                      onSave();
                      closePanel();
                    }}
                    className="w-full text-left px-4 py-3 text-white font-medium rounded-lg bg-transparent hover:bg-[#ff6b35]/10 hover:text-[#ff6b35] transition-all duration-200 border-0"
                  >
                    Save Collection
                  </button>

                  <button
                    onClick={() => {
                      onDuplicate();
                      closePanel();
                    }}
                    className="w-full text-left px-4 py-3 text-white font-medium rounded-lg bg-transparent hover:bg-[#ff6b35]/10 hover:text-[#ff6b35] transition-all duration-200 border-0"
                  >
                    Duplicate
                  </button>

                  <button
                    onClick={() => {
                      onRename();
                      closePanel();
                    }}
                    className="w-full text-left px-4 py-3 text-white font-medium rounded-lg bg-transparent hover:bg-[#ff6b35]/10 hover:text-[#ff6b35] transition-all duration-200 border-0"
                  >
                    Rename
                  </button>

                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete();
                        closePanel();
                      }}
                      className="w-full text-left px-4 py-3 text-white font-medium rounded-lg bg-transparent hover:bg-[#ff6b35]/10 hover:text-[#ff6b35] transition-all duration-200 border-0"
                    >
                      Delete Collection
                    </button>
                  )}
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
