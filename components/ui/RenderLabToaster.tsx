"use client";

import { Info } from "lucide-react";
import { Toaster } from "sonner";

export function RenderLabToaster() {
    return (
        <Toaster
            icons={{
                info: <Info className="text-gray-400" />,
            }}
            theme="dark"
            richColors={false}
            position="bottom-right"
            toastOptions={{
                duration: 1800,
                classNames: {
                    toast:
                        "rounded-2xl bg-[#1a1a1a] text-white text-sm shadow-lg shadow-black/40 border border-white/10",
                },
            }}
        />
    );
}
