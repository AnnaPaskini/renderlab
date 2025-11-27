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
  styleReferenceUrls = [],
}: {
  prompt: string;
  model?: string;
  imageUrl?: string | null;
  styleReferenceUrls?: string[];
}) {
  try {
    // Convert user-friendly #1, #2 to @img1, @img2
    let processedPrompt = prompt
      .replace(/#1\b/g, '@img1')
      .replace(/#2\b/g, '@img2')
      .replace(/#3\b/g, '@img3')
      .replace(/#4\b/g, '@img4')
      .replace(/#5\b/g, '@img5');

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
    console.log("🟣 Prompt:", processedPrompt.slice(0, 100));
    console.log("🟣 Has reference:", !!imageUrl);
    console.log("🟣 Style references count:", styleReferenceUrls.length);

    // ======================================
    // MODEL-SPECIFIC INPUT (UNIFIED)
    // ======================================
    let input: Record<string, any> = {};

    // FLUX: Uses input_image as single URL string
    if (safeModel === "flux") {
      input = {
        prompt: processedPrompt,
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
      const imageInputs: string[] = [];
      if (imageUrl) imageInputs.push(imageUrl);
      // Add all style references (up to 4)
      imageInputs.push(...styleReferenceUrls);

      // Enhance prompt with @img references
      let finalPrompt = processedPrompt;
      if (imageUrl && styleReferenceUrls.length > 0) {
        const refLabels = styleReferenceUrls.map((_, i) => `@img${i + 2}`).join(', ');
        finalPrompt = `@img1 is the base image. ${refLabels} ${styleReferenceUrls.length > 1 ? 'are reference images' : 'is a reference image'}. 

Task: ${processedPrompt}

Apply elements or style from ${refLabels} to @img1 as described.`;
      } else if (imageUrl) {
        finalPrompt = `Edit @img1: ${processedPrompt}`;
      }

      input = {
        prompt: finalPrompt,
        size: "2K",
        enhance_prompt: true,
        ...(imageInputs.length > 0 ? {
          image_input: imageInputs,
          aspect_ratio: "match_input_image"
        } : {
          aspect_ratio: "4:3"
        })
      };
    }

    // NANO-BANANA & PRO: Use image_input as URL array (supports multiple images)
    else {
      // Build image_input array with base image and style references (up to 4)
      const imageInputs: string[] = [];
      if (imageUrl) imageInputs.push(imageUrl);
      // Add all style references
      imageInputs.push(...styleReferenceUrls);

      // Enhance prompt with @img references for multi-image understanding
      let finalPrompt = processedPrompt;
      if (imageUrl && styleReferenceUrls.length > 0) {
        const refLabels = styleReferenceUrls.map((_, i) => `@img${i + 2}`).join(', ');
        finalPrompt = `@img1 is the base image. ${refLabels} ${styleReferenceUrls.length > 1 ? 'are reference images' : 'is a reference image'}. 

Task: ${processedPrompt}

Apply elements or style from ${refLabels} to @img1 as described.`;
      } else if (imageUrl) {
        finalPrompt = `Edit @img1: ${processedPrompt}`;
      }

      input = {
        prompt: finalPrompt,
        output_format: "jpg",
        ...(imageInputs.length > 0 && {
          image_input: imageInputs,
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
