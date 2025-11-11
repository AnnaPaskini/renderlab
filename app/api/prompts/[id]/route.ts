import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership and pending status
    const { data: prompt, error: fetchError } = await supabase
      .from('prompts')
      .select('id, user_id, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt not found' },
        { status: 404 }
      );
    }

    if (prompt.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Only allow deleting pending prompts
    if (prompt.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Can only delete pending prompts' },
        { status: 400 }
      );
    }

    // Delete prompt
    const { error: deleteError } = await supabase
      .from('prompts')
      .delete()
      .eq('id', params.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ 
      success: true,
      message: 'Prompt deleted successfully' 
    });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
