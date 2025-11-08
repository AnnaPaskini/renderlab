import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { generateSingle } from "@/lib/generateSingle";

/**
 * CREATE endpoint without reference image.
 * Generates image via Replicate and saves to database.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType && !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "content-type must be application/json" },
        { status: 415 }
      );
    }

    // Проверяем авторизацию
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log('🔵 [GENERATE] User:', user?.id, 'Error:', userError);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body?.model === "string" ? body.model.trim() : undefined;

    if (!prompt)
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    if (prompt.length > 4000)
      return NextResponse.json({ error: "prompt is too long" }, { status: 413 });

    console.log('🔵 [GENERATE] Starting Replicate generation...');
    console.log('🔵 [GENERATE] Prompt:', prompt);
    console.log('🔵 [GENERATE] Model:', model || 'default (google/nano-banana)');

    // Генерируем через Replicate API
    const result = await generateSingle({
      prompt,
      model,
    });

    if (result.status !== "ok" || !result.url) {
      console.error('❌ [GENERATE] Replicate failed:', result.message);
      return NextResponse.json(
        { error: result.message || "Generation failed" },
        { status: 500 }
      );
    }

    const imageUrl = result.url;
    const timestamp = new Date().toISOString();

    console.log('✅ [GENERATE] Image generated:', imageUrl);

    // Сохраняем в базу
    const imageName = `generated_${Date.now()}_${prompt.slice(0, 30).replace(/\s+/g, '_')}`;

    console.log('🔵 [GENERATE] Inserting into DB:', {
      user_id: user.id,
      name: imageName,
      url: imageUrl,
    });

    const { error: dbError } = await supabase
      .from("images")
      .insert([{
        user_id: user.id,
        name: imageName,
        url: imageUrl,
      }]);

    console.log('🔵 [GENERATE] DB Insert result - Error:', dbError);

    if (dbError) {
      console.error('❌ [GENERATE] DB Error:', dbError);
      // Не падаем - генерация успешна, просто не сохранилась в базу
    } else {
      console.log('✅ [GENERATE] Successfully saved to DB');
    }

    return NextResponse.json({
      id: result.templateId || `gen-${Date.now()}`,
      status: "succeeded",
      output: { imageUrl },
      meta: { 
        model: model || "google/nano-banana", 
        promptLength: prompt.length, 
        generatedAt: timestamp 
      },
    });
  } catch (err: any) {
    console.error("❌ [GENERATE] error:", err);
    return NextResponse.json(
      { error: err?.message || "Generate failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}