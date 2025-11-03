import { NextResponse } from "next/server";

/**
 * CREATE endpoint without reference image.
 * Temporary stub that accepts prompt/model and returns a valid image URL.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType && !contentType.includes("application/json")) {
      return NextResponse.json({ error: "content-type must be application/json" }, { status: 415 });
    }

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body?.model === "string" ? body.model.trim() : "default";

    if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    if (prompt.length > 4000) return NextResponse.json({ error: "prompt is too long" }, { status: 413 });

    const seedBase = `${prompt.slice(0, 64)}::${model}::${Date.now()}`;
    const seed = encodeURIComponent(seedBase.replace(/\s+/g, "-"));
    const imageUrl = `https://picsum.photos/seed/${seed}/1024/768`;

    return NextResponse.json({
      id: `stub-${seed}`,
      status: "succeeded",
      output: { imageUrl },
      meta: { model, promptLength: prompt.length, stub: true },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Generate failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
