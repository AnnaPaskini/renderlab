"use client";

interface ModelSelectorProps {
    value: string;
    onChange: (model: string) => void;
    disabled?: boolean;
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
    const models = [
        { id: "nano-banana", name: "Nano Banana", description: "Fast, high quality" },
        { id: "seedream4", name: "Seedream4", description: "Balanced" },
        { id: "flux", name: "Flux Pro", description: "Best quality" },
    ];

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                AI Model
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white text-sm transition"
            >
                {models.map((model) => (
                    <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                    </option>
                ))}
            </select>
        </div>
    );
}
