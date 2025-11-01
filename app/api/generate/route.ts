import { NextResponse } from "next/server";
import { generateSingle } from "@/lib/generateSingle";

export const runtime = "nodejs";

type TemplateInput = {
  id?: string;
  templateId?: string;
  prompt?: string;
  model?: string;
  imageUrl?: string | string[] | null;
  image?: string | null;
  image_url?: string | null;
  [key: string]: any;
};

type ProgressEvent = {
  type: "progress";
  index: number;
  templateId: string | number;
  status: "ok" | "error";
  url?: string | null;
  error?: string;
  collectionId?: string | null;
};

type StartEvent = {
  type: "start";
  collectionId?: string | null;
  total: number;
};

type DoneEvent = {
  type: "done";
  collectionId?: string | null;
  completed: number;
  succeeded: number;
  failed: number;
};

type TaskResult = {
  absoluteIndex: number;
  template: TemplateInput;
  result: ProgressEvent;
};

const encoder = new TextEncoder();

function enqueue(
  controller: ReadableStreamDefaultController<Uint8Array>,
  payload: StartEvent | ProgressEvent | DoneEvent,
) {
  controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
}

function resolveTemplateId(template: TemplateInput, fallbackIndex: number) {
  const value = template.id ?? template.templateId ?? fallbackIndex;
  return typeof value === "string" ? value : String(value);
}

function normalizeTemplate(
  template: TemplateInput,
  fallbackIndex: number,
) {
  const id = resolveTemplateId(template, fallbackIndex);
  const promptSource =
    typeof template.prompt === "string" && template.prompt.trim()
      ? template.prompt
      : typeof template.details === "string" && template.details.trim()
        ? template.details
        : "";

  const directImage = template.imageUrl ?? template.image ?? template.image_url;
  const resolvedImage = Array.isArray(directImage)
    ? directImage[0]
    : directImage ?? null;

  return {
    id,
    prompt: promptSource,
    imageUrl: resolvedImage,
    original: template,
  };
}

function toProgressEvent(
  index: number,
  template: TemplateInput,
  collectionId: string | null,
  result: Awaited<ReturnType<typeof generateSingle>>,
): ProgressEvent {
  const templateId = resolveTemplateId(template, index);
  const isOk = result.status === "ok";

  return {
    type: "progress",
    index,
    collectionId,
    templateId,
    status: isOk ? "ok" : "error",
    url: isOk ? result.url ?? null : null,
    error: !isOk ? result.message ?? "Unknown error" : undefined,
  };
}

function toErrorEvent(
  index: number,
  template: TemplateInput,
  collectionId: string | null,
  message: string,
): ProgressEvent {
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

function toPromptMissingEvent(
  index: number,
  template: TemplateInput,
  collectionId: string | null,
): ProgressEvent {
  return toErrorEvent(index, template, collectionId, "Prompt is required.");
}

export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

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

  try {
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const total = templates.length;
        let succeeded = 0;
        let failed = 0;

        const safeCollectionId = collectionId ?? null;

        enqueue(controller, {
          type: "start",
          collectionId: safeCollectionId,
          total,
        });

        const concurrency = 5;

        for (let i = 0; i < templates.length; i += concurrency) {
          const chunk = templates.slice(i, i + concurrency);

          const tasks: Promise<TaskResult>[] = chunk.map(
            async (template, chunkIndex) => {
              const absoluteIndex = i + chunkIndex;
              const normalized = normalizeTemplate(template, absoluteIndex);

              if (!normalized.prompt) {
                return {
                  absoluteIndex,
                  template,
                  result: toPromptMissingEvent(
                    absoluteIndex,
                    template,
                    safeCollectionId,
                  ),
                };
              }

              try {
                const genResult = await generateSingle({
                  id: normalized.id,
                  prompt: normalized.prompt,
                  imageUrl: normalized.imageUrl ?? undefined,
                });

                return {
                  absoluteIndex,
                  template,
                  result: toProgressEvent(
                    absoluteIndex,
                    template,
                    safeCollectionId,
                    genResult,
                  ),
                };
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : typeof error === "string"
                      ? error
                      : "Unknown error";

                return {
                  absoluteIndex,
                  template,
                  result: toErrorEvent(
                    absoluteIndex,
                    template,
                    safeCollectionId,
                    message,
                  ),
                };
              }
            },
          );

          const responses = await Promise.all(tasks);

          responses.forEach(({ result }) => {
            enqueue(controller, result);
            if (result.status === "ok") {
              succeeded += 1;
            } else {
              failed += 1;
            }
          });
        }

        enqueue(controller, {
          type: "done",
          collectionId: safeCollectionId,
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
  } catch (error) {
    console.error("Generation handler error", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate images." },
      { status: 500 },
    );
  }
}
