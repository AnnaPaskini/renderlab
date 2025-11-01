import Replicate from "replicate";

const token = process.env.REPLICATE_API_TOKEN || "";

if (!token) {
  console.warn(
    "⚠️  Missing REPLICATE_API_TOKEN in .env.local. Generation will be skipped.",
  );
}

const replicate = new Replicate({
  auth: token,
});

type GenerateSingleInput = {
  id: string;
  prompt: string;
  imageUrl?: string | null;
};

type GenerateSingleResult = {
  status: "ok" | "error" | "skipped";
  url: string | null;
  message?: string;
};

export async function generateSingle(
  template: GenerateSingleInput,
): Promise<GenerateSingleResult> {
  if (!token) {
    return {
      status: "skipped",
      url: null,
      message: "Missing Replicate token.",
    };
  }

  try {
    console.log("▶️ Starting generation:", template.id, template.prompt);

    const input: Record<string, any> = {
      prompt: template.prompt,
    };

    if (template.imageUrl) {
      input.image = template.imageUrl;
    }

    const output = await replicate.run("google/nano-banana", { input });

    const imageUrl =
      Array.isArray(output) && output.length > 0
        ? output[0]
        : typeof output === "string"
          ? output
          : null;

    console.log("✅ Completed:", template.id, imageUrl);

    return {
      status: "ok",
      url: imageUrl,
    };
  } catch (error: any) {
    console.error(
      "❌ Generation error:",
      template.id,
      error?.message || error,
    );
    return {
      status: "error",
      url: null,
      message: error?.message || "Unknown error",
    };
  }
}
