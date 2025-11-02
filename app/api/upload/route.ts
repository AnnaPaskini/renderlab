// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // делаем безопасное имя
  const safeName = (file.name ?? "image").replace(/\s+/g, "_").toLowerCase();
  const fileName = `${Date.now()}_${safeName}`;

  // грузим в Storage (bucket renderlab-images)
  const { error: uploadError } = await supabase
    .storage
    .from("renderlab-images")
    .upload(fileName, file, {
      upsert: false,
      contentType: file.type || "image/png",
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // получаем публичный URL — ВАЖНО: этот вызов синхронный, без await
  const { data: publicData } = supabase
    .storage
    .from("renderlab-images")
    .getPublicUrl(fileName);

  const publicUrl = publicData.publicUrl;

  // Не пишем в БД до появления auth
  return NextResponse.json({ url: publicUrl, name: fileName });
}
