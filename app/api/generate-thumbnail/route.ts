import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageId } = await request.json();

    if (!imageUrl || !imageId) {
      return NextResponse.json(
        { error: 'Missing imageUrl or imageId' },
        { status: 400 }
      );
    }

    // Fetch оригинальное изображение
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize до 400x400 WebP
    const thumbnailBuffer = await sharp(buffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 70 })
      .toBuffer();

    // Upload в Supabase Storage
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const thumbnailPath = `thumbs/${imageId}.webp`;

    const { error: uploadError } = await supabase.storage
      .from('renderlab-images')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('renderlab-images')
      .getPublicUrl(thumbnailPath);

    // Обновляем запись в БД
    const { error: updateError } = await supabase
      .from('images')
      .update({ thumb_url: publicUrl })
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