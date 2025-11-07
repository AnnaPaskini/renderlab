import { NextResponse } from "next/server";
<<<<<<< HEAD
import { generateSingle } from "@/lib/generateSingle";

=======
import { createClient } from "@/lib/supabaseServer";
import { generateSingle } from "@/lib/generateSingle";

/**
 * CREATE endpoint without reference image.
 * Generates image via Replicate and saves to database.
 */
>>>>>>> milestone-preview-v1
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body?.model === "string" ? body.model.trim() : null;
    const baseImage =
      typeof body?.baseImage === "string" && body.baseImage.trim().length > 0
        ? body.baseImage.trim()
        : undefined;

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const result = await generateSingle({
      prompt,
      model,
      image: baseImage,
      imageUrl: baseImage,
    });

    if (result.status === "ok" && result.url) {
      return NextResponse.json({
        status: "succeeded",
        output: { imageUrl: result.url },
        templateId: result.templateId,
      });
    }

    const message = result.message || "Generation failed";
    const statusCode =
      message.includes("REPLICATE_API_TOKEN") || message.includes("token") ? 401 : 400;

    return NextResponse.json({ error: message }, { status: statusCode });
  } catch (error: any) {
    console.error("[api/generate]", error);
    return NextResponse.json(
      { error: error?.message || "Generate failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}