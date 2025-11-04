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

    console.log("[EDIT] Sending inpaint request via google/nano-banana...");

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "google/nano-banana", // название модели
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: prompt || "restore and blend seamlessly",
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[EDIT] Replicate error:", result);
      return NextResponse.json({ error: result }, { status: 500 });
    }

    console.log("[EDIT] Request accepted by Replicate");

    return NextResponse.json({
      success: true,
      replicateUrl: result.urls?.get,
      status: result.status,
    });
  } catch (error: any) {
    console.error("[EDIT] Route error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
