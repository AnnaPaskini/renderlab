import { NextResponse } from "next/server";
import pLimit from "p-limit";
import { generateSingle } from "@/lib/generateSingle";

export const runtime = "nodejs";

type TemplateInput = {
  id?: string;
  templateId?: string;
  prompt?: string;
  imageUrl?: string | string[] | null;
  image?: string | null;
  image_url?: string | null;
  details?: string;
  [key: string]: any;
};

type ProgressPayload = {
  type: "progress";
  index: number;
  collectionId?: string | null;
  templateId: string;
  status: "ok" | "error";
  url?: string | null;
  error?: string;
  httpStatus?: number;
};

type StartPayload = {
  type: "start";
  collectionId?: string | null;
  total: number;
};

type DonePayload = {
  type: "done";
  collectionId?: string | null;
  completed: number;
  succeeded: number;
  failed: number;
};

const encoder = new TextEncoder();

function enqueue(
  controller: ReadableStreamDefaultController<Uint8Array>,
  payload: StartPayload | ProgressPayload | DonePayload,
) {
  controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
}

function resolveTemplateId(template: TemplateInput, fallback: number) {
  const value = template.id ?? template.templateId ?? fallback;
  return typeof value === "string" ? value : String(value);
}

function normalizeTemplate(template: TemplateInput, fallback: number) {
  const id = resolveTemplateId(template, fallback);
  const prompt =
    typeof template.prompt === "string" && template.prompt.trim()
      ? template.prompt
      : typeof template.details === "string" && template.details.trim()
        ? template.details
        : "";

  const directImage = template.imageUrl ?? template.image ?? template.image_url;
  const imageUrl = Array.isArray(directImage)
    ? directImage[0] ?? null
    : directImage ?? null;

  const modelCandidates = [
    template.model,
    template.aiModel,
    template.formData?.aiModel,
  ];
  const model = modelCandidates.find(
    (value) => typeof value === "string" && value.trim().length > 0,
  )?.trim();

  return { id, prompt, imageUrl, model };
}

function buildErrorEvent(
  index: number,
  template: TemplateInput,
  collectionId: string | null,
  message: string,
): ProgressPayload {
  return {
    type: "progress",
    index,
    collectionId,
    templateId: resolveTemplateId(template, index),
    status: "error",
    url: null,
    error: message,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const collectionId: string | null =
      typeof body?.collectionId === "string" ? body.collectionId : null;
    const templates: TemplateInput[] = Array.isArray(body?.templates)
      ? body.templates
      : [];

    if (!templates.length) {
      return NextResponse.json(
        { success: false, error: "At least one template is required." },
        { status: 400 },
      );
    }

    const limit = pLimit(5);
    const hasReplicateToken = Boolean(process.env.REPLICATE_API_TOKEN);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let succeeded = 0;
        let failed = 0;

        enqueue(controller, {
          type: "start",
          collectionId,
          total: templates.length,
        });

        if (!hasReplicateToken) {
          templates.forEach((template, index) => {
            const payload = buildErrorEvent(
              index,
              template,
              collectionId,
              "Missing REPLICATE_API_TOKEN environment variable.",
            );
            payload.httpStatus = 401;
            enqueue(controller, payload);
          });

          enqueue(controller, {
            type: "done",
            collectionId,
            completed: templates.length,
            succeeded: 0,
            failed: templates.length,
          });

          controller.close();
          return;
        }

        const tasks = templates.map((template, index) =>
          limit(async () => {
            const normalized = normalizeTemplate(template, index);

            if (!normalized.prompt) {
              failed += 1;
              enqueue(
                controller,
                buildErrorEvent(index, template, collectionId, "Prompt is required."),
              );
              return;
            }

            try {
              const result = await generateSingle({
                id: normalized.id,
                prompt: normalized.prompt,
                imageUrl: normalized.imageUrl ?? undefined,
                model: normalized.model,
              });

              if (result.status === "ok") {
                succeeded += 1;
                enqueue(controller, {
                  type: "progress",
                  index,
                  collectionId,
                  templateId: normalized.id,
                  status: "ok",
                  url: result.url ?? null,
                });
              } else {
                failed += 1;
                enqueue(
                  controller,
                  buildErrorEvent(
                    index,
                    template,
                    collectionId,
                    result.message ?? "Unknown error",
                  ),
                );
              }
            } catch (error) {
              failed += 1;
              const message =
                error instanceof Error
                  ? error.message
                  : typeof error === "string"
                    ? error
                    : "Unknown error";
              enqueue(
                controller,
                buildErrorEvent(index, template, collectionId, message),
              );
            }
          }),
        );

        await Promise.all(tasks);

        enqueue(controller, {
          type: "done",
          collectionId,
          completed: succeeded + failed,
          succeeded,
          failed,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Collection generation error", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? "Invalid request",
      },
      { status: 400 },
    );
  }
}
