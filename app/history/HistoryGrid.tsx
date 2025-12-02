'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import ImagePreviewModal from '@/components/workspace/ImagePreviewModal';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpCircle, Eye, MoreVertical, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface HistoryImage {
    id: string;
    thumbnail_url: string | null;
    url: string;
    prompt: string;
    created_at: string;
    model?: string;
    type?: string;
}

interface HistoryGridProps {
    images: HistoryImage[];
    onDelete?: (imageId: string) => void;
}

export function HistoryGrid({ images, onDelete }: HistoryGridProps) {
    const router = useRouter();
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<HistoryImage | null>(null);

    const handleDownload = async (img: HistoryImage) => {
        try {
            const imageUrl = img.url || img.thumbnail_url || '';

            // Fetch with no-cors mode for external URLs
            const response = await fetch(imageUrl, {
                mode: 'cors',
                credentials: 'omit',
            });

            // Check if response is valid image (not redirect/error)
            const contentType = response.headers.get('content-type');
            if (!response.ok || !contentType?.startsWith('image/')) {
                // Fallback: open in new tab for manual download
                window.open(imageUrl, '_blank');
                toast.success('Opening image in new tab');
                setOpenMenuId(null);
                return;
            }

            const blob = await response.blob();

            // Verify blob size (39 bytes = error response)
            if (blob.size < 1000) {
                window.open(imageUrl, '_blank');
                toast.success('Opening image in new tab');
                setOpenMenuId(null);
                return;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `renderlab-${img.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Downloaded successfully');
            setOpenMenuId(null);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: open in new tab
            const imageUrl = img.url || img.thumbnail_url || '';
            if (imageUrl) {
                window.open(imageUrl, '_blank');
                toast.success('Opening image in new tab');
            } else {
                toast.error('Failed to download image');
            }
            setOpenMenuId(null);
        }
    };

    const handleCopyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        toast.success('Prompt copied to clipboard');
        setOpenMenuId(null);
    };

    const handleEditInpaint = (img: HistoryImage) => {
        // Take full URL, NOT thumbnail
        const fullUrl = img.url;
        // Add safe flag: if url contains ? → add &download=1, if not → ?download=1
        const safeUrl = fullUrl + (fullUrl.includes('?') ? '&download=1' : '?download=1');
        // Redirect: /inpaint?image=<encodeURIComponent(fullUrl)>
        router.push(`/inpaint?image=${encodeURIComponent(safeUrl)}`);
        setOpenMenuId(null);
    };

    const handleDeleteImage = async (img: HistoryImage) => {
        try {
            const response = await fetch(`/api/images/${img.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete image');
            }

            toast.success('Image deleted from history');
            setDeleteDialogOpen(false);
            setImageToDelete(null);
            setOpenMenuId(null);

            // Update UI immediately
            if (onDelete) {
                onDelete(img.id);
            }
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete image');
        }
    };

    const openDeleteDialog = (img: HistoryImage) => {
        setImageToDelete(img);
        setDeleteDialogOpen(true);
        setOpenMenuId(null);
    };

    if (images.length === 0) {
        return (
            <div className="text-center py-24 px-5 text-purple-400/70">
                <p>No images yet. Start creating in the workspace!</p>
            </div>
        );
    }

    return (
        <>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {images.map((img) => (
                    <div
                        key={img.id}
                        className="group relative"
                        style={{
                            background: '#1a1a1a',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid #333'
                        }}
                    >
                        {/* Image */}
                        <div style={{ position: 'relative' }}>
                            {(img.thumbnail_url || img.url) ? (
                                <img
                                    src={img.thumbnail_url || img.url}
                                    alt={img.prompt || 'Generated image'}
                                    loading="lazy"
                                    decoding="async"
                                    style={{
                                        width: '100%',
                                        height: '300px',
                                        objectFit: 'cover',
                                        display: 'block',
                                        background: '#2a2a2a',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedImageIndex(images.findIndex(i => i.id === img.id))}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '300px',
                                    background: '#2a2a2a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px'
                                }} className="text-purple-400/70">
                                    No preview available
                                </div>
                            )}

                            {/* Date Badge - bottom left */}
                            <div className="absolute bottom-1.5 left-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                                {new Date(img.created_at).toLocaleDateString('en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: '2-digit'
                                })}
                            </div>

                            {/* Model Badge - top left (purple for upscale, orange for generation) */}
                            {img.model && (
                                <div
                                    className="absolute top-1.5 left-1.5 text-white text-[10px] font-medium px-2 py-0.5 rounded-md"
                                    style={{
                                        background: img.type === 'upscale'
                                            ? 'rgba(168, 85, 247, 0.3)'
                                            : 'rgba(255, 107, 53, 0.6)',
                                        border: img.type === 'upscale'
                                            ? '1px solid rgba(168, 85, 247, 0.3)'
                                            : '1px solid rgba(255, 107, 53, 0.3)',
                                        maxWidth: 'calc(50% - 8px)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {img.model}
                                </div>
                            )}

                            {/* 3-dot menu */}
                            <button
                                onClick={() => setOpenMenuId(openMenuId === img.id ? null : img.id)}
                                className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 bg-gray-700/80 backdrop-blur-sm rounded-lg text-white hover:bg-gray-800/90 transition"
                            >
                                <MoreVertical className="w-4 h-4 text-white" />
                            </button>
                            <div className="absolute top-2 right-2" style={{ pointerEvents: 'none', visibility: 'hidden' }}>

                            </div>
                            {/* Dropdown Menu */}
                            <div className="absolute top-12 right-3">
                                {openMenuId === img.id && (
                                    <div
                                        className="absolute right-0 mt-2 rounded-lg overflow-hidden shadow-xl z-10"
                                        style={{
                                            background: '#1a1a1a',
                                            border: '1px solid #333',
                                            minWidth: '180px'
                                        }}
                                    >
                                        <button
                                            onClick={() => handleDownload(img)}
                                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                                            style={{ color: '#ccc' }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            Download
                                        </button>
                                        {img.type !== 'upscale' && (
                                            <button
                                                onClick={() => handleCopyPrompt(img.prompt || '')}
                                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                                                style={{ color: '#ccc' }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                                Copy Prompt
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEditInpaint(img)}
                                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                                            style={{ color: '#ccc' }}
                                        >
                                            <Eye size={16} />
                                            Edit (Inpaint)
                                        </button>
                                        <button
                                            onClick={() => {
                                                const imageUrl = img.url || img.thumbnail_url || '';
                                                router.push(`/upscale?image=${encodeURIComponent(imageUrl)}`);
                                                setOpenMenuId(null);
                                            }}
                                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                                            style={{ color: '#ccc' }}
                                        >
                                            <ArrowUpCircle size={16} />
                                            Upscale
                                        </button>
                                        <button
                                            onClick={() => openDeleteDialog(img)}
                                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                            style={{ color: '#ee6161ff' }}
                                        >
                                            <Trash2 size={16} />
                                            Delete from History
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div style={{ padding: '15px' }}>
                            <p className="text-sm text-gray-200 mb-2.5 line-clamp-2">
                                {img.type === 'upscale' ? 'Upscaled image' : (img.prompt || 'No prompt')}
                            </p>
                            <p className="text-xs text-purple-400/70">
                                {new Date(img.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {selectedImageIndex !== null && (
                    <ImagePreviewModal
                        src={images[selectedImageIndex!]?.url || images[selectedImageIndex!]?.thumbnail_url || ''}
                        onClose={() => setSelectedImageIndex(null)}
                        images={images.map(img => ({ id: img.id, url: img.url }))}
                        currentIndex={selectedImageIndex!}
                        onNavigate={setSelectedImageIndex}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px] border border-white/10 shadow-xl backdrop-blur-md bg-[#101014]">
                    <DialogHeader>
                        <DialogTitle>Delete from History</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this image from your History?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            onClick={() => setDeleteDialogOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => imageToDelete && handleDeleteImage(imageToDelete)}
                            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
