"use client";


interface ModelSelectorProps {
    value: string;
    onChange: (model: string) => void;
    disabled?: boolean;
}

const MODEL_OPTIONS = [
    {
        value: 'nano-banana',
        label: 'Nano Banana',
        description: 'Fast, high quality',
    },
    {
        value: 'nano-banana-pro',
        label: 'Nano Banana Pro',
        description: 'Studio quality, 4K',
    },
    {
        value: 'seedream4',
        label: 'Seedream4',
        description: 'Balanced',
    },
    {
        value: 'flux',
        label: 'Flux Pro',
        description: 'Best quality',
    },
    {
        value: 'flux-2-pro',
        label: 'Flux 2 Pro',
        description: 'Premium quality',
    },
];

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
                    className="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: `right 0.5rem center`,
                        backgroundRepeat: `no-repeat`,
                        backgroundSize: `1.5em 1.5em`,
                        paddingRight: `2.5rem`
                    }}
                >
                    {MODEL_OPTIONS.map((model) => (
                        <option key={model.value} value={model.value}>
                            {model.label} - {model.description}
                        </option>
                    ))}
                </select>

                {/* Premium Info Display */}
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
