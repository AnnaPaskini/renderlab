

import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log('🔵 [UPLOAD] Route called');

  try {
    const supabase = await createClient();
    console.log('🔵 [UPLOAD] Supabase client created');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log('🔵 [UPLOAD] User:', user?.id, 'Error:', userError);

    if (userError || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    console.log('🔵 [UPLOAD] File received:', file?.name);

    if (!file)
      return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // MIME validation
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Only PNG, JPEG, and WebP are allowed.` },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const fileExt = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'png';
    const fileName = `${timestamp}.${fileExt}`;
    const filePath = `${user.id}/history/${fileName}`;

    const { data, error } = await supabase.storage
      .from("renderlab-images-v2")
      .upload(filePath, file, { upsert: false });

    console.log('🔵 [UPLOAD] Storage upload:', data, 'Error:', error);

    if (error) throw error;

    const { data: signedData, error: signedError } = await supabase.storage
      .from("renderlab-images-v2")
      .createSignedUrl(filePath, 3600); // 1 hour

    if (signedError) throw signedError;

    const signedUrl = signedData.signedUrl;

    console.log('🔵 [UPLOAD] Signed URL:', signedUrl);
    console.log('🔵 [UPLOAD] Inserting into DB:', { user_id: user.id, name: fileName, url: signedUrl });

    const { data: newImage, error: dbError } = await supabase
      .from("images")
      .insert([{ user_id: user.id, name: fileName, url: signedUrl }])
      .select()
      .single();

    console.log('🔵 [UPLOAD] DB Insert result - Error:', dbError);

    if (dbError) throw dbError;

    console.log('✅ [UPLOAD] Success!');

    // ✅ Generate thumbnail asynchronously (don't wait)
    if (newImage) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-thumbnail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: signedUrl,
          imageId: newImage.id
        })
      }).catch(err => console.error('❌ Thumbnail generation failed:', err));
    }

    return NextResponse.json({
      status: "succeeded",
      output: { publicUrl: signedUrl },
    });
  } catch (err: any) {
    console.error("❌ [UPLOAD] error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}