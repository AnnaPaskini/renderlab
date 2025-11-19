import Replicate from "replicate";

const MODEL_MAP: Record<string, string> = {
  "nano-banana": "google/nano-banana",
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

    const selectedModel = MODEL_MAP[model || "nano-banana"];

    console.log("🟣 Model:", selectedModel);
    console.log("🟣 Prompt:", prompt.slice(0, 100));
    console.log("🟣 Has reference:", !!imageUrl);

    // ======================================
    // MODEL-SPECIFIC INPUT
    // ======================================
    let input: Record<string, any> = {};

    // FLUX
    if (model === "flux") {
      input = {
        prompt,
        input_image: imageUrl || null,
        aspect_ratio: "match_input_image",
        output_format: "jpg",
        safety_tolerance: 2,
        prompt_upsampling: false,
      };
    }

    // SEEDREAM4
    else if (model === "seedream4") {
      input = {
        prompt,
        image_input: imageUrl ? [imageUrl] : [],
        size: "2K",
        width: 2048,
        height: 2048,
        aspect_ratio: imageUrl ? "match_input_image" : "4:3",
        enhance_prompt: true,
        sequential_image_generation: "disabled",
      };
    }

    // NANO-BANANA
    else {
      input = {
        prompt,
        image_input: imageUrl ? [imageUrl] : [],
        aspect_ratio: "match_input_image",
        output_format: "jpg",
      };
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
