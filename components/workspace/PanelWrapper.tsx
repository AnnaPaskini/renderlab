import React from "react";

export function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl bg-rl-panel p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)] backdrop-blur-md border border-rl-glass-border"
    >
      {children}
    </div>
  );
}
