// app/api/inpaint/nano-banana/route.ts
/**
 * FINAL VERSION: Full Image + Actual User Mask
 * 
 * Sends to Gemini:
 * 1. Full original image
 * 2. User's actual mask (converted RED → BLACK/WHITE)
 * 3. Reference images (optional)
 */

import { MaskBounds } from '@/lib/constants/inpaint';
import { createClient } from '@/lib/supabaseServer';
import {
    buildBlackWhiteMaskPrompt,
    convertRedMaskToBlackWhite
} from '@/lib/utils/inpaint/maskConverter';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

interface RequestBody {
    userId: string;
    imageUrl: string;
    maskUrl: string;
    maskBounds: MaskBounds;
    userPrompt: string;
    referenceUrls?: string[];
    width: number;
    height: number;
}

async function urlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    console.log('[Nano Banana] Starting inpaint request');

    try {
        const body: RequestBody = await request.json();
        const { userId, imageUrl, maskUrl, maskBounds, userPrompt, referenceUrls = [], width, height } = body;

        if (!userId || !imageUrl || !maskUrl || !maskBounds || !userPrompt) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (referenceUrls.length > 4) {
            return NextResponse.json(
                { error: 'Maximum 4 reference images allowed' },
                { status: 400 }
            );
        }

        // STEP 1: Fetch and resize original image
        console.log('[Step 1/5] Fetching and resizing image to match mask...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

        const resizedImageBuffer = await sharp(imageBuffer)
            .resize(width, height, { fit: 'fill' })
            .jpeg({ quality: 95 })
            .toBuffer();

        const fullImageBase64 = resizedImageBuffer.toString('base64');
        console.log(`✅ Image resized to ${width}x${height} (${Math.round(resizedImageBuffer.length / 1024)}KB)`);

        // STEP 2: Convert mask
        console.log('[Step 2] Converting mask (RED → BLACK/WHITE)...');
        const blackWhiteMaskBase64 = await convertRedMaskToBlackWhite(maskUrl);
        console.log('✅ Mask converted to black/white');

        // STEP 3: Build prompt
        console.log('[Step 3] Building mask-based prompt...');
        const smartPrompt = buildBlackWhiteMaskPrompt(
            userPrompt,
            referenceUrls.length,
            maskBounds,
            { width, height }
        );

        console.log('📝 SMART PROMPT:');
        console.log('═══════════════════════════════════════════');
        console.log(smartPrompt);
        console.log('═══════════════════════════════════════════');

        // STEP 4: Build API parts
        const parts: any[] = [
            { text: smartPrompt },
            { inlineData: { mimeType: 'image/jpeg', data: fullImageBase64 } },
            { inlineData: { mimeType: 'image/png', data: blackWhiteMaskBase64 } }
        ];

        if (referenceUrls.length > 0) {
            console.log(`[Step 4/5] Adding ${referenceUrls.length} reference image(s)...`);
            for (let i = 0; i < referenceUrls.length; i++) {
                const refBase64 = await urlToBase64(referenceUrls[i]);
                parts.push({
                    inlineData: { mimeType: 'image/jpeg', data: refBase64 }
                });
            }
        }

        // STEP 5: Call Gemini
        console.log('[Step 5/5] Calling Gemini API...');
        const geminiResponse = await fetch(
            `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.4,
                        topK: 32,
                        topP: 1,
                        maxOutputTokens: 4096
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('❌ Gemini API error:', errorText);
            throw new Error(`Gemini API failed: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(
            (part: any) => part.inlineData
        );
        const generatedImageBase64 = imagePart?.inlineData?.data;

        if (!generatedImageBase64) {
            if (process.env.NODE_ENV === 'development') {
                console.error('❌ No image in response:', JSON.stringify(geminiData, null, 2));
            }
            throw new Error('No image in Gemini response');
        }

        // Post-process: resize to original dimensions
        console.log('[Post-processing] Resizing to original aspect ratio...');
        console.log(`[Post-processing] Original size: ${width}x${height}`);

        const generatedBuffer: Buffer = Buffer.from(generatedImageBase64, 'base64');

        // Log what Gemini returned
        const geminiMeta = await sharp(generatedBuffer).metadata();
        console.log(`[Post-processing] Gemini returned: ${geminiMeta.width}x${geminiMeta.height}`);

        // Check for aspect ratio mismatch
        const originalAspect = width / height;
        const geminiAspect = (geminiMeta.width || width) / (geminiMeta.height || height);
        const aspectMismatch = Math.abs(originalAspect - geminiAspect) > 0.1;

        if (aspectMismatch) {
            console.warn(`⚠️ Aspect ratio mismatch! Original: ${originalAspect.toFixed(2)}, Gemini: ${geminiAspect.toFixed(2)}`);
        }

        let resizedBuffer: Buffer;
        try {
            resizedBuffer = await sharp(generatedBuffer)
                .resize(width, height, { fit: 'cover', position: 'center' })
                .jpeg({ quality: 90 })
                .toBuffer() as Buffer;

            const finalMeta = await sharp(resizedBuffer).metadata();
            console.log(`✅ [Post-processing] Final size: ${finalMeta.width}x${finalMeta.height}`);
        } catch (resizeError: any) {
            console.error('⚠️ [Post-processing] Resize failed:', resizeError.message);
            resizedBuffer = generatedBuffer;
        }

        // Upload to Supabase
        const supabase = await createClient();
        const timestamp = Date.now();
        const fileName = `inpaint_${timestamp}.jpg`;
        const filePath = `${userId}/inpaint/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('renderlab-images-v2')
            .upload(filePath, resizedBuffer, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            throw uploadError;
        }

        const { data: signedData, error: signedError } = await supabase.storage
            .from('renderlab-images-v2')
            .createSignedUrl(filePath, 3600);

        if (signedError) {
            console.error('❌ Signed URL error:', signedError);
            throw signedError;
        }

        // Save to database
        const { data: dbData, error: dbError } = await supabase
            .from('inpaint_edits')
            .insert({
                user_id: userId,
                base_image_url: imageUrl,
                result_image_url: signedData.signedUrl,
                mask_bounds: maskBounds,
                user_prompt: userPrompt,
                reference_urls: referenceUrls,
                model: 'gemini-2.5-flash-image',
                processing_time_ms: Date.now() - startTime
            })
            .select()
            .single();

        if (dbError) {
            console.error('❌ Database error:', dbError);
        }

        const totalTime = Date.now() - startTime;
        console.log(`✅ Inpaint complete in ${totalTime}ms:`, signedData.signedUrl);

        return NextResponse.json({
            success: true,
            url: signedData.signedUrl,
            editId: dbData?.id,
            processingTimeMs: totalTime,
            warning: aspectMismatch ? 'Image was cropped because reference image has different aspect ratio' : undefined
        });

    } catch (error: any) {
        const totalTime = Date.now() - startTime;
        console.error(`❌ Inpaint error after ${totalTime}ms:`, error.message);

        return NextResponse.json(
            { error: error.message || 'Processing failed', processingTimeMs: totalTime },
            { status: 500 }
        );
    }
}