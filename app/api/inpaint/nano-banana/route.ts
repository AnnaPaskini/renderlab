import type { InpaintRequest, InpaintResponse } from '@/lib/constants/inpaint';
import { INPAINT_CONSTANTS } from '@/lib/constants/inpaint';
import { createClient } from '@/lib/supabaseServer';
import { getImageModel } from '@/lib/utils/gemini/client';
import { base64ToBlob, urlToBase64 } from '@/lib/utils/gemini/urlToBase64';
import { buildSmartPrompt } from '@/lib/utils/inpaint/promptBuilder';
import { uploadImageToStorage } from '@/lib/utils/uploadToStorage';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // 1. Parse request body
        const body: InpaintRequest = await req.json();
        const {
            imageUrl,
            maskUrl,
            maskBounds,
            userPrompt,
            referenceUrls = [],
            baseImageUrl
        } = body;

        // 2. Validate authentication
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 3. Validate inputs
        if (!imageUrl || !maskUrl || !maskBounds || !userPrompt) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (userPrompt.length > INPAINT_CONSTANTS.USER_PROMPT_MAX_LENGTH) {
            return NextResponse.json(
                { error: `Prompt exceeds ${INPAINT_CONSTANTS.USER_PROMPT_MAX_LENGTH} characters` },
                { status: 400 }
            );
        }

        if (referenceUrls.length > INPAINT_CONSTANTS.MAX_REFERENCE_IMAGES) {
            return NextResponse.json(
                { error: `Maximum ${INPAINT_CONSTANTS.MAX_REFERENCE_IMAGES} reference images allowed` },
                { status: 400 }
            );
        }

        // 4. Download and convert images to base64
        console.log('[Nano Banana] Converting images to base64...');
        const imageBase64 = await urlToBase64(imageUrl);
        const referenceBase64Array = await Promise.all(
            referenceUrls.map((url: string) => urlToBase64(url))
        );

        // 5. Build smart prompt
        console.log('[Nano Banana] Building smart prompt...');
        const smartPrompt = buildSmartPrompt(
            userPrompt,
            maskBounds,
            referenceUrls
        );

        console.log('[Nano Banana] Smart prompt:', smartPrompt);

        // 6. Build Gemini API request parts
        const requestParts = [
            // Original image
            {
                inlineData: {
                    mimeType: 'image/png',
                    data: imageBase64
                }
            },
            // Reference images (if any)
            ...referenceBase64Array.map(base64 => ({
                inlineData: {
                    mimeType: 'image/png',
                    data: base64
                }
            })),
            // Smart prompt text
            { text: smartPrompt }
        ];

        // 7. Call Gemini API
        console.log('[Nano Banana] Calling Gemini API...');
        const model = getImageModel();

        const response = await model.generateContent(requestParts);

        // 8. Extract result image (base64)
        const result = await response.response;
        const candidates = result.candidates;

        if (!candidates || candidates.length === 0) {
            throw new Error('No candidates returned from Gemini API');
        }

        const parts = candidates[0].content.parts;
        let resultBase64: string | null = null;

        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                resultBase64 = part.inlineData.data;
                break;
            }
        }

        if (!resultBase64) {
            console.error('[Nano Banana] Gemini response:', JSON.stringify(result, null, 2));
            throw new Error('Gemini did not return an image. This may be due to content policy restrictions or API limitations. Please try a different prompt or mask area.');
        }

        // 9. Convert base64 to Blob
        console.log('[Nano Banana] Converting result to Blob...');
        const resultBlob = base64ToBlob(resultBase64, 'image/png');

        // 10. Upload result to Supabase Storage
        console.log('[Nano Banana] Uploading result to Supabase...');
        const permanentUrl = await uploadImageToStorage(
            resultBlob,
            user.id,
            `inpaint_${Date.now()}.png`
        );

        if (!permanentUrl) {
            throw new Error('Failed to upload result to Supabase');
        }

        // 11. Save result to images table
        const { data: resultImage, error: imageError } = await supabase
            .from('images')
            .insert([{
                user_id: user.id,
                name: `Inpaint Edit ${new Date().toLocaleString()}`,
                url: permanentUrl,
                reference_url: baseImageUrl || imageUrl,
                prompt: userPrompt,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (imageError || !resultImage) {
            console.error('Error saving to images table:', imageError);
            throw new Error('Failed to save result image');
        }

        // 12. Save edit details to inpaint_edits table
        const tokensUsed = {
            input: INPAINT_CONSTANTS.TOKENS_PER_IMAGE_1024 +
                (referenceUrls.length * INPAINT_CONSTANTS.TOKENS_PER_REFERENCE) +
                INPAINT_CONSTANTS.TOKENS_PROMPT_OVERHEAD,
            output: INPAINT_CONSTANTS.TOKENS_OUTPUT_IMAGE,
            total: 0
        };
        tokensUsed.total = tokensUsed.input + tokensUsed.output;

        const { data: editRecord, error: editError } = await supabase
            .from('inpaint_edits')
            .insert([{
                user_id: user.id,
                base_image_id: null, // TODO: Link if editing from history
                result_image_id: resultImage.id,
                base_image_url: imageUrl,
                mask_url: maskUrl,
                mask_bounds: maskBounds,
                user_prompt: userPrompt,
                full_prompt: smartPrompt,
                reference_image_urls: referenceUrls,
                model_provider: INPAINT_CONSTANTS.MODEL_PROVIDER,
                model_name: INPAINT_CONSTANTS.MODEL_NAME,
                cost: INPAINT_CONSTANTS.NANO_BANANA_COST,
                tokens_used: tokensUsed
            }])
            .select()
            .single();

        if (editError || !editRecord) {
            console.error('Error saving to inpaint_edits table:', editError);
            // Continue anyway - result image is saved
        }

        // 13. Trigger thumbnail generation (fire-and-forget)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-thumbnail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageUrl: permanentUrl,
                imageId: resultImage.id
            })
        }).catch(err => console.error('Thumbnail generation failed:', err));

        // 14. Return success response
        console.log('[Nano Banana] Success!');

        const responseData: InpaintResponse = {
            success: true,
            output: permanentUrl,
            edit_id: editRecord?.id || 0,
            image_id: resultImage.id,
            cost: INPAINT_CONSTANTS.NANO_BANANA_COST,
            tokens_used: tokensUsed
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('[Nano Banana] Error:', error);

        return NextResponse.json(
            {
                error: 'Inpaint request failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
