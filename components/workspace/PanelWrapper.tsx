import React from "react";

export function PanelWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-3xl p-6 border border-white/[0.06]"
      style={{
        background: '#1a1a1a',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
      }}
    >
      {children}
    </div>
  );
}
