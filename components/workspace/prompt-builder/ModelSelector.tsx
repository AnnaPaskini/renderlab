"use client";

import { AI_MODELS } from "@/lib/constants";

interface ModelSelectorProps {
    value: string;
    onChange: (model: string) => void;
    disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
    return (
        <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">
                AI Model
            </label>

            <div className="space-y-3">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="rl-textarea-inset w-full text-sm appearance-none cursor-pointer"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: `right 0.5rem center`,
                        backgroundRepeat: `no-repeat`,
                        backgroundSize: `1.5em 1.5em`,
                        paddingRight: `2.5rem`
                    }}
                >
                    {AI_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                            {model.label} — {model.description}
                        </option>
                    ))}
                </select>

                {value === 'nano-banana-pro' && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="text-purple-400 font-medium mb-2">Premium Quality</div>
                        <ul className="text-purple-400/70 text-xs space-y-1 list-disc list-inside">
                            <li>4K ultra-high resolution and superior quality</li>
                            <li>Takes longer to generate (90-120 seconds)</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
