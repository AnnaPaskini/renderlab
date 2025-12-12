import Replicate from "replicate";

const MODEL_MAP: Record<string, string> = {
  "nano-banana": "google/nano-banana",
  "nano-banana-pro": "google/nano-banana-pro",
  "seedream4": "bytedance/seedream-4",
  "seedream-4.5": "bytedance/seedream-4.5",
  "flux": "black-forest-labs/flux-kontext-pro",
  "flux-2-pro": "black-forest-labs/flux-2-pro",
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
  aspectRatio,
}: {
  prompt: string;
  model?: string;
  imageUrl?: string | null;
  styleReferenceUrls?: string[];
  aspectRatio?: string;
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
    console.log("🟣 Style references count:", styleReferenceUrls.length);

    // ======================================
    // MODEL-SPECIFIC INPUT (UNIFIED)
    // ======================================
    let input: Record<string, any> = {};

    // FLUX: Uses input_image as single URL string
    if (safeModel === "flux") {
      input = {
        prompt: prompt,
        output_format: "jpg",
        safety_tolerance: 2,
        prompt_upsampling: false,
      };

      // Add reference image if provided
      if (imageUrl) {
        input.input_image = imageUrl;
        input.aspect_ratio = aspectRatio || "match_input_image";
      }
    }

    // FLUX 2 PRO: Similar to flux but newer model
    else if (safeModel === "flux-2-pro") {
      input = {
        prompt: prompt,
        output_format: "png",
      };
      // Add reference images if provided
      if (imageUrl) {
        input.input_images = [imageUrl, ...styleReferenceUrls];
        // Only set aspect_ratio if not match_input_image (Flux 2 Pro doesn't support it)
        if (aspectRatio && aspectRatio !== "match_input_image") {
          input.aspect_ratio = aspectRatio;
        }
      } else {
        // Text-to-image mode
        input.aspect_ratio = aspectRatio || "1:1";
      }
    }

    // SEEDREAM4: Uses image_input as URL array
    else if (safeModel === "seedream4") {
      const imageInputs: string[] = [];
      if (imageUrl) imageInputs.push(imageUrl);
      // Add all style references (up to 4)
      imageInputs.push(...styleReferenceUrls);

      // Enhance prompt with @img references
      let finalPrompt = prompt;
      if (imageUrl && styleReferenceUrls.length > 0) {
        const refLabels = styleReferenceUrls.map((_, i) => `@img${i + 2}`).join(', ');
        finalPrompt = `@img1 is the base image. ${refLabels} ${styleReferenceUrls.length > 1 ? 'are reference images' : 'is a reference image'}. 

Task: ${prompt}

Apply elements or style from ${refLabels} to @img1 as described.`;
      } else if (imageUrl) {
        finalPrompt = `Edit @img1: ${prompt}`;
      }

      input = {
        prompt: finalPrompt,
        size: "2K",
        enhance_prompt: true,
        ...(imageInputs.length > 0 ? {
          image_input: imageInputs,
          aspect_ratio: aspectRatio || "match_input_image"
        } : {
          aspect_ratio: aspectRatio || "4:3"
        })
      };
    }

    // SEEDREAM4.5: Uses image_input as URL array (similar to seedream4)
    else if (safeModel === "seedream-4.5") {
      const imageInputs: string[] = [];
      if (imageUrl) imageInputs.push(imageUrl);
      // Add all style references (up to 4)
      imageInputs.push(...styleReferenceUrls);

      // Enhance prompt with @img references
      let finalPrompt = prompt;
      if (imageUrl && styleReferenceUrls.length > 0) {
        const refLabels = styleReferenceUrls.map((_, i) => `@img${i + 2}`).join(', ');
        finalPrompt = `@img1 is the base image. ${refLabels} ${styleReferenceUrls.length > 1 ? 'are reference images' : 'is a reference image'}. 

Task: ${prompt}

Apply elements or style from ${refLabels} to @img1 as described.`;
      } else if (imageUrl) {
        finalPrompt = `Edit @img1: ${prompt}`;
      }

      input = {
        prompt: finalPrompt,
        size: "2K",
        enhance_prompt: true,
        ...(imageInputs.length > 0 ? {
          image_input: imageInputs,
          aspect_ratio: aspectRatio || "match_input_image"
        } : {
          aspect_ratio: aspectRatio || "4:3"
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
      let finalPrompt = prompt;
      if (imageUrl && styleReferenceUrls.length > 0) {
        const refLabels = styleReferenceUrls.map((_, i) => `@img${i + 2}`).join(', ');
        finalPrompt = `@img1 is the base image. ${refLabels} ${styleReferenceUrls.length > 1 ? 'are reference images' : 'is a reference image'}. 

Task: ${prompt}

Apply elements or style from ${refLabels} to @img1 as described.`;
      } else if (imageUrl) {
        finalPrompt = `Edit @img1: ${prompt}`;
      }

      input = {
        prompt: finalPrompt,
        output_format: "jpg",
        ...(imageInputs.length > 0 ? {
          image_input: imageInputs,
          aspect_ratio: aspectRatio || "match_input_image"
        } : {
          aspect_ratio: aspectRatio || "1:1"
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
    // RUN REPLICATE WITH TIMEOUT HANDLING
    // ======================================
    const waitOptions = { wait: { mode: "block" as const, timeout: 60 } }; // Replicate max is 60 seconds

    let output;
    try {
      output = await replicate.run(selectedModel as any, { input, ...waitOptions });
    } catch (replicateError: any) {
      console.error("❌ [REPLICATE ERROR]", {
        model: safeModel,
        error: replicateError?.message || replicateError,
        code: replicateError?.code,
        status: replicateError?.status,
        input: JSON.stringify(input).slice(0, 500), // truncate for logs
      });

      // User-friendly error messages
      let userMessage = "Generation failed. Please try again.";

      if (replicateError?.message?.includes('timeout') || replicateError?.code === 'ETIMEDOUT') {
        userMessage = safeModel === 'nano-banana-pro'
          ? "4K generation timed out. Try 'Nano Banana' for faster results."
          : "Generation timed out. The model may be overloaded, please try again.";
      } else if (replicateError?.status === 429) {
        userMessage = "Rate limit reached. Please wait a moment and try again.";
      } else if (replicateError?.message?.includes('failed')) {
        userMessage = `Model error: ${replicateError.message.slice(0, 100)}`;
      }

      return {
        status: "error",
        message: userMessage,
        debugInfo: {
          model: safeModel,
          errorType: replicateError?.code || 'unknown',
          timestamp: new Date().toISOString(),
        }
      };
    }
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
      debugInfo: {
        model: model || 'unknown',
        errorType: error?.code || 'unknown',
        timestamp: new Date().toISOString(),
      }
    };
  }
}
