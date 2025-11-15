'use client';

import { ArrowUp, Paperclip } from 'lucide-react';
import { useRef, useState } from 'react';

interface BottomToolbarProps {
    inpaintPrompt: string;
    setInpaintPrompt: (prompt: string) => void;
    hasMask?: boolean;
    onGenerate?: () => void;
    isGenerating?: boolean;
}

export function BottomToolbar({
    inpaintPrompt,
    setInpaintPrompt,
    hasMask = false,
    onGenerate,
    isGenerating = false
}: BottomToolbarProps) {
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const paperclipInputRef = useRef<HTMLInputElement>(null);

    const isGenerateDisabled = !hasMask || !inpaintPrompt.trim() || isGenerating;

    const handlePaperclipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                if (imageUrl) {
                    setReferenceImage(imageUrl);
                    console.log('✅ Paperclip reference uploaded:', file.name);
                }
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-10">
            <div className="bg-[#2a2a2a] rounded-2xl border border-white/10 p-4
                shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative">

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white text-black">
                        Prompt
                    </div>
                </div>

                {/* Input Row */}
                <div className="flex items-center gap-2">
                    {/* Reference thumbnail - left side under Prompt */}
                    {referenceImage && (
                        <div className="relative group flex-shrink-0">
                            <img
                                src={referenceImage}
                                className="w-[72px] h-[72px] object-cover rounded-lg border border-white/10"
                            />
                            <button
                                onClick={() => setReferenceImage(null)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full 
                                    bg-white/10 backdrop-blur-sm border border-white/20 
                                    hover:bg-white/20 transition-all
                                    opacity-0 group-hover:opacity-100 
                                    flex items-center justify-center text-white text-sm"
                                title="Remove reference">
                                ×
                            </button>
                        </div>
                    )}

                    {/* Textarea with border */}
                    <textarea
                        value={inpaintPrompt}
                        onChange={(e) => setInpaintPrompt(e.target.value)}
                        placeholder="Describe what you want to change..."
                        rows={3}
                        className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-base 
                            placeholder:text-gray-500 outline-none px-3 py-2 resize-none h-[72px]
                            focus:border-white/20 transition-colors"
                    />

                    {/* Right side buttons */}
                    <div className="flex items-center gap-2">
                        {/* Paperclip button - hide when reference exists */}
                        {!referenceImage && (
                            <button
                                onClick={() => paperclipInputRef.current?.click()}
                                className="w-10 h-10 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] 
                                    flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                                title="Attach reference image">
                                <Paperclip size={18} />
                            </button>
                        )}

                        {/* Generate button - colored when ready */}
                        <button
                            onClick={onGenerate}
                            disabled={isGenerateDisabled}
                            className={`w-10 h-10 rounded-full flex items-center justify-center 
                                transition-colors text-white ${isGenerateDisabled
                                    ? 'bg-gray-700 cursor-not-allowed'
                                    : 'bg-[#ff6b35] hover:bg-[#ff8555]'
                                }`}
                            title={isGenerateDisabled ? 'Add mask and prompt to generate' : 'Generate'}>
                            {isGenerating ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <ArrowUp size={20} strokeWidth={2.5} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Hidden input */}
                <input
                    ref={paperclipInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePaperclipUpload}
                />
            </div>
        </div>
    );
}
