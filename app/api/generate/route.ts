// app/api/generate/route.ts
import { NextResponse } from "next/server";

/**
 * CREATE генерация без референса.
 * Сейчас — безопасная заглушка: принимает prompt/model и возвращает валидный URL картинки.
 * Позже сюда воткнём реальную интеграцию (Replicate/Flux/etc).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, model } = body ?? {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    // Простой «seed» для детерминированного URL (без Node crypto)
    const seedBase = `${prompt.slice(0, 64)}::${model || "default"}::${Date.now()}`;
    const seed = encodeURIComponent(seedBase.replace(/\s+/g, "-"));

    // Заглушка: валидный URL, чтобы фронт показал превью
    const generatedUrl = `https://picsum.photos/seed/${seed}/1024/768`;

    console.log("[GENERATE] model:", model || "(default)", " prompt.len:", prompt.length);

    // Отдаём формат, который твой фронт уже понимает
    return NextResponse.json({
      success: true,
      result: generatedUrl,   // фронт читает result/publicUrl/url/…
      meta: { model: model || "default", promptLength: prompt.length },
    });
  } catch (err: any) {
    console.error("[GENERATE] error:", err);
    return NextResponse.json(
      { error: err?.message || "Generate failed" },
      { status: 500 }
    );
  }
}
