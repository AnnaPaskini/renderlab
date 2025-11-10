import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

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

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("renderlab-images")
      .upload(fileName, file, { upsert: false });
    
    console.log('🔵 [UPLOAD] Storage upload:', data, 'Error:', error);
    
    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("renderlab-images")
      .getPublicUrl(fileName);
    const publicUrl = publicUrlData?.publicUrl;

    console.log('🔵 [UPLOAD] Public URL:', publicUrl);
    console.log('🔵 [UPLOAD] Inserting into DB:', { user_id: user.id, name: fileName, url: publicUrl });

    const { data: newImage, error: dbError } = await supabase
      .from("images")
      .insert([{ user_id: user.id, name: fileName, url: publicUrl }])
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
          imageUrl: publicUrl,
          imageId: newImage.id
        })
      }).catch(err => console.error('❌ Thumbnail generation failed:', err));
    }

    return NextResponse.json({
      status: "succeeded",
      output: { publicUrl },
    });
  } catch (err: any) {
    console.error("❌ [UPLOAD] error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}