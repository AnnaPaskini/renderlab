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
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0a',
            color: 'white',
            padding: '40px 20px'
        }}>
            {/* Header */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>History</h1>
                <p style={{ color: '#888' }}>
                    {images.length} images loaded
                </p>
            </div>

            {/* Images Grid (Client Component) */}
            <HistoryGrid images={images} />
        </div>
    );
}
