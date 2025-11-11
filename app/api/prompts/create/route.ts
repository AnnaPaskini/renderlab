import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { createPrompt } from '@/lib/db/prompts';
import type { CreatePromptInput, PromptCategory } from '@/lib/types/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as CreatePromptInput;

    // Validate title
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const title = body.title.trim();
    if (title.length < 10 || title.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Title must be between 10 and 100 characters' },
        { status: 400 }
      );
    }

    // Validate prompt
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt text is required' },
        { status: 400 }
      );
    }

    const prompt = body.prompt.trim();
    if (prompt.length < 50 || prompt.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Prompt must be between 50 and 2000 characters' },
        { status: 400 }
      );
    }

    // Validate image URL
    if (!body.image_url || typeof body.image_url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Image is required' },
        { status: 400 }
      );
    }

    // Check it's a valid Supabase Storage URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured');
    }

    const expectedPattern = new RegExp(
      `^${supabaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/storage/v1/object/public/prompt-images/`
    );

    if (!expectedPattern.test(body.image_url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image URL. Please upload image to our storage first.' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories: PromptCategory[] = ['exterior', 'interior', 'lighting', 'materials', 'atmosphere'];
    if (!body.category || !validCategories.includes(body.category)) {
      return NextResponse.json(
        { success: false, error: 'Valid category is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize tags
    let tags: string[] = [];
    if (body.tags) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json(
          { success: false, error: 'Tags must be an array' },
          { status: 400 }
        );
      }

      if (body.tags.length > 10) {
        return NextResponse.json(
          { success: false, error: 'Maximum 10 tags allowed' },
          { status: 400 }
        );
      }

      // Sanitize tags: lowercase, alphanumeric + hyphens only
      tags = body.tags
        .map(tag => String(tag).trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length <= 30)
        .filter(tag => /^[a-z0-9-]+$/.test(tag))
        .slice(0, 10);

      if (tags.length === 0) {
        return NextResponse.json(
          { success: false, error: 'At least one valid tag is required' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Tags are required' },
        { status: 400 }
      );
    }

    // Create prompt with validated data
    const promptData: CreatePromptInput = {
      title,
      prompt,
      image_url: body.image_url,
      category: body.category,
      tags
    };

    const newPrompt = await createPrompt(promptData, user.id);

    return NextResponse.json({ 
      success: true, 
      data: newPrompt,
      message: 'Prompt submitted for review. You will be notified once approved.' 
    });

  } catch (error: any) {
    console.error('Error creating prompt:', error);
    
    if (error.message.includes('5 pending prompts') || error.message.includes('Please wait for approval')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 429 }
      );
    }

    if (error.message.includes('profile')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create prompt' },
      { status: 500 }
    );
  }
}
