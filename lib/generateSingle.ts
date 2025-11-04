// lib/generateSingle.ts
console.log("⚙️ Loaded model version:", process.env.REPLICATE_MODEL_VERSION);

export type GenerateSingleInput = {
  id?: string;
  templateId?: string;
  prompt?: string;
  model?: string | null;
  imageUrl?: string | string[] | null;
  image?: string | string[] | null;
  negativePrompt?: string | null;
  guidanceScale?: number | null;
  numInferenceSteps?: number | null;
  [key: string]: any;
};

export type GenerateSingleResult = {
  status: "ok" | "error";
  url?: string | null;
  templateId?: string;
  message?: string;
};

// ⚙️ Модель берётся из .env.local
// Пример: REPLICATE_MODEL_VERSION=black-forest-labs/flux-schnell:9a2b7e46...
const DEFAULT_MODEL_VERSION =
  process.env.REPLICATE_MODEL_VERSION ?? "unknown-model-version";

const parsedAttempts = Number(process.env.REPLICATE_MAX_ATTEMPTS);
const MAX_POLL_ATTEMPTS =
  Number.isFinite(parsedAttempts) && parsedAttempts > 0 ? parsedAttempts : 60;

const parsedInterval = Number(process.env.REPLICATE_POLL_INTERVAL_MS);
const POLL_INTERVAL_MS =
  Number.isFinite(parsedInterval) && parsedInterval > 0
    ? parsedInterval
    : 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function resolveTemplateId(input: GenerateSingleInput): string | undefined {
  if (typeof input.id === "string" && input.id.trim()) return input.id;
  if (typeof input.templateId === "string" && input.templateId.trim())
    return input.templateId;
  return undefined;
}

export async function generateSingle(
  template: GenerateSingleInput
): Promise<GenerateSingleResult> {
  try {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      return {
        status: "error",
        message: "REPLICATE_API_TOKEN is not configured.",
        url: null,
        templateId: resolveTemplateId(template),
      };
    }

    const prompt =
      typeof template.prompt === "string" && template.prompt.trim().length > 0
        ? template.prompt.trim()
        : undefined;

    if (!prompt) {
      return {
        status: "error",
        message: "Prompt is required for generation.",
        url: null,
        templateId: resolveTemplateId(template),
      };
    }

    const model =
      (typeof template.model === "string" && template.model.trim()) ||
      DEFAULT_MODEL_VERSION;

    // ---- Собираем возможные ссылки на reference image ----
    const imageSources: Array<string | string[] | null | undefined> = [
      template.image,
      template.imageUrl,
    ];

    let imageCandidate: string | string[] | null = null;

    for (const src of imageSources) {
      if (typeof src === "string" && src.trim().length > 0) {
        imageCandidate = src.trim();
        break;
      }
      if (Array.isArray(src)) {
        const valid = src.filter(
          (v): v is string => typeof v === "string" && v.trim().length > 0
        );
        if (valid.length > 0) {
          imageCandidate = valid;
          break;
        }
      }
    }

    // ---- Формируем тело запроса к Replicate ----
    const requestBody: Record<string, any> = {
      version: model,
      input: { prompt },
    };

    // ✅ Универсальная поддержка reference-image
    if (imageCandidate) {
      const imageArray = Array.isArray(imageCandidate)
        ? imageCandidate
        : [imageCandidate];

      // Поддержка разных полей, чтобы работало с любой моделью
      requestBody.input.image = imageArray[0];
      requestBody.input.image_input = imageArray;
      requestBody.input.input_image = imageArray;
      requestBody.input.init_image = imageArray[0];
    }

    if (
      typeof template.negativePrompt === "string" &&
      template.negativePrompt.trim()
    ) {
      requestBody.input.negative_prompt = template.negativePrompt.trim();
    }

    if (typeof template.guidanceScale === "number") {
      requestBody.input.guidance_scale = template.guidanceScale;
    }

    if (typeof template.numInferenceSteps === "number") {
      requestBody.input.num_inference_steps = template.numInferenceSteps;
    }

    console.log(
      "[generateSingle] → Sending requestBody:",
      JSON.stringify(requestBody, null, 2)
    );

    // ---- Запрос к Replicate ----
    const createResponse = await fetch(
      "https://api.replicate.com/v1/predictions",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const created = await createResponse.json();

    if (!createResponse.ok) {
      const message =
        created?.error?.detail ||
        created?.detail ||
        created?.message ||
        "Failed to create Replicate prediction.";
      return {
        status: "error",
        message,
        url: null,
        templateId: resolveTemplateId(template),
      };
    }

    const pollUrl: string | undefined = created?.urls?.get;
    if (!pollUrl) {
      return {
        status: "error",
        message: "Replicate did not return a polling URL.",
        url: null,
        templateId: resolveTemplateId(template),
      };
    }

    // ---- Polling ----
    let attempt = 0;
    let prediction = created;

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      attempt < MAX_POLL_ATTEMPTS
    ) {
      await sleep(POLL_INTERVAL_MS);
      const pollResponse = await fetch(pollUrl, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      });
      prediction = await pollResponse.json();
      attempt++;
    }

    if (prediction.status !== "succeeded") {
      const message =
        prediction?.error?.detail ||
        prediction?.error ||
        prediction?.status ||
        "Replicate prediction failed.";
      return {
        status: "error",
        message,
        url: null,
        templateId: resolveTemplateId(template),
      };
    }

    // ---- Обработка результата ----
    const output = prediction.output;
    let imageUrl: string | null = null;

    if (Array.isArray(output) && output.length > 0) {
      imageUrl = typeof output[0] === "string" ? output[0] : null;
    } else if (typeof output === "string") {
      imageUrl = output;
    } else if (output && typeof output === "object") {
      imageUrl =
        typeof output.image === "string"
          ? output.image
          : Array.isArray(output.images) && typeof output.images[0] === "string"
          ? output.images[0]
          : null;
    }

    if (!imageUrl) {
      return {
        status: "error",
        message: "Replicate succeeded but no image URL was returned.",
        url: null,
        templateId: resolveTemplateId(template),
      };
    }

    return {
      status: "ok",
      url: imageUrl,
      templateId: resolveTemplateId(template),
    };
  } catch (error: any) {
    return {
      status: "error",
      message: error?.message || "Unknown generation error",
      url: null,
      templateId: resolveTemplateId(template),
    };
  }
}
