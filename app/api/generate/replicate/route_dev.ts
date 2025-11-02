import { NextRequest, NextResponse } from "next/server"
import { generateSingle } from "@/lib/generateSingle"

export async function POST(request: NextRequest) {
  try {
    const { prompt, model, imageUrl } = await request.json()

    if (!prompt || !imageUrl) {
      return NextResponse.json(
        { success: false, error: "Prompt and image are required." },
        { status: 400 }
      )
    }

    const result = await generateSingle({
      prompt,
      model,
      imageUrl,
    })

    if (result.status === "error" || !result.url) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Unknown error" },
        { status: 500 }
      )
    }

    console.log("Edit completed, result URL:", result.url)

    return NextResponse.json({
      success: true,
      prompt,
      model,
      result: result.url,
    })
  } catch (error: any) {
    console.error("Edit error (full object):", JSON.stringify(error, null, 2))
    return NextResponse.json(
      { success: false, error: error?.message || "Unknown error" },
      { status: 500 }
    )
  }
}
