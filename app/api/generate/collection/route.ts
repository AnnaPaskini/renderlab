import { generateSingle } from "@/lib/generateSingle";
import { createClient } from "@/lib/supabaseServer";
import { uploadImageToStorage } from '@/lib/utils/uploadToStorage';
import { NextResponse } from "next/server";
import pLimit from "p-limit";

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const collectionId: string | null =
      typeof body?.collectionId === "string" ? body.collectionId : null;
    const collectionName: string | null =
      typeof body?.collectionName === "string" ? body.collectionName : null;
    const baseImage: string | null =
      typeof body?.baseImage === "string" && body.baseImage.trim() ? body.baseImage.trim() : null;
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
                prompt: normalized.prompt,
                imageUrl: normalized.imageUrl || baseImage || undefined, // ✅ Use baseImage from request
                model: normalized.model,
              });

              console.log(`🔵 [COLLECTION] Result for item #${index}:`, {
                status: result.status,
                hasUrl: !!result.url,
                url: result.url,
              });

              if (result.status === "ok" && result.url) {
                succeeded += 1;

                // Upload to storage and save to database
                try {
                  const replicateUrl = result.url;

                  // Upload to permanent storage
                  console.log(`🔵 [STORAGE] Uploading image #${index} to Supabase Storage:`, replicateUrl);
                  const permanentUrl = await uploadImageToStorage(
                    supabase,
                    replicateUrl,
                    user.id,
                    'history',
                    `collection_${collectionId || 'temp'}_${Date.now()}_${index}.png`
                  );

                  if (!permanentUrl) {
                    console.error(`❌ [STORAGE] Failed to upload image #${index}`);
                    throw new Error('Failed to upload to storage');
                  }

                  console.log(`✅ [STORAGE] Uploaded image #${index} successfully:`, permanentUrl);

                  // Generate thumbnail URL using Supabase Transform API
                  const thumbnailUrl = `${permanentUrl}?width=512&quality=80&format=webp`;

                  const imageName = `${collectionName || "Collection"} - ${index + 1}`;
                  const { data: newImage, error: dbError } = await supabase
                    .from("images")
                    .insert([{
                      user_id: user.id,
                      name: imageName,
                      prompt: normalized.prompt, // ✅ Save the actual prompt text
                      url: permanentUrl, // ✅ Use permanent Supabase Storage URL
                      thumbnail_url: thumbnailUrl,
                      reference_url: normalized.imageUrl || baseImage || null,
                      collection_id: collectionId,
                    }])
                    .select()
                    .single();

                  if (dbError) {
                    console.error(`❌ [COLLECTION] DB Error #${index}:`, dbError);
                  } else {
                    console.log(`✅ [COLLECTION] Saved to DB with reference_url:`, normalized.imageUrl || baseImage || null);

                    // ✅ Generate thumbnail asynchronously (don't wait)
                    if (newImage) {
                      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-thumbnail`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          imageUrl: permanentUrl,
                          imageId: newImage.id
                        })
                      }).catch(err => console.error(`❌ Thumbnail generation failed for image #${index}:`, err));
                    }
                  }

                  const progressPayload: ProgressPayload = {
                    type: "progress",
                    index,
                    collectionId,
                    templateId: normalized.id,
                    status: "ok",
                    url: permanentUrl ?? null, // ✅ Send permanent URL to client
                  };
                  console.log(`🔵 [COLLECTION] Enqueuing progress #${index}:`, progressPayload);
                  enqueue(controller, progressPayload);
                } catch (dbErr) {
                  console.error(`❌ [COLLECTION] Error processing image #${index}:`, dbErr);
                  failed += 1;

                  const errorPayload: ProgressPayload = {
                    type: "progress",
                    index,
                    collectionId,
                    templateId: normalized.id,
                    status: "error",
                    error: dbErr instanceof Error ? dbErr.message : 'Storage upload failed',
                  };
                  enqueue(controller, errorPayload);
                }
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
