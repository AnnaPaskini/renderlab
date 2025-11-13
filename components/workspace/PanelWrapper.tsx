import React from "react";

export function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-[#161616] rounded-2xl p-10 shadow-xl shadow-black/50"
    >
      {children}
    </div>
  );
}
