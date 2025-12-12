'use client';

import { AppNavbar } from '@/components/navbar/AppNavbar';
import { ImagePreviewModal } from '@/components/workspace/ImagePreviewModal';
import { ImageUploadPanel } from '@/components/workspace/ImageUploadPanel';
import { SkeletonCard } from '@/components/workspace/SkeletonCard';
import { createUpscaleInput } from '@/core/thumbnail/createUpscaleInput';
import { UPSCALER_MODELS } from "@/lib/constants";
import { createClient } from '@/lib/supabaseBrowser';
import { uploadImageToStorage } from '@/lib/utils/uploadToStorage';
import { ArrowUpCircle, Download, MoreVertical, Sparkles, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';



interface UpscaleImage {
    id: string;
    url: string;
    thumbnail_url?: string;
    model: string;
    created_at: string;
}


export default function UpscalePage() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [selectedModel, setSelectedModel] = useState<string>('google-upscaler');
    const [isGenerating, setIsGenerating] = useState(false);
    const [historyImages, setHistoryImages] = useState<UpscaleImage[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const searchParams = useSearchParams();

    // Load image from URL parameter
    useEffect(() => {
        const imageParam = searchParams.get('image');
        if (imageParam && !uploadedImage) {
            setUploadedImage(imageParam);
            toast.success('Image loaded from History');
        }
    }, [searchParams]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        if (openMenuId) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openMenuId]);

    // Load upscale history
    useEffect(() => {
        const loadHistory = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data, error } = await supabase
                .from('images')
                .select('id, url, thumbnail_url, model, created_at')
                .eq('user_id', user.id)
                .eq('type', 'upscale')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                setHistoryImages(data);
            }
        };

        loadHistory();
    }, []);

    const handleClearImage = () => {
        setUploadedImage(null);
        setUploadedFile(null);
    };

    const handleUpscale = async () => {
        if (!uploadedImage) {
            toast.error('Please upload an image first');
            return;
        }

        setIsGenerating(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Please log in');
                return;
            }

            let imageUrlForUpscale = uploadedImage;

            // If we have the original file, check if resize needed
            if (uploadedFile) {
                const { blob, wasResized } = await createUpscaleInput(uploadedFile);

                if (wasResized) {
                    toast.info('Resizing image for upscale...', { duration: 2000 });

                    // Upload resized image to storage
                    const resizedUrl = await uploadImageToStorage(
                        supabase,
                        blob,
                        user.id,
                        'workspace',
                        `upscale-input-${Date.now()}.png`
                    );

                    if (resizedUrl) {
                        imageUrlForUpscale = resizedUrl;
                    }
                }
            }

            const response = await fetch('/api/upscale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: imageUrlForUpscale,
                    model: selectedModel,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upscale failed');
            }

            if (data.status === 'succeeded' && data.output?.imageUrl) {
                const newImage: UpscaleImage = {
                    id: `temp-${Date.now()}`,
                    url: data.output.imageUrl,
                    thumbnail_url: data.output.imageUrl,
                    model: selectedModel,
                    created_at: new Date().toISOString(),
                };

                setHistoryImages((prev) => [newImage, ...prev]);
                toast.success('Image upscaled successfully!');
            } else {
                throw new Error('Upscale failed - no output');
            }
        } catch (error) {
            console.error('Upscale error:', error);
            toast.error(error instanceof Error ? error.message : 'Upscale failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const formatDateTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const day = date.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${hours}:${minutes}`;
    };

    const handleDownload = async (url: string, id: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `upscaled_${id}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            setOpenMenuId(null);
            toast.success('Downloaded successfully');
        } catch (error) {
            toast.error('Failed to download image');
        }
    };

    const handleRemoveFromView = (id: string) => {
        setHistoryImages(prev => prev.filter(img => img.id !== id));
        setOpenMenuId(null);
        toast.info('Removed from view');
    };

    return (
        <div className="min-h-screen">
            <AppNavbar />

            <div className="max-w-7xl mx-auto px-8 pt-32 pb-12">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                        <ArrowUpCircle className="w-8 h-8 text-purple-400" />
                        Upscale Studio
                    </h1>
                    <p className="text-neutral-400">Enhance your images with AI-powered upscaling</p>
                </div>

                {/* Main Layout - like Workspace */}
                <div className="flex gap-8">
                    {/* Left Column - Controls */}
                    <div className="flex-1 max-w-xl">
                        <div className="rl-panel-wrapper space-y-6">
                            {/* Upload */}
                            <div>
                                <ImageUploadPanel
                                    image={uploadedImage}
                                    onImageChange={setUploadedImage}
                                    onClearImage={handleClearImage}
                                    onFileChange={setUploadedFile}
                                />
                            </div>

                            {/* Model Selection */}
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-3">
                                    Upscale Model
                                </label>
                                <div className="space-y-2">
                                    {UPSCALER_MODELS.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => setSelectedModel(model.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedModel === model.id
                                                ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                                                : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="font-medium">{model.name}</div>
                                            <div className="text-sm text-white/50">{model.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleUpscale}
                                disabled={!uploadedImage || isGenerating}
                                className="w-full py-3.5 text-base font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: uploadedImage && !isGenerating
                                        ? 'linear-gradient(180deg, #A855F7 0%, #7C3AED 100%)'
                                        : 'rgba(255,255,255,0.1)',
                                    boxShadow: uploadedImage && !isGenerating
                                        ? '0 4px 12px rgba(168, 85, 247, 0.3)'
                                        : 'none',
                                }}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Upscaling...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Upscale Image
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column - History */}
                    <div className="w-80">
                        <div className="rl-panel-wrapper-compact">
                            <h3 className="text-sm font-semibold text-white/70 mb-4">Upscale History</h3>

                            <div className="grid grid-cols-2 gap-2 max-h-[600px] overflow-y-auto">
                                {isGenerating && <SkeletonCard isGenerating={isGenerating} />}

                                {historyImages.map((img) => (
                                    <div
                                        key={img.id}
                                        className="relative aspect-square rounded-lg overflow-hidden border border-white/[0.08] bg-[#141414] cursor-pointer group"
                                    >
                                        {/* Image - onClick opens preview */}
                                        <img
                                            src={img.thumbnail_url || img.url}
                                            alt=""
                                            loading="lazy"
                                            className="absolute inset-0 w-full h-full object-cover"
                                            onClick={() => setPreviewImage(img.url)}
                                        />

                                        {/* 3-dot menu button - top right */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === img.id ? null : img.id);
                                            }}
                                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 
                                                       opacity-0 group-hover:opacity-100 transition-opacity
                                                       flex items-center justify-center text-white/80 hover:text-white z-10"
                                        >
                                            <MoreVertical size={14} />
                                        </button>

                                        {/* Dropdown menu */}
                                        {openMenuId === img.id && (
                                            <div
                                                className="absolute top-7 right-1 bg-[#1a1a1a] border border-white/10 
                                                           rounded-md shadow-xl z-20 py-0.5 min-w-[110px]"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => handleDownload(img.url, img.id)}
                                                    className="w-full px-2 py-1.5 text-left text-xs text-white/80 
                                                               hover:bg-white/10 flex items-center gap-1.5"
                                                >
                                                    <Download size={12} />
                                                    Download
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveFromView(img.id)}
                                                    className="w-full px-2 py-1.5 text-left text-xs text-red-400 
                                                               hover:bg-white/10 flex items-center gap-1.5"
                                                >
                                                    <Trash2 size={12} />
                                                    Remove from view
                                                </button>
                                            </div>
                                        )}

                                        {/* Date Badge */}
                                        <div className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                                            {formatDateTime(img.created_at)}
                                        </div>

                                        {/* Model Badge - Top left (purple for upscale) */}
                                        <div
                                            className="absolute top-1.5 left-1.5 text-white text-[9px] font-medium px-2 py-0.5 rounded-md"
                                            style={{
                                                background: 'rgba(168, 85, 247, 0.3)',
                                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                            }}
                                        >
                                            {img.model}
                                        </div>
                                    </div>
                                ))}

                                {!isGenerating && historyImages.length === 0 && (
                                    <div className="col-span-2 py-8 text-center text-sm text-white/40">
                                        No upscaled images yet
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewImage && (
                <ImagePreviewModal
                    src={previewImage}
                    onClose={() => setPreviewImage(null)}
                />
            )}
        </div>
    );
}