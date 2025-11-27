export const maxDuration = 60; // 60 seconds instead of default 10
import { generateSingle } from "@/lib/generateSingle";
import { createClient } from "@/lib/supabaseServer";
import { uploadImageToStorage } from '@/lib/utils/uploadToStorage';
import { NextResponse } from "next/server";

/**
 * CREATE endpoint with optional reference image support.
 * Generates image via Replicate and saves to Supabase DB.
 */
export async function POST(req: Request) {
  console.log('📥 API ROUTE START:', new Date().toISOString());

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

    // ✅ Reference image logic
    // 1. Prefer thumbnailUrl (pre-processed 1024px)
    // 2. Fallback to imageUrl/image (legacy/direct)
    let referenceImageUrl: string | null = null;
    let isThumbnail = false;

    if (typeof body?.thumbnailUrl === "string" && body.thumbnailUrl.trim()) {
      referenceImageUrl = body.thumbnailUrl.trim();
      isThumbnail = true;
    } else if (typeof body?.imageUrl === "string" && body.imageUrl.trim()) {
      referenceImageUrl = body.imageUrl.trim();
    } else if (typeof body?.image === "string" && body.image.trim()) {
      referenceImageUrl = body.image.trim();
    }

    // ✅ Style reference images array (up to 4, separate from main input)
    let styleReferenceUrls: string[] = [];
    if (Array.isArray(body?.referenceUrls)) {
      for (const refUrl of body.referenceUrls) {
        if (typeof refUrl === "string" && refUrl.trim()) {
          let url = refUrl.trim();
          // Handle base64 if needed
          if (url.startsWith('data:')) {
            const uploadedUrl = await uploadImageToStorage(
              supabase,
              url,
              user.id,
              'workspace',
              `style_ref_${Date.now()}_${Math.random().toString(36).slice(2)}.png`
            );
            if (uploadedUrl) url = uploadedUrl;
          }
          styleReferenceUrls.push(url);
        }
      }
    }
    // Backwards compatibility: single referenceUrl
    else if (typeof body?.referenceUrl === "string" && body.referenceUrl.trim()) {
      let url = body.referenceUrl.trim();
      if (url.startsWith('data:')) {
        const uploadedUrl = await uploadImageToStorage(
          supabase,
          url,
          user.id,
          'workspace',
          `style_ref_${Date.now()}.png`
        );
        if (uploadedUrl) url = uploadedUrl;
      }
      styleReferenceUrls.push(url);
    }

    console.log('📦 Body received:', {
      hasPrompt: !!prompt,
      hasThumbnail: isThumbnail,
      hasImage: !!referenceImageUrl,
      model
    });

    // Handle base64 data URLs - upload to storage first (ONLY if not using pre-uploaded thumbnail)
    if (!isThumbnail && referenceImageUrl && referenceImageUrl.startsWith('data:')) {
      console.log('⬆️ Starting image upload to Supabase...');
      const uploadStart = Date.now();
      const uploadedUrl = await uploadImageToStorage(supabase, referenceImageUrl, user.id, 'workspace', `reference_${Date.now()}.png`);
      if (uploadedUrl) {
        referenceImageUrl = uploadedUrl;
        console.log(`✅ Upload complete in ${Date.now() - uploadStart}ms: ${uploadedUrl}`);
      } else {
        console.error("❌ [STORAGE] Failed to upload reference image");
        return NextResponse.json({ error: "Failed to upload reference image" }, { status: 500 });
      }
    }

    console.log("🔵 [GENERATE] Prompt:", prompt);
    console.log("🔵 [GENERATE] Model:", model || "default");
    console.log("🔵 [GENERATE] Input Image:", referenceImageUrl || "none");
    console.log("🔵 [GENERATE] Style References:", styleReferenceUrls.length);

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    // ✅ Generate via Replicate (uses referenceImageUrl which is now the thumbnail if available)
    console.log('🤖 Starting Replicate generation...');
    const genStart = Date.now();
    const result = await generateSingle({
      prompt,
      model,
      imageUrl: referenceImageUrl,
      styleReferenceUrls,
    });
    console.log(`✅ Generation complete in ${Date.now() - genStart}ms`);

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
      supabase,
      replicateUrl,
      user.id,
      'history',
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
    // const thumbnailUrl = `${permanentUrl}?width=512&quality=80&format=webp`;

    // ✅ Save to DB (Result ONLY, as requested)
    const { data: newImage, error: dbError } = await supabase
      .from("images")
      .insert([
        {
          user_id: user.id,
          name: imageName,
          prompt: prompt, // ✅ Save the actual prompt text
          url: permanentUrl, // ✅ Use permanent Supabase Storage URL
          thumbnail_url: null, // Will be set by generate-thumbnail
          // reference_url: referenceImageUrl || null, // ❌ Do NOT save input image
          model: model, // ✅ Save the AI model used (no default override)
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
