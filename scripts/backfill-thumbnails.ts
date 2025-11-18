/**
 * Backfill Script: Add thumbnail_url to existing images
 * 
 * This script updates all images in the database that don't have a thumbnail_url
 * by generating the Transform API URL from their existing url field.
 * 
 * Usage: npx tsx scripts/backfill-thumbnails.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillThumbnails() {
    console.log('🔍 Starting thumbnail URL backfill...\n');

    try {
        // Fetch all images without thumbnail_url
        console.log('📊 Fetching images without thumbnail_url...');
        const { data: images, error: fetchError } = await supabase
            .from('images')
            .select('id, url')
            .is('thumbnail_url', null);

        if (fetchError) {
            console.error('❌ Error fetching images:', fetchError);
            process.exit(1);
        }

        if (!images || images.length === 0) {
            console.log('✅ All images already have thumbnail URLs!');
            return;
        }

        console.log(`📦 Found ${images.length} images to update\n`);

        let successCount = 0;
        let errorCount = 0;

        // Update each image
        for (const image of images) {
            if (!image.url) {
                console.log(`⚠️  Skipping image ${image.id} - no URL`);
                errorCount++;
                continue;
            }

            // Generate thumbnail URL using Supabase Transform API
            const thumbnailUrl = `${image.url}?width=512&quality=80&format=webp`;

            const { error: updateError } = await supabase
                .from('images')
                .update({ thumbnail_url: thumbnailUrl })
                .eq('id', image.id);

            if (updateError) {
                console.error(`❌ Failed to update image ${image.id}:`, updateError.message);
                errorCount++;
            } else {
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`   ✓ Updated ${successCount}/${images.length} images...`);
                }
            }
        }

        console.log('\n📊 Backfill Summary:');
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ❌ Errors:  ${errorCount}`);
        console.log(`   📦 Total:   ${images.length}`);

        if (successCount === images.length) {
            console.log('\n🎉 Backfill completed successfully!');
        } else if (successCount > 0) {
            console.log('\n⚠️  Backfill completed with some errors.');
        } else {
            console.log('\n❌ Backfill failed.');
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

// Run the backfill
backfillThumbnails();
