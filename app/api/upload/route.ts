import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from("renderlab-images")
      .upload(fileName, file, { upsert: false });

    if (error) throw error;

    const { data: publicUrl } = supabase.storage
      .from("renderlab-images")
      .getPublicUrl(fileName);

    return NextResponse.json({
      status: "succeeded",
      output: { publicUrl: publicUrl.publicUrl },
    });
  } catch (err: any) {
    console.error("[UPLOAD] error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
