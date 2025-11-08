import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { imageUrl, maskUrl, prompt, baseImageUrl } = await req.json();

    if (!imageUrl || !maskUrl) {
      return NextResponse.json(
        { error: "Missing image or mask" },
        { status: 400 }
      );
    }

    // Проверяем авторизацию
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      throw new Error("Missing REPLICATE_API_TOKEN in .env.local");
    }

    console.log("[EDIT] Creating Replicate prediction with google/nano-banana...");
    console.log("[EDIT] Base Image URL:", baseImageUrl || imageUrl);

    // 1. Создаем задачу генерации
    const create = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "google/nano-banana",
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: prompt || "restore and blend seamlessly",
        },
      }),
    });

    const prediction = await create.json();

    if (!create.ok) {
      console.error("[EDIT] Replicate creation error:", prediction);
      return NextResponse.json({ error: prediction }, { status: 500 });
    }

    const getUrl = prediction.urls?.get;
    if (!getUrl) {
      throw new Error("No polling URL returned by Replicate");
    }

    // 2. Polling — ждем, пока задача завершится
    let result = prediction;
    const maxAttempts = 50; // максимум 50 проверок (50 секунд)
    let attempt = 0;

    while (
      result.status !== "succeeded" &&
      result.status !== "failed" &&
      attempt < maxAttempts
    ) {
      await new Promise((r) => setTimeout(r, 1000));
      const poll = await fetch(getUrl, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      });
      result = await poll.json();
      attempt++;
    }

    if (result.status !== "succeeded") {
      throw new Error(`Generation failed or timed out: ${result.status}`);
    }

    console.log("[EDIT] Replicate generation succeeded");

    const outputUrl = result.output?.[0] || null;

    // 3. Сохраняем в базу
    if (outputUrl) {
      const imageName = `edited_${Date.now()}_${prompt?.slice(0, 30).replace(/\s+/g, '_') || 'inpaint'}`;
      const referenceUrl = baseImageUrl || imageUrl;

      const { error: dbError } = await supabase
        .from("images")
        .insert([{
          user_id: user.id,
          name: imageName,
          url: outputUrl,
          reference_url: referenceUrl,
        }]);

      if (dbError) {
        console.error("[EDIT] DB Error:", dbError);
      } else {
        console.log("[EDIT] Successfully saved to DB with reference_url:", referenceUrl);
      }
    }

    // 4. Возвращаем финальный результат
    return NextResponse.json({
      success: true,
      output: outputUrl,
      status: result.status,
    });
  } catch (error: any) {
    console.error("[EDIT] Route error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
