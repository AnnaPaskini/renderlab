import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { HistoryGrid } from './HistoryGrid';

interface HistoryImage {
    id: string;
    thumbnail_url: string | null;
    url: string;
    prompt: string;
    created_at: string;
}

export default async function HistoryPage() {
    console.time('⏱️ SERVER: Load History');

    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('❌ Not authenticated');
        redirect('/login');
    }

    // Fetch user's images (server-side, ONE database call)
    const { data, error } = await supabase
        .from('images')
        .select('id, thumbnail_url, url, prompt, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

    console.timeEnd('⏱️ SERVER: Load History');

    if (error) {
        console.error('❌ Error loading images:', error);
    }

    const images: HistoryImage[] = data || [];

    console.log('✅ Loaded images:', images.length);

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
                <HistoryGrid images={images} />
            </div>
        </div>
    );
}
