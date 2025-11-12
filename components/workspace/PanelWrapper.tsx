import React from "react";

export function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-[#161616] rounded-2xl p-8 shadow-lg shadow-black/60"
    >
      {children}
    </div>
  );
}
