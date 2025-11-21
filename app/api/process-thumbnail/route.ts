import { createClient } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { image } = await request.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        let imageBuffer: Buffer;

        // Handle Base64 or URL
        if (image.startsWith("data:")) {
            const base64Data = image.split(",")[1];
            imageBuffer = Buffer.from(base64Data, "base64");
        } else if (image.startsWith("http")) {
            const response = await fetch(image);
            if (!response.ok) {
                throw new Error("Failed to fetch image from URL");
            }
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
        } else {
            return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
        }

        const timestamp = Date.now();
        const originalFileName = `original_${timestamp}.jpg`;
        const thumbnailFileName = `thumb_1024_${timestamp}.jpg`;
        const folderPath = `${user.id}/workspace`;

        // 1. Upload Original (converted to JPEG for consistency with filename)
        const originalJpegBuffer = await sharp(imageBuffer)
            .jpeg({ quality: 100 })
            .toBuffer();

        const { error: uploadOriginalError } = await supabase.storage
            .from("renderlab-images")
            .upload(`${folderPath}/${originalFileName}`, originalJpegBuffer, {
                contentType: "image/jpeg",
                upsert: false,
            });

        if (uploadOriginalError) {
            console.error("Upload original error:", uploadOriginalError);
            throw new Error("Failed to upload original image");
        }

        // 2. Generate Thumbnail (Max 1024px, JPEG, Quality 80)
        const thumbnailBuffer = await sharp(imageBuffer)
            .resize({
                width: 1024,
                height: 1024,
                fit: "inside",
                withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer();

        const { error: uploadThumbError } = await supabase.storage
            .from("renderlab-images")
            .upload(`${folderPath}/${thumbnailFileName}`, thumbnailBuffer, {
                contentType: "image/jpeg",
                upsert: false,
            });

        if (uploadThumbError) {
            // Try to clean up original if thumbnail fails
            await supabase.storage
                .from("renderlab-images")
                .remove([`${folderPath}/${originalFileName}`]);

            console.error("Upload thumbnail error:", uploadThumbError);
            throw new Error("Failed to upload thumbnail");
        }

        // Get Public URLs
        const { data: { publicUrl: originalUrl } } = supabase.storage
            .from("renderlab-images")
            .getPublicUrl(`${folderPath}/${originalFileName}`);

        const { data: { publicUrl: thumbnailUrl } } = supabase.storage
            .from("renderlab-images")
            .getPublicUrl(`${folderPath}/${thumbnailFileName}`);

        return NextResponse.json({
            success: true,
            originalUrl,
            thumbnailUrl,
        });

    } catch (error: any) {
        console.error("Thumbnail processing error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
