'use client';

import { Tooltip } from '@/components/ui/Tooltip';
import { ArrowUp, Paperclip, Plus, X } from 'lucide-react';
import { useRef } from 'react';

interface BottomToolbarProps {
    inpaintPrompt: string;
    setInpaintPrompt: (prompt: string) => void;
    hasMask?: boolean;
    onGenerate?: () => void;
    isGenerating?: boolean;
    referenceImages?: string[];  // Array of reference images (up to 4)
    onReferenceImagesChange?: (images: string[]) => void;  // Callback to update images
    maxReferenceImages?: number;  // Maximum allowed reference images
}

export function BottomToolbar({
    inpaintPrompt,
    setInpaintPrompt,
    hasMask = false,
    onGenerate,
    isGenerating = false,
    referenceImages = [],
    onReferenceImagesChange,
    maxReferenceImages = 4
}: BottomToolbarProps) {
    const paperclipInputRef = useRef<HTMLInputElement>(null);

    const isGenerateDisabled = !hasMask || !inpaintPrompt.trim() || isGenerating;
    const canAddMoreReferences = referenceImages.length < maxReferenceImages;

    const handlePaperclipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            try {
                // Upload to Supabase instead of using data URL
                const { createClient } = await import('@/lib/supabaseBrowser');
                const supabase = createClient();

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    console.error('❌ User not authenticated');
                    return;
                }

                // MIME validation
                if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                    console.error('❌ Unsupported file type:', file.type);
                    return;
                }

                const timestamp = Date.now();
                const fileExt = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'png';
                const fileName = `reference_${timestamp}.${fileExt}`;
                const filePath = `${user.id}/inpaint/${fileName}`;

                const { data, error } = await supabase.storage
                    .from('renderlab-images-v2')
                    .upload(filePath, file, {
                        contentType: file.type,
                        upsert: false
                    });

                if (error) throw error;

                const { data: signedData, error: signedError } = await supabase.storage
                    .from('renderlab-images-v2')
                    .createSignedUrl(filePath, 3600); // 1 hour

                if (signedError) throw signedError;

                console.log('📸 Reference uploaded to Supabase:', signedData.signedUrl);

                // ✅ Add new reference image to array
                if (onReferenceImagesChange && referenceImages.length < maxReferenceImages) {
                    onReferenceImagesChange([...referenceImages, signedData.signedUrl]);
                }

            } catch (error) {
                console.error('❌ Failed to upload reference image:', error);
            }
        }
        e.target.value = '';
    };

    const handleRemoveReference = (indexToRemove: number) => {
        if (onReferenceImagesChange) {
            onReferenceImagesChange(referenceImages.filter((_, i) => i !== indexToRemove));
        }
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
                        {/* Reference thumbnails - left side under Prompt */}
                        {referenceImages.length > 0 && (
                            <div className="flex gap-2 flex-shrink-0 items-end">
                                {/* Counter badge */}
                                <span className="text-xs text-gray-500 mb-1">
                                    {referenceImages.length}/{maxReferenceImages}
                                </span>
                                {referenceImages.map((refImage, index) => (
                                    <div key={index} className="relative group flex-shrink-0">
                                        <img
                                            src={refImage}
                                            className="w-[72px] h-[72px] object-cover rounded-lg border border-white/10"
                                        />
                                        <button
                                            onClick={() => handleRemoveReference(index)}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full 
                                            bg-white/10 backdrop-blur-sm border border-white/20 
                                            hover:bg-white/20 transition-all
                                            opacity-0 group-hover:opacity-100 
                                            flex items-center justify-center text-white text-sm"
                                            title="Remove reference">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                {/* Add more button - only show if can add more */}
                                {canAddMoreReferences && (
                                    <button
                                        onClick={() => paperclipInputRef.current?.click()}
                                        className="w-[72px] h-[72px] rounded-lg border border-dashed border-white/20 
                                        flex items-center justify-center text-white/40 hover:text-white/60 
                                        hover:border-white/40 transition-colors"
                                        title={`Add reference (${referenceImages.length}/${maxReferenceImages})`}>
                                        <Plus size={24} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Textarea with border */}
                        <textarea
                            value={inpaintPrompt}
                            onChange={(e) => setInpaintPrompt(e.target.value)}
                            placeholder="Describe what you want to add... (attach up to 4 reference images)"
                            rows={3}
                            className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg text-white text-base 
                            placeholder:text-white/20 outline-none px-3 py-2 resize-none h-[72px]
                            focus:border-[#ff6b35]/50 transition-colors"
                        />

                        {/* Right side buttons */}
                        <div className="flex items-center gap-2">
                            {/* Paperclip button - show when no references or can add more */}
                            {referenceImages.length === 0 && (
                                <button
                                    onClick={() => paperclipInputRef.current?.click()}
                                    className="w-10 h-10 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] 
                                    flex items-center justify-center transition-colors text-white/40 hover:text-[#ff6b35]"
                                    title="Add reference image (up to 4)">
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
                                    className={`w-10 h-10 rounded-md flex items-center justify-center 
                                    transition-all text-white ${isGenerateDisabled
                                            ? 'bg-[rgba(255,255,255,0.10)] text-[rgba(255,255,255,0.45)] border border-[rgba(255,255,255,0.12)] cursor-not-allowed opacity-50'
                                            : 'shadow-sm'
                                        }`}
                                    style={!isGenerateDisabled ? {
                                        background: 'linear-gradient(180deg, #FF7038 0%, #E84F23 100%)',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(255, 98, 64, 0.30)',
                                        transition: 'transform 0.15s ease-out, box-shadow 0.25s ease-out, background 0.25s ease-out'
                                    } : undefined}
                                    onMouseEnter={(e) => {
                                        if (!isGenerateDisabled) {
                                            e.currentTarget.style.background = 'linear-gradient(180deg, #FF8652 0%, #FF6430 100%)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.32), 0 6px 12px rgba(255, 120, 70, 0.30), inset 0 1px 1px rgba(255, 255, 255, 0.22)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isGenerateDisabled) {
                                            e.currentTarget.style.background = 'linear-gradient(180deg, #FF7038 0%, #E84F23 100%)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(255, 98, 64, 0.30)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                    }}
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
