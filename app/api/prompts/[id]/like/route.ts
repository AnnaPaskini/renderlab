import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { togglePromptLike } from '@/lib/db/prompts';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify prompt exists and is approved
    const { data: prompt, error: promptError } = await supabase
      .from('prompts')
      .select('id, status')
      .eq('id', id)
      .single();

    if (promptError || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      );
    }

    if (prompt.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Cannot like pending or rejected prompts' },
        { status: 403 }
      );
    }

    const result = await togglePromptLike(id, user.id);

    return NextResponse.json({ 
      success: true, 
      data: result 
    });

  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
