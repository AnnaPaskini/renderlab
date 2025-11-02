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

    // === Подключаем Replicate ===
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      throw new Error("Missing REPLICATE_API_TOKEN in .env.local");
    }

    console.log("🎨 Starting inpainting via Replicate...");

    // === Запрос к Replicate API ===
    const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-inpaint/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: prompt || "restore and blend seamlessly",
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Replicate error:", result);
      return NextResponse.json({ error: result }, { status: 500 });
    }

    console.log("✅ Inpaint request sent to Replicate");

    return NextResponse.json({
      success: true,
      replicateUrl: result.urls?.get,
      status: result.status,
    });
  } catch (error: any) {
    console.error("🔥 Edit route error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
