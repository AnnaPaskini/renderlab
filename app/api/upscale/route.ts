import { createClient } from "@/lib/supabaseServer";
import { uploadImageToStorage } from "@/lib/utils/uploadToStorage";
import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MODELS = {
  "recraft-crisp": "recraft-ai/recraft-crisp-upscale",
  "real-esrgan": "nightmareai/real-esrgan",
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
      output = await replicate.run(modelId as `${string}/${string}`, {
        input: {
          image: imageUrl,
          scale: 4,
          face_enhance: false,
        },
      });
    }

    console.log("✅ Upscale raw output:", output);

    // Handle FileOutput from Replicate - call .url() to get the URL
    let tempUrl: string | null = null;

    if (output && typeof output.url === "function") {
      tempUrl = output.url();
    } else if (typeof output === "string") {
      tempUrl = output;
    } else if (Array.isArray(output)) {
      const first = output[0];
      tempUrl = typeof first?.url === "function" ? first.url() : first;
    } else if (output && typeof output === "object") {
      tempUrl = output.output || output.url || output.image || null;
    }

    // Handle URL object
    if (tempUrl && typeof tempUrl === "object" && "href" in tempUrl) {
      tempUrl = (tempUrl as URL).href;
    }

    console.log("✅ Temp URL from Replicate:", tempUrl);

    if (!tempUrl) {
      return NextResponse.json({ error: "Upscale failed - no output" }, { status: 500 });
    }

    // Upload to Supabase Storage using existing utility
    const permanentUrl = await uploadImageToStorage(
      supabase,
      tempUrl,
      user.id,
      "workspace", // context - using workspace for upscale results
      `upscale-${Date.now()}.png`
    );

    if (!permanentUrl) {
      return NextResponse.json({ error: "Failed to save image to storage" }, { status: 500 });
    }

    console.log("✅ Permanent URL:", permanentUrl);

    // Save to database with type 'upscale'
    const { error: insertError } = await supabase.from("images").insert({
      user_id: user.id,
      url: permanentUrl,
      thumbnail_url: permanentUrl,
      reference_url: imageUrl,
      model: model,
      type: "upscale",
    });

    if (insertError) {
      console.error("❌ Failed to save to database:", insertError);
    }

    return NextResponse.json({
      status: "succeeded",
      output: {
        imageUrl: permanentUrl,
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
