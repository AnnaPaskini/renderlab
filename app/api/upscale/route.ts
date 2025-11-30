import { createClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MODELS = {
  "recraft-crisp": "recraft-ai/recraft-crisp-upscale",
  "real-esrgan": "nightmareai/real-esrgan:350d32041630ffbe63c8352783a26d94f5e86a6343ac71e52422f6a684154e4e",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, model } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    if (!model || !MODELS[model as keyof typeof MODELS]) {
      return NextResponse.json({ error: "Invalid model" }, { status: 400 });
    }

    console.log(`🔍 Upscaling with ${model}:`, imageUrl);

    const modelId = MODELS[model as keyof typeof MODELS];

    let output: any;

    if (model === "recraft-crisp") {
      output = await replicate.run(modelId as `${string}/${string}`, {
        input: {
          image: imageUrl,
        },
      });
    } else if (model === "real-esrgan") {
      output = await replicate.run(modelId as `${string}/${string}:${string}`, {
        input: {
          image: imageUrl,
          scale: 4,
          face_enhance: false,
        },
      });
    }

    console.log("✅ Upscale output:", output);

    const outputUrl = typeof output === "string" ? output : output?.[0] || output?.output;

    if (!outputUrl) {
      return NextResponse.json({ error: "Upscale failed - no output" }, { status: 500 });
    }

    // Save to history with type 'upscale'
    const { error: insertError } = await supabase.from("images").insert({
      user_id: user.id,
      url: outputUrl,
      thumbnail_url: outputUrl,
      reference_url: imageUrl,
      model: model,
      type: "upscale",
    });

    if (insertError) {
      console.error("Failed to save to history:", insertError);
    }

    return NextResponse.json({
      status: "succeeded",
      output: {
        imageUrl: outputUrl,
      },
    });
  } catch (error) {
    console.error("Upscale error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upscale failed" },
      { status: 500 }
    );
  }
}