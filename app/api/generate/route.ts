import { generateSingle } from "@/lib/generateSingle";
import { createClient } from "@/lib/supabaseServer";
import { uploadImageToStorage } from '@/lib/utils/uploadToStorage';
import { NextResponse } from "next/server";

/**
 * CREATE endpoint with optional reference image support.
 * Generates image via Replicate and saves to Supabase DB.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "content-type must be application/json" },
        { status: 415 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body?.model === "string" ? body.model.trim() : undefined;

    // ✅ Reference image
    let referenceImageUrl: string | null = null;
    if (typeof body?.imageUrl === "string" && body.imageUrl.trim()) {
      referenceImageUrl = body.imageUrl.trim();
    } else if (typeof body?.image === "string" && body.image.trim()) {
      referenceImageUrl = body.image.trim();
    }

    console.log("🔵 [GENERATE] Prompt:", prompt);
    console.log("🔵 [GENERATE] Model:", model || "default");
    console.log("🔵 [GENERATE] Reference:", referenceImageUrl || "none");

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // ✅ Generate via Replicate
    const result = await generateSingle({
      prompt,
      model,
      imageUrl: referenceImageUrl,
    });

    if (result.status !== "ok" || !result.url) {
      console.error("❌ [GENERATE] Replicate failed:", result.message);
      return NextResponse.json(
        { error: result.message || "Generation failed" },
        { status: 500 }
      );
    }

    const replicateUrl = result.url;
    const timestamp = new Date().toISOString();
    const imageName = `generated_${Date.now()}_${prompt
      .slice(0, 30)
      .replace(/\s+/g, "_")}`;

    // Upload to permanent storage
    console.log("🔵 [STORAGE] Uploading to Supabase Storage:", replicateUrl);
    const permanentUrl = await uploadImageToStorage(
      replicateUrl,
      user.id,
      `generated_${Date.now()}.png`
    );

    if (!permanentUrl) {
      console.error("❌ [STORAGE] Failed to upload image to storage");
      return NextResponse.json(
        { error: "Failed to upload image to storage" },
        { status: 500 }
      );
    }

    console.log("✅ [STORAGE] Uploaded successfully:", permanentUrl);
    console.log("🔵 [DB INSERT] referenceImageUrl =", referenceImageUrl);

    // Generate thumbnail URL using Supabase Transform API
    const thumbnailUrl = `${permanentUrl}?width=512&quality=80&format=webp`;

    // ✅ Save to DB with reference_url and prompt
    const { data: newImage, error: dbError } = await supabase
      .from("images")
      .insert([
        {
          user_id: user.id,
          name: imageName,
          prompt: prompt, // ✅ Save the actual prompt text
          url: permanentUrl, // ✅ Use permanent Supabase Storage URL
          thumbnail_url: thumbnailUrl,
          reference_url: referenceImageUrl || null,
          created_at: timestamp,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("❌ [DB ERROR]", dbError);
    } else {
      console.log("✅ [DB SAVED] Image + Reference URL inserted");

      // ✅ Generate thumbnail asynchronously (don't wait)
      if (newImage) {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-thumbnail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: permanentUrl,
            imageId: newImage.id
          })
        }).catch(err => console.error('❌ Thumbnail generation failed:', err));
      }
    }

    return NextResponse.json({
      id: `gen-${Date.now()}`,
      status: "succeeded",
      output: { imageUrl: permanentUrl },
      meta: {
        model: model || "google/nano-banana",
        promptLength: prompt.length,
        reference_url: referenceImageUrl || null,
        generatedAt: timestamp,
      },
    });
  } catch (err: any) {
    console.error("❌ [GENERATE ERROR]", err);
    return NextResponse.json(
      { error: err?.message || "Generate failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
