"use client";

interface PromptPreviewProps {
    prompt: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
}

export function PromptPreview({
    prompt,
    onChange,
    placeholder = "Enter your prompt here or load a template...",
    label = "Current Prompt Preview"
}: PromptPreviewProps) {
    const isEditable = !!onChange;

    return (
        <div
            className="rounded-xl p-4 border border-white/[0.06]"
            style={{
                background: '#1a1a1a',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 20px 56px rgba(0, 0, 0, 0.3)'
            }}
        >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {label}
            </h3>
            <div
                className="rounded-lg p-3"
                style={{
                    background: '#0f0f0f',
                    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(0, 0, 0, 0.3)'
                }}
            >
                {isEditable ? (
                    <textarea
                        value={prompt}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-0 min-h-[80px] max-h-[120px] overflow-y-auto resize-none text-sm text-gray-300 leading-relaxed focus:outline-none focus:ring-0"
                    />
                ) : (
                    <p className="text-sm text-gray-300 leading-relaxed min-h-[80px]">
                        {prompt || placeholder}
                    </p>
                )}
            </div>
        </div>
    );
}
