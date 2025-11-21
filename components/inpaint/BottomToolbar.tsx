'use client';

import { Tooltip } from '@/components/ui/Tooltip';
import { ArrowUp, Paperclip } from 'lucide-react';
import { useRef } from 'react';

interface BottomToolbarProps {
    inpaintPrompt: string;
    setInpaintPrompt: (prompt: string) => void;
    hasMask?: boolean;
    onGenerate?: () => void;
    isGenerating?: boolean;
    referenceImage?: string | null;  // NEW: Pass from parent
    onReferenceImageChange?: (url: string | null) => void;  // NEW: Callback to parent
}

export function BottomToolbar({
    inpaintPrompt,
    setInpaintPrompt,
    hasMask = false,
    onGenerate,
    isGenerating = false,
    referenceImage = null,  // NEW: Use prop
    onReferenceImageChange  // NEW: Use callback
}: BottomToolbarProps) {
    const paperclipInputRef = useRef<HTMLInputElement>(null);

    const isGenerateDisabled = !hasMask || !inpaintPrompt.trim() || isGenerating;

    const handlePaperclipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            try {
                // Upload to Supabase instead of using data URL
                const { supabase } = await import('@/lib/supabase');

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.error('❌ User not authenticated');
                    return;
                }

                const fileName = `${user.id}/reference_${Date.now()}_${file.name}`;

                const { data, error } = await supabase.storage
                    .from('renderlab-images')
                    .upload(fileName, file, {
                        contentType: file.type,
                        upsert: false
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('renderlab-images')
                    .getPublicUrl(fileName);

                console.log('📸 Reference uploaded to Supabase:', publicUrl);

                // ✅ IMPORTANT: Call parent callback to update state
                if (onReferenceImageChange) {
                    onReferenceImageChange(publicUrl);
                }

            } catch (error) {
                console.error('❌ Failed to upload reference image:', error);
            }
        }
        e.target.value = '';
    };

    return (
        <div className="flex justify-center w-full">
            <div className="w-[90%] max-w-4xl">
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
                                    onClick={() => onReferenceImageChange?.(null)}
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
                            placeholder:text-purple-400/50 outline-none px-3 py-2 resize-none h-[72px]
                            focus:border-purple-500/50 transition-colors"
                        />

                        {/* Right side buttons */}
                        <div className="flex items-center gap-2">
                            {/* Paperclip button - hide when reference exists */}
                            {!referenceImage && (
                                <button
                                    onClick={() => paperclipInputRef.current?.click()}
                                    className="w-10 h-10 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] 
                                    flex items-center justify-center transition-colors text-purple-400/70 hover:text-purple-400"
                                    title="Attach reference image">
                                    <Paperclip size={18} />
                                </button>
                            )}

                            {/* Generate button - colored when ready */}
                            <Tooltip
                                text={isGenerating ? 'Generating...' : (isGenerateDisabled ? 'Add mask and prompt to generate' : 'Generate')}
                                position="top"
                            >
                                <button
                                    onClick={onGenerate}
                                    disabled={isGenerateDisabled}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center 
                                    transition-colors text-white ${isGenerateDisabled
                                            ? 'bg-purple-500/20 text-purple-400/50 cursor-not-allowed'
                                            : 'bg-[#ff6b35] hover:bg-[#ff8555]'
                                        }`}
                                >
                                    {isGenerating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <ArrowUp size={20} strokeWidth={2.5} />
                                    )}
                                </button>
                            </Tooltip>
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
        </div>
    );
}
