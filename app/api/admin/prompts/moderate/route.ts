import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { approvePrompt, rejectPrompt } from '@/lib/db/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { prompt_id, action, badge } = body;

    if (!prompt_id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Validate badge if provided
    if (badge && !['featured', 'editors_choice', 'trending'].includes(badge)) {
      return NextResponse.json(
        { success: false, error: 'Invalid badge type' },
        { status: 400 }
      );
    }

    // Execute action atomically
    if (action === 'approve') {
      await approvePrompt(prompt_id, badge);
    } else if (action === 'reject') {
      await rejectPrompt(prompt_id);
    }

    return NextResponse.json({ 
      success: true,
      message: `Prompt ${action}ed successfully` 
    });

  } catch (error: any) {
    console.error('Error moderating prompt:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
