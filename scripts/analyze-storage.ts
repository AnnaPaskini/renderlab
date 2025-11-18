#!/usr/bin/env node
/**
 * Quick Analysis Script
 * Check current image count and storage status
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
    console.log('📊 RenderLab Storage Analysis');
    console.log('━'.repeat(50));

    // Total count
    const { count: totalCount, error: countError } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error:', countError);
        return;
    }

    console.log(`\n📈 Total images: ${totalCount}`);

    // Count by age
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const { count: recentCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: oldCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', thirtyDaysAgo.toISOString());

    const { count: veryOldCount } = await supabase
        .from('images')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', sixtyDaysAgo.toISOString());

    console.log('\n📅 Breakdown by age:');
    console.log(`   Recent (< 30 days): ${recentCount || 0}`);
    console.log(`   Old (30-60 days): ${(oldCount || 0) - (veryOldCount || 0)}`);
    console.log(`   Very old (> 60 days): ${veryOldCount || 0}`);

    // Get some sample old images
    const { data: oldImages } = await supabase
        .from('images')
        .select('created_at, prompt')
        .lt('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(5);

    if (oldImages && oldImages.length > 0) {
        console.log('\n📋 Sample old images (oldest first):');
        oldImages.forEach((img, idx) => {
            const date = new Date(img.created_at).toLocaleDateString();
            const prompt = img.prompt?.substring(0, 40) || 'No prompt';
            console.log(`   ${idx + 1}. ${date} - "${prompt}..."`);
        });
    }

    console.log('\n💡 Recommendations:');
    console.log(`   • Deleting ${oldCount || 0} images older than 30 days would free ~${((oldCount || 0) * 0.5 / 100).toFixed(1)}-${((oldCount || 0) * 1 / 100).toFixed(1)} GB`);
    console.log(`   • Deleting ${veryOldCount || 0} images older than 60 days would free ~${((veryOldCount || 0) * 0.5 / 100).toFixed(1)}-${((veryOldCount || 0) * 1 / 100).toFixed(1)} GB`);

    console.log('\n🎯 To fix bandwidth quota (currently 231% over):');
    console.log('   Run: npx tsx scripts/cleanup-old-images.ts');
    console.log('   Or use SQL: scripts/cleanup-images.sql');
}

analyze().catch(console.error);
