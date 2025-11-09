import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { generateSingle } from "@/lib/generateSingle";

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

    const imageUrl = result.url;
    const timestamp = new Date().toISOString();
    const imageName = `generated_${Date.now()}_${prompt
      .slice(0, 30)
      .replace(/\s+/g, "_")}`;

    console.log("🔵 [DB INSERT] referenceImageUrl =", referenceImageUrl);

    // ✅ Save to DB with reference_url and prompt
    const { error: dbError } = await supabase.from("images").insert([
      {
        user_id: user.id,
        name: imageName,
        prompt: prompt, // ✅ Save the actual prompt text
        url: imageUrl,
        reference_url: referenceImageUrl || null,
        created_at: timestamp,
      },
    ]);

    if (dbError) {
      console.error("❌ [DB ERROR]", dbError);
    } else {
      console.log("✅ [DB SAVED] Image + Reference URL inserted");
    }

    return NextResponse.json({
      id: `gen-${Date.now()}`,
      status: "succeeded",
      output: { imageUrl },
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
