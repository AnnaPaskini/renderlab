import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { HistoryGrid } from './HistoryGrid';

interface HistoryImage {
    id: string;
    thumbnail_url: string | null;
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
        .select('id, thumbnail_url, prompt, created_at')
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
        <div className="min-h-screen text-white pt-32 pb-12 px-5">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-10">
                <h1 className="text-3xl font-bold mb-2.5">History</h1>
                <p className="text-gray-500">
                    {images.length} images loaded
                </p>
            </div>

            {/* Images Grid (Client Component) */}
            <HistoryGrid images={images} />
        </div>
    );
}
