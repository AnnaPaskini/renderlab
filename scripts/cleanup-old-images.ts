#!/usr/bin/env node
/**
 * Cleanup Script for Old Images
 * 
 * Purpose: Delete old images to free up Supabase bandwidth quota
 * Current Status: Egress 11.5 GB / 5 GB (231% over quota)
 * Target: Delete 100-200 images to free ~4-6 GB
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImageRecord {
    id: string;
    url: string;
    reference_url?: string | null;
    created_at: string;
    prompt?: string;
    user_id: string;
}

async function getImageCount(): Promise<number> {
    const { count, error } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting images:', error);
        return 0;
    }

    return count || 0;
}

async function getOldImages(daysOld: number, limit: number): Promise<ImageRecord[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
        .from('images')
        .select('id, url, reference_url, created_at, prompt, user_id')
        .lt('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching old images:', error);
        return [];
    }

    return data || [];
}

function extractStoragePath(url: string): string | null {
    try {
        // Extract the path from Supabase storage URL
        // Format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');

        // Find 'public' or bucket name and get everything after it
        const publicIndex = pathParts.indexOf('public');
        if (publicIndex !== -1 && publicIndex < pathParts.length - 1) {
            return pathParts.slice(publicIndex + 1).join('/');
        }

        // Alternative: just get the filename
        return pathParts[pathParts.length - 1];
    } catch (err) {
        console.error(`Failed to parse URL: ${url}`, err);
        return null;
    }
}

async function deleteImage(image: ImageRecord): Promise<boolean> {
    try {
        const pathsToDelete: string[] = [];

        // Extract storage path from main URL
        if (image.url) {
            const path = extractStoragePath(image.url);
            if (path) pathsToDelete.push(path);
        }

        // Extract storage path from reference URL if exists
        if (image.reference_url) {
            const refPath = extractStoragePath(image.reference_url);
            if (refPath) pathsToDelete.push(refPath);
        }

        // Delete from storage
        if (pathsToDelete.length > 0) {
            const { error: storageError } = await supabase.storage
                .from('images')
                .remove(pathsToDelete);

            if (storageError) {
                console.warn(`⚠️  Storage deletion warning for ${image.id}:`, storageError.message);
                // Continue anyway - record might not exist in storage
            }
        }

        // Delete from database
        const { error: dbError } = await supabase
            .from('images')
            .delete()
            .eq('id', image.id);

        if (dbError) {
            console.error(`❌ Database deletion failed for ${image.id}:`, dbError);
            return false;
        }

        return true;
    } catch (err) {
        console.error(`❌ Unexpected error deleting ${image.id}:`, err);
        return false;
    }
}

async function main() {
    console.log('🧹 RenderLab Image Cleanup Script');
    console.log('━'.repeat(50));

    // Step 1: Get current image count
    console.log('\n📊 Step 1: Analyzing current storage...');
    const totalImages = await getImageCount();
    console.log(`   Total images in database: ${totalImages}`);

    if (totalImages === 0) {
        console.log('✅ No images found. Nothing to clean up!');
        return;
    }

    // Step 2: Find old images
    const DAYS_OLD = 30;
    const BATCH_SIZE = 200; // Delete up to 200 images

    console.log(`\n🔍 Step 2: Finding images older than ${DAYS_OLD} days...`);
    const oldImages = await getOldImages(DAYS_OLD, BATCH_SIZE);
    console.log(`   Found ${oldImages.length} old images to delete`);

    if (oldImages.length === 0) {
        console.log('✅ No old images found. Storage is clean!');
        return;
    }

    // Show some details about what will be deleted
    console.log('\n📋 Sample of images to be deleted:');
    oldImages.slice(0, 5).forEach((img, idx) => {
        const date = new Date(img.created_at).toLocaleDateString();
        const promptPreview = img.prompt?.substring(0, 40) || 'No prompt';
        console.log(`   ${idx + 1}. ${date} - "${promptPreview}..."`);
    });

    if (oldImages.length > 5) {
        console.log(`   ... and ${oldImages.length - 5} more`);
    }

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete these images!');
    console.log(`   Images to delete: ${oldImages.length}`);
    console.log(`   Estimated bandwidth freed: ~${(oldImages.length * 0.5 / 100).toFixed(1)} - ${(oldImages.length * 1 / 100).toFixed(1)} GB`);

    // Wait for confirmation (in production, you might want to add a prompt here)
    console.log('\n🚀 Starting deletion in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Delete images
    console.log('\n🗑️  Step 3: Deleting old images...');
    let deletedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < oldImages.length; i++) {
        const image = oldImages[i];
        const success = await deleteImage(image);

        if (success) {
            deletedCount++;
            if (deletedCount % 10 === 0 || deletedCount === oldImages.length) {
                console.log(`   ✅ Deleted ${deletedCount}/${oldImages.length} images...`);
            }
        } else {
            failedCount++;
        }

        // Add small delay to avoid rate limiting
        if (i % 10 === 0 && i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    // Step 4: Summary
    console.log('\n' + '━'.repeat(50));
    console.log('📊 Cleanup Summary:');
    console.log(`   ✅ Successfully deleted: ${deletedCount} images`);
    if (failedCount > 0) {
        console.log(`   ❌ Failed to delete: ${failedCount} images`);
    }

    const remainingImages = await getImageCount();
    console.log(`   📈 Images before: ${totalImages}`);
    console.log(`   📉 Images after: ${remainingImages}`);
    console.log(`   🔽 Reduction: ${totalImages - remainingImages} images (${((totalImages - remainingImages) / totalImages * 100).toFixed(1)}%)`);

    console.log('\n💡 Next Steps:');
    console.log('   1. Wait 10-15 minutes for Supabase to update bandwidth stats');
    console.log('   2. Check Dashboard → Project Settings → Usage');
    console.log('   3. Verify Egress is below quota');
    console.log('   4. Try logging in again');

    console.log('\n✨ Cleanup complete!');
}

// Run the script
main().catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
});
