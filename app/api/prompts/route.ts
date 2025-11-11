import { NextRequest, NextResponse } from 'next/server';
import { getPrompts } from '@/lib/db/prompts';
import type { PromptFilters, PromptCategory, PromptBadge } from '@/lib/types/prompts';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Validate category
    const categoryParam = searchParams.get('category');
    const validCategories: PromptCategory[] = ['exterior', 'interior', 'lighting', 'materials', 'atmosphere'];
    const category = categoryParam && validCategories.includes(categoryParam as PromptCategory)
      ? categoryParam as PromptCategory
      : undefined;
    
    // Validate badge
    const badgeParam = searchParams.get('badge');
    const validBadges: PromptBadge[] = ['featured', 'editors_choice', 'trending'];
    const badge = badgeParam && validBadges.includes(badgeParam as PromptBadge)
      ? badgeParam as PromptBadge
      : undefined;
    
    const filters: PromptFilters = {
      category,
      badge,
      search: searchParams.get('search') || undefined,
    };

    const prompts = await getPrompts(filters);

    return NextResponse.json({ 
      success: true, 
      data: prompts 
    });

  } catch (error: any) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
