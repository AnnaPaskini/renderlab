'use client';

import { createClient } from '@/lib/supabaseBrowser';
import { defaultToastStyle } from '@/lib/toast-config';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { HistoryGrid } from './HistoryGrid';

interface HistoryImage {
    id: string;
    thumbnail_url: string | null;
    url: string;
    prompt: string;
    created_at: string;
    model?: string;
    type?: string;
}

const PAGE_SIZE = 20;

export default function HistoryPage() {
    const router = useRouter();
    const [items, setItems] = useState<HistoryImage[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(false);

    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                console.error('❌ Not authenticated');
                router.push('/login');
                return;
            }

            setIsAuthenticated(true);
        };

        checkAuth();
    }, [router]);

    // Load page function
    const loadPage = async (nextPage: number) => {
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const from = nextPage * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from('images')
                .select('id, thumbnail_url, url, prompt, created_at, model, type')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (!data || data.length === 0) {
                if (nextPage === 0) setItems([]);
                setHasMore(false);
                return;
            }

            if (nextPage === 0) {
                setItems(data);
            } else {
                setItems(prev => [...prev, ...data]);
            }

            if (data.length < PAGE_SIZE) {
                setHasMore(false);
            }

            setPage(nextPage);
        } catch (error) {
            console.error('Failed to load history page:', error);
            toast.error('Failed to load history. Please try again.', {
                style: defaultToastStyle,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (isAuthenticated) {
            const timer = setTimeout(() => setShowSkeleton(true), 150);
            loadPage(0).finally(() => {
                clearTimeout(timer);
                setShowSkeleton(false);
            });
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="rl-ambient-bg min-h-screen pt-32 pb-12">
            {/* Header */}
            <div className="relative z-10 border-b border-white/8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">History</h1>
                        <p className="text-gray-400 mt-2">
                            Images are stored for 14 days. Please download any generations you wish to keep.
                        </p>
                    </div>
                </div>
            </div>

            {/* Images Grid (Client Component) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
                {showSkeleton && items.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="rl-skeleton" style={{ aspectRatio: '1 / 1' }} />
                        ))}
                    </div>
                ) : (
                    <HistoryGrid
                        images={items}
                        onDelete={(imageId) =>
                            setItems(prev => prev.filter(img => img.id !== imageId))
                        }
                    />
                )}

                {/* Load More Button */}
                {hasMore && (
                    <div className="flex justify-center mt-8">
                        <button
                            className="rl-btn rl-btn-secondary disabled:opacity-50"
                            disabled={isLoading}
                            onClick={() => loadPage(page + 1)}
                        >
                            {isLoading ? 'Loading...' : 'Load more'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
