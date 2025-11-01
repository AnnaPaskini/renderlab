import { NextResponse } from "next/server";
import pLimit from "p-limit";
import { generateSingle } from "@/lib/generateSingle";

export const runtime = "nodejs";

type TemplateInput = {
  id?: string;
  templateId?: string;
  prompt: string;
  model?: string;
  imageUrl: string | string[];
  [key: string]: any;
};

const encoder = new TextEncoder();

function enqueue(
  controller: ReadableStreamDefaultController<Uint8Array>,
  payload: any,
) {
  controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const collectionId: string | undefined = body?.collectionId;
    const templates: TemplateInput[] = Array.isArray(body?.templates)
      ? body.templates
      : [];

    const limit = pLimit(5);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        enqueue(controller, {
          type: "start",
          collectionId,
          total: templates.length,
        });

        const tasks = templates.map((template, index) =>
          limit(async () => {
            try {
              await new Promise((resolve) => setTimeout(resolve, 1000));

              const result = await generateSingle(template);

              enqueue(controller, {
                type: "progress",
                index,
                collectionId,
                templateId:
                  result.templateId ??
                  template.id ??
                  template.templateId ??
                  index,
                status: result.status,
                url: result.url,
              });
            } catch (error: any) {
              enqueue(controller, {
                type: "progress",
                index,
                collectionId,
                templateId: template.id ?? template.templateId ?? index,
                status: "error",
                error: error?.message ?? "Unknown error",
              });
            }
          }),
        );

        await Promise.all(tasks);

        enqueue(controller, {
          type: "done",
          collectionId,
          completed: templates.length,
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
