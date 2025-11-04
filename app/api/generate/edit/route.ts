import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { imageUrl, maskUrl, prompt } = await req.json();

    if (!imageUrl || !maskUrl) {
      return NextResponse.json(
        { error: "Missing image or mask" },
        { status: 400 }
      );
    }

    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      throw new Error("Missing REPLICATE_API_TOKEN in .env.local");
    }

    console.log("[EDIT] Creating Replicate prediction with google/nano-banana...");

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

    // 3. Возвращаем финальный результат
    return NextResponse.json({
      success: true,
      output: result.output?.[0] || null,
      status: result.status,
    });
  } catch (error: any) {
    console.error("[EDIT] Route error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
