import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { WorkspaceClient } from './WorkspaceClient';

interface PreviewImage {
  id: string;
  thumbnail_url: string | null;
  url: string;
  created_at: string;
}

export default async function WorkspacePage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ Not authenticated');
    redirect('/login');
  }

  // Load preview strip data from server
  const { data: previewImages } = await supabase
    .from('images')
    .select('id, thumbnail_url, url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  const images: PreviewImage[] = previewImages || [];

  return <WorkspaceClient initialPreviewImages={images} />;
}