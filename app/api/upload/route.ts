import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// === Обрабатываем POST-запрос с файлом ===
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // === Уникальное имя файла ===
    const fileName = `${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // === Загрузка в Supabase bucket ===
    const { data, error } = await supabase.storage
      .from("renderlab-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // === Получаем публичный URL ===
    const { data: publicUrlData } = supabase.storage
      .from("renderlab-images")
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      fileName,
      publicUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
