import Replicate from "replicate";

const MODEL_MAP: Record<string, string> = {
  "nano-banana": "google/nano-banana",
  "nano-banana-pro": "google/nano-banana-pro",
  "seedream4": "bytedance/seedream-4",
  "flux": "black-forest-labs/flux-kontext-pro",
};

// ==========================================
// UNIVERSAL URL EXTRACTOR FOR ALL MODELS
// ==========================================
async function extractUrlFromOutput(output: any): Promise<string | null> {
  if (!output) return null;

  // 1. Array of strings (Nano-Banana, Flux)
  if (Array.isArray(output) && typeof output[0] === "string") {
    return output[0];
  }

  // 2. Object with .url() method (Seedream4, Flux)
  if (typeof output?.url === "function") {
    return await output.url();
  }

  // 3. Array of objects (Seedream can return ReadableStream items)
  if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item?.url === "function") return await item.url();
      if (typeof item === "string") return item;
    }
  }

  // 4. Async iterator (Seedream)
  if (Symbol.asyncIterator in output) {
    for await (const item of output as any) {
      if (typeof item?.url === "function") return await item.url();
      if (typeof item === "string") return item;
    }
  }

  return null;
}

// ==========================================
// MAIN GENERATION FUNCTION
// ==========================================
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

    // Ensure model is valid, fallback to nano-banana
    const safeModel = model && MODEL_MAP[model] ? model : "nano-banana";
    const selectedModel = MODEL_MAP[safeModel];

    if (!selectedModel) {
      console.error("❌ Invalid model:", safeModel);
      return {
        status: "error",
        message: `Invalid model: ${safeModel}`,
      };
    }

    console.log("🟣 Model:", safeModel, "→", selectedModel);
    console.log("🟣 Prompt:", prompt.slice(0, 100));
    console.log("🟣 Has reference:", !!imageUrl);

    // ======================================
    // MODEL-SPECIFIC INPUT (UNIFIED)
    // ======================================
    let input: Record<string, any> = {};

    // FLUX: Uses input_image as single URL string
    if (safeModel === "flux") {
      input = {
        prompt,
        output_format: "jpg",
        safety_tolerance: 2,
        prompt_upsampling: false,
      };

      // Add reference image if provided
      if (imageUrl) {
        input.input_image = imageUrl;
        input.aspect_ratio = "match_input_image";
      }
    }

    // SEEDREAM4: Uses image_input as URL array
    else if (safeModel === "seedream4") {
      input = {
        prompt,
        size: "2K",
        width: 2048,
        height: 2048,
        enhance_prompt: true,
        sequential_image_generation: "disabled",
        ...(imageUrl ? {
          image_input: [imageUrl],
          aspect_ratio: "match_input_image"
        } : {
          aspect_ratio: "4:3"
        })
      };
    }

    // NANO-BANANA & PRO: Use image_input as URL array
    else {
      input = {
        prompt,
        output_format: "jpg",
        ...(imageUrl && {
          image_input: [imageUrl],
          aspect_ratio: "match_input_image"
        })
      };

      // Pro-specific settings
      if (safeModel === 'nano-banana-pro') {
        input.resolution = '4K';
        input.output_format = 'png';
      }
    }

    console.log("🟣 Final input:", input);

    // ======================================
    // RUN REPLICATE
    // ======================================
    const output = await replicate.run(selectedModel as any, { input });
    console.log("🟣 Raw output:", output);

    // ======================================
    // EXTRACT FINAL URL (handles streams)
    // ======================================
    const finalUrl = await extractUrlFromOutput(output);
    console.log("🟣 Final URL extracted:", finalUrl);

    if (!finalUrl) {
      console.error("❌ [generateSingle] Failed to extract URL from output");
      return {
        status: "error",
        message: "Failed to extract image URL from generation output",
      };
    }

    return {
      status: "ok",
      url: finalUrl,
    };

  } catch (error: any) {
    console.error("❌ [generateSingle] Error:", error);
    return {
      status: "error",
      message: error?.message || "Replicate generation failed",
    };
  }
}
