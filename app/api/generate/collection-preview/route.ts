import { generateSingle } from "@/lib/generateSingle";
import { createClient } from "@/lib/supabaseServer";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import pLimit from "p-limit";

export const runtime = "nodejs";

type TemplateInput = {
    id: string;
    name: string;
    prompt: string;
    model?: string;
    imageUrl?: string | null;
    [key: string]: any;
};

type ProgressPayload = {
    type: "progress";
    templateId: string;
    templateName: string;
    status: "generating" | "done" | "error";
    current: number;
    total: number;
    imageUrl?: string | null;
    error?: string;
};

type CompletePayload = {
    type: "complete";
    results: Array<{
        templateId: string;
        templateName: string;
        imageUrl: string;
        prompt: string;
        model: string;
        saved?: boolean;
        imageRecordId?: string;
    }>;
};

const encoder = new TextEncoder();

function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function enqueue(
    controller: ReadableStreamDefaultController<Uint8Array>,
    payload: ProgressPayload | CompletePayload,
) {
    controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const model: string = typeof body?.model === "string" && body.model.trim()
            ? body.model.trim()
            : "nano-banana"; // fallback to nano-banana
        const templates: TemplateInput[] = Array.isArray(body?.templates)
            ? body.templates
            : [];
        const baseImageUrl: string | null =
            typeof body?.baseImageUrl === "string" && body.baseImageUrl.trim()
                ? body.baseImageUrl.trim()
                : null;
        const collectionId: string | null =
            typeof body?.collectionId === "string" ? body.collectionId : null;
        const collectionName: string | null =
            typeof body?.collectionName === "string" ? body.collectionName : null;

        if (!templates.length) {
            return NextResponse.json(
                { success: false, error: "At least one template is required." },
                { status: 400 },
            );
        }

        if (!baseImageUrl) {
            return NextResponse.json(
                { success: false, error: "Base image URL is required." },
                { status: 400 },
            );
        }

        const limit = pLimit(5);
        const hasReplicateToken = Boolean(process.env.REPLICATE_API_TOKEN);

        // Generate batch_id for grouping all images in this batch
        const batchId = randomUUID();
        console.log(`🔵 [BATCH] Generated batch_id: ${batchId}`);

        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                let completed = 0;
                const results: Array<{
                    templateId: string;
                    templateName: string;
                    imageUrl: string;
                    prompt: string;
                    model: string;
                    saved?: boolean;
                    imageRecordId?: string;
                }> = [];

                if (!hasReplicateToken) {
                    // Send error for all templates
                    templates.forEach((template, index) => {
                        const payload: ProgressPayload = {
                            type: "progress",
                            templateId: template.id,
                            templateName: template.name,
                            status: "error",
                            current: index + 1,
                            total: templates.length,
                            error: "Missing REPLICATE_API_TOKEN environment variable.",
                        };
                        enqueue(controller, payload);
                    });

                    enqueue(controller, {
                        type: "complete",
                        results: [],
                    });

                    controller.close();
                    return;
                }

                const shuffledTemplates = shuffle(templates);
                const tasks = shuffledTemplates.map((template, index) =>
                    limit(async () => {
                        // Send generating status
                        enqueue(controller, {
                            type: "progress",
                            templateId: template.id,
                            templateName: template.name,
                            status: "generating",
                            current: index + 1,
                            total: templates.length,
                        });

                        if (!template.prompt || !template.prompt.trim()) {
                            completed += 1;
                            enqueue(controller, {
                                type: "progress",
                                templateId: template.id,
                                templateName: template.name,
                                status: "error",
                                current: completed,
                                total: templates.length,
                                error: "Prompt is required.",
                            });
                            return;
                        }

                        try {
                            console.log(`🔵 [PREVIEW] Generating for template: ${template.name} (#${index})`);

                            const result = await generateSingle({
                                prompt: template.prompt,
                                imageUrl: template.imageUrl || baseImageUrl,
                                model: model,
                            });

                            console.log(`🔵 [PREVIEW] Result for ${template.name}:`, {
                                status: result.status,
                                hasUrl: !!result.url,
                            });

                            if (result.status === "ok" && result.url) {
                                completed += 1;

                                // Prepare result object
                                const resultData = {
                                    templateId: template.id,
                                    templateName: template.name,
                                    imageUrl: result.url,
                                    prompt: template.prompt,
                                    model: model,
                                    saved: false,
                                    imageRecordId: undefined as string | undefined,
                                };

                                // Save to database (history)
                                try {
                                    const timestamp = new Date().toISOString();
                                    const imageName = `${collectionName || 'Batch'} - ${template.name}`;

                                    // Generate thumbnail URL using Supabase Transform API
                                    const thumbnailUrl = `${result.url}?width=512&quality=80&format=webp`;

                                    const { data: newImage, error: dbError } = await supabase
                                        .from("images")
                                        .insert([{
                                            user_id: user.id,
                                            name: imageName,
                                            prompt: template.prompt,
                                            url: result.url,
                                            thumbnail_url: thumbnailUrl,
                                            reference_url: baseImageUrl || null,
                                            collection_id: collectionId,
                                            batch_id: batchId,
                                            model: model,
                                            created_at: timestamp,
                                        }])
                                        .select()
                                        .single();

                                    if (dbError) {
                                        console.error(`❌ [BATCH] Failed to save to history for ${template.name}:`, dbError);
                                        // Don't break the batch, just continue
                                    } else if (newImage) {
                                        console.log(`✅ [BATCH] Saved to history: ${template.name} (ID: ${newImage.id})`);
                                        resultData.saved = true;
                                        resultData.imageRecordId = newImage.id;

                                        // Generate thumbnail asynchronously (don't wait)
                                        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-thumbnail`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                imageUrl: result.url,
                                                imageId: newImage.id
                                            })
                                        }).catch(err => console.error('❌ Thumbnail generation failed:', err));
                                    }
                                } catch (saveError) {
                                    console.error(`❌ [BATCH] Exception saving to history for ${template.name}:`, saveError);
                                    // Don't break the batch, continue with next image
                                }

                                // Add to results
                                results.push(resultData);

                                console.log(`✅ [PREVIEW] Success for ${template.name}, URL: ${result.url}`);

                                // Send done status
                                enqueue(controller, {
                                    type: "progress",
                                    templateId: template.id,
                                    templateName: template.name,
                                    status: "done",
                                    current: completed,
                                    total: templates.length,
                                    imageUrl: result.url,
                                });
                            } else {
                                completed += 1;
                                console.error(`❌ [PREVIEW] Failed for ${template.name}:`, result.message);

                                enqueue(controller, {
                                    type: "progress",
                                    templateId: template.id,
                                    templateName: template.name,
                                    status: "error",
                                    current: completed,
                                    total: templates.length,
                                    error: result.message ?? "Unknown error",
                                });
                            }
                        } catch (error) {
                            completed += 1;
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : typeof error === "string"
                                        ? error
                                        : "Unknown error";

                            console.error(`❌ [PREVIEW] Exception for ${template.name}:`, message);

                            enqueue(controller, {
                                type: "progress",
                                templateId: template.id,
                                templateName: template.name,
                                status: "error",
                                current: completed,
                                total: templates.length,
                                error: message,
                            });
                        }
                    }),
                );

                await Promise.all(tasks);

                console.log(`✅ [PREVIEW] All done. ${results.length}/${templates.length} succeeded`);

                // Send final results
                enqueue(controller, {
                    type: "complete",
                    results,
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
        console.error("Collection preview generation error", error);
        return NextResponse.json(
            {
                success: false,
                error: error?.message ?? "Invalid request",
            },
            { status: 400 },
        );
    }
}
