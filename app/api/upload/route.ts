import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  console.log('🔵 [UPLOAD] Route called');
  
  try {
    const supabase = createClient();
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

    const { error: dbError } = await supabase
      .from("images")
      .insert([{ user_id: user.id, name: fileName, url: publicUrl }]);
    
    console.log('🔵 [UPLOAD] DB Insert result - Error:', dbError);
    
    if (dbError) throw dbError;

    console.log('✅ [UPLOAD] Success!');

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