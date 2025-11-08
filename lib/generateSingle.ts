import Replicate from "replicate";

export async function generateSingle({
  prompt,
  model,
  imageUrl,
}: {
  prompt: string;
  model?: string;
  imageUrl?: string | null;
}) {
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Логируем, чтобы убедиться, что reference реально есть
    console.log("🟣 [generateSingle] Parameters received:", { prompt: prompt?.substring(0, 50), model, imageUrl });

    const input: Record<string, any> = {
      prompt,
    };

    // ✅ Добавляем reference, если есть
    if (imageUrl) {
      input.image_input = [imageUrl]; // nano-banana uses array format
      input.aspect_ratio = "match_input_image";
      input.output_format = "jpg";
      console.log("🟣 [generateSingle] Added image_input:", imageUrl);
    } else {
      console.log("⚠️ [generateSingle] No imageUrl provided, generating text-only");
    }

    console.log("🟣 [generateSingle] Final input sent to Replicate:", JSON.stringify(input, null, 2));

    const output = await replicate.run(`${model || "google/nano-banana"}` as `${string}/${string}`, { input });

    console.log("🟣 [generateSingle] Replicate output type:", typeof output);
    console.log("🟣 [generateSingle] Replicate output:", output);

    let imageResult: string | null = null;

    // Handle different output formats
    if (Array.isArray(output) && output.length > 0) {
      imageResult = output[0];
    } else if (typeof output === "string") {
      imageResult = output;
    } else if (output && typeof output === "object") {
      // New Replicate SDK: output might be an async iterator or have url() method
      if (typeof (output as any).url === "function") {
        imageResult = await (output as any).url();
      } else if (typeof (output as any).url === "string") {
        imageResult = (output as any).url;
      } else if (Symbol.asyncIterator in output) {
        // Handle async iterator
        const results: string[] = [];
        for await (const item of output as any) {
          if (typeof item === "string") {
            results.push(item);
          }
        }
        imageResult = results[0] || null;
      }
    }

    console.log("🟣 [generateSingle] Extracted imageResult:", imageResult);

    return {
      status: "ok",
      url: imageResult,
    };
  } catch (error: any) {
    console.error("❌ [generateSingle] Error:", error);
    return {
      status: "error",
      message: error?.message || "Replicate generation failed",
    };
  }
}
