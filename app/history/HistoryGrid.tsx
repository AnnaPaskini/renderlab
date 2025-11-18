'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface HistoryImage {
    id: string;
    thumbnail_url: string | null;
    prompt: string;
    created_at: string;
}

interface HistoryGridProps {
    images: HistoryImage[];
}

export function HistoryGrid({ images }: HistoryGridProps) {
    const router = useRouter();
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const handleDownload = async (img: HistoryImage) => {
        try {
            const imageUrl = img.thumbnail_url || '';
            const response = await fetch(imageUrl);
            const blob = await response.blob();
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
            toast.error('Failed to download image');
        }
    };

    const handleCopyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        toast.success('Prompt copied to clipboard');
        setOpenMenuId(null);
    };

    const handleOpenInBuild = (img: HistoryImage) => {
        router.push(`/workspace?prompt=${encodeURIComponent(img.prompt || '')}`);
        setOpenMenuId(null);
    };

    if (images.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '100px 20px',
                color: '#888'
            }}>
                <p>No images yet. Start creating in the workspace!</p>
            </div>
        );
    }

    return (
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
                        {img.thumbnail_url ? (
                            <img
                                src={img.thumbnail_url}
                                alt={img.prompt || 'Generated image'}
                                loading="lazy"
                                decoding="async"
                                style={{
                                    width: '100%',
                                    height: '300px',
                                    objectFit: 'cover',
                                    display: 'block',
                                    background: '#2a2a2a'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '300px',
                                background: '#2a2a2a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666',
                                fontSize: '14px'
                            }}>
                                No preview available
                            </div>
                        )}

                        {/* 3-dot menu */}
                        <div className="absolute top-2 right-2">
                            <button
                                onClick={() => setOpenMenuId(openMenuId === img.id ? null : img.id)}
                                className="p-2 rounded-lg hover:bg-black/50 transition-colors"
                                style={{
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="5" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
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
                                    <button
                                        onClick={() => handleOpenInBuild(img)}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                                        style={{ color: '#ccc' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 20h9" />
                                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                        </svg>
                                        Open in Build
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '15px' }}>
                        <p style={{
                            fontSize: '14px',
                            color: '#ccc',
                            marginBottom: '10px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {img.prompt || 'No prompt'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#666' }}>
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
    );
}
