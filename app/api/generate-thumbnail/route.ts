import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Retry helper with exponential backoff
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    console.warn(`Retrying thumbnail upload (${3 - retries + 1}/3)...`);
    await new Promise(r => setTimeout(r, delay));
    return retry(fn, retries - 1, delay * 2); // Exponential backoff
  }
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageId } = await request.json();

    if (!imageUrl || !imageId) {
      return NextResponse.json(
        { error: 'Missing imageUrl or imageId' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get authenticated user or fallback to 'public'
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? 'public';
    const path = `thumbs/${userId}/${imageId}.webp`;

    // Fetch оригинальное изображение
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize до 400x400 WebP with optimizations
    const thumbnailBuffer = await sharp(buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center',
        kernel: sharp.kernel.lanczos3 // Better quality scaling
      })
      .webp({
        quality: 75, // Slightly higher quality
        effort: 4    // Balance between size and encoding speed
      })
      .toBuffer();

    // Upload with retry logic (3 attempts)
    await retry(async () => {
      const { error: uploadError } = await supabase.storage
        .from('renderlab-images')
        .upload(path, thumbnailBuffer, {
          contentType: 'image/webp',
          upsert: true
        });
      if (uploadError) throw uploadError;
    });

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('renderlab-images')
      .getPublicUrl(path);

    // Обновляем запись в БД
    const { error: updateError } = await supabase
      .from('images')
      .update({ thumbnail_url: publicUrl })
      .eq('id', imageId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      thumbUrl: publicUrl
    });

  } catch (error: any) {
    console.error('Thumbnail generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}