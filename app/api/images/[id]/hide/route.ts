import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { hidden } = body;

    // Verify ownership
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !image) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    if (image.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update hidden status
    const { error: updateError } = await supabase
      .from('images')
      .update({ hidden_from_preview: hidden })
      .eq('id', id);

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true,
      message: hidden ? 'Hidden from preview' : 'Restored to preview'
    });

  } catch (error: any) {
    console.error('Hide/unhide error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
