"use client";

interface ModeToggleProps {
    mode: "template" | "collection";
    onChange: (mode: "template" | "collection") => void;
    disabled?: boolean;
}

export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
    return (
        <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 w-fit">
            <button
                onClick={() => onChange("template")}
                disabled={disabled}
                className={`px-4 py-2 rounded-md transition font-medium text-sm ${mode === "template"
                        ? "bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
            >
                Template
            </button>
            <button
                onClick={() => onChange("collection")}
                disabled={disabled}
                className={`px-4 py-2 rounded-md transition font-medium text-sm ${mode === "collection"
                        ? "bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                    }`}
            >
                Collection
            </button>
        </div>
    );
}
