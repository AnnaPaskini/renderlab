import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { imageUrl, maskUrl } = await req.json()

  if (!imageUrl || !maskUrl) {
    return NextResponse.json({ error: "Missing image or mask" }, { status: 400 })
  }

  console.log("🎨 Inpaint edit received:", {
    imageUrl,
    maskUrlLength: maskUrl.length,
  })

  return NextResponse.json({ success: true, message: "Mask received locally" })
}
