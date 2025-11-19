# 🚨 URGENT: Manual Image Cleanup Guide

## Problem
- **Supabase Egress**: 11.5 GB / 5 GB (231% over quota)
- **Status**: API blocked due to bandwidth limits
- **Impact**: Cannot login, cannot use app
- **Solution**: Manually delete old images via Supabase Dashboard

---

## ⚠️ API IS CURRENTLY BLOCKED

The automated scripts won't work because Supabase API is blocking requests due to bandwidth quota.

You **MUST** use the Supabase Dashboard manually.

---

## STEP-BY-STEP MANUAL CLEANUP

### 1️⃣ Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `cgufwwnovnzrrvnrntbo`

---

### 2️⃣ Check Storage Usage

1. In left sidebar → Click **Storage**
2. You should see your buckets (probably named `images` or similar)
3. Click on the bucket to open it
4. You'll see all uploaded files

**What to look for:**
- Total size of bucket
- Number of files
- Sort by upload date to see oldest files

---

### 3️⃣ Delete Old Files from Storage

**RECOMMENDED APPROACH:**

1. **Sort by Date**: Click column header to sort by upload date (oldest first)
2. **Select Old Files**: 
   - Select first 50 files (checkbox on left)
   - Or select files older than a certain date
3. **Delete**: Click trash icon or "Delete" button
4. **Confirm deletion**
5. **Repeat** 3-4 times to delete 150-200 files total

**TARGET**: Delete at least 100-200 old image files

---

### 4️⃣ Delete Records from Database

After deleting files from Storage, clean up the database:

1. In left sidebar → Click **Table Editor**
2. Find the `images` table
3. Click on it to view records
4. Sort by `created_at` column (oldest first)
5. Select rows that match the files you deleted
6. Click **Delete** button
7. Confirm deletion

**Alternative - Use SQL Editor:**

1. Click **SQL Editor** in left sidebar
2. Click **New Query**
3. Paste this SQL:

```sql
-- Check how many images you have
SELECT COUNT(*) as total_images FROM images;

-- See oldest images
SELECT id, created_at, LEFT(prompt, 50) as prompt_preview
FROM images 
ORDER BY created_at ASC 
LIMIT 20;

-- DELETE oldest 150 images (CAREFUL!)
DELETE FROM images 
WHERE id IN (
  SELECT id 
  FROM images 
  ORDER BY created_at ASC 
  LIMIT 150
);

-- Verify deletion
SELECT COUNT(*) as remaining_images FROM images;
```

4. Run the query
5. Check how many were deleted

---

### 5️⃣ Alternative: Delete ALL Test Data

If you're okay with deleting ALL images:

**SQL Editor:**

```sql
-- WARNING: This deletes EVERYTHING!
-- Only do this if you're okay losing all images

-- Delete all images
DELETE FROM images;

-- Verify
SELECT COUNT(*) FROM images;
```

Then manually delete all files from Storage bucket.

---

### 6️⃣ Check Bandwidth Reduction

After cleanup:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **Usage** tab
3. Wait 10-15 minutes for stats to update
4. Check **Egress** metric
5. Should drop from 231% toward 100%

**Note**: Even after deletion, quota may take time to update. Current period resets on **Dec 2, 2025**.

---

## ESTIMATED IMPACT

| Files Deleted | Storage Freed | Egress Reduction |
|--------------|---------------|------------------|
| 100 files    | ~500 MB       | ~2 GB            |
| 150 files    | ~750 MB       | ~3 GB            |
| 200 files    | ~1 GB         | ~4 GB            |
| ALL files    | Varies        | ~6-10 GB         |

**Goal**: Get Egress under 5 GB (currently 11.5 GB)

---

## QUICK CHECKLIST

- [ ] Open Supabase Dashboard
- [ ] Go to Storage → images bucket
- [ ] Delete 150-200 old files
- [ ] Go to Table Editor → images table  
- [ ] Delete corresponding database records
- [ ] Wait 10-15 minutes
- [ ] Check Usage tab for bandwidth reduction
- [ ] Try logging in again

---

## IF STILL BLOCKED AFTER CLEANUP

**Option A**: Wait until Dec 2, 2025 (quota resets)

**Option B**: Upgrade to Pro Plan ($25/month)
- Go to Project Settings → Billing
- Click "Upgrade to Pro"
- Get 50 GB egress quota

**Option C**: Disable heavy features temporarily
- Comment out History page
- Disable image browsing
- Only allow new generations

---

## AUTOMATED CLEANUP (For Later)

Once quota is fixed and API works again, run:

```bash
# Analyze storage
npx tsx scripts/analyze-storage.ts

# Clean up old images automatically
npx tsx scripts/cleanup-old-images.ts
```

Or use SQL script:
```bash
# Copy contents of scripts/cleanup-images.sql
# Paste into Supabase SQL Editor
# Run the queries
```

---

## PREVENTION FOR FUTURE

### Add Auto-Cleanup Feature

After fixing quota, implement automatic cleanup:

1. **Cron job** to run monthly cleanup
2. **Delete images older than 90 days** automatically  
3. **Implement image compression** to reduce file sizes
4. **Add thumbnail generation** to reduce bandwidth on browsing

### Monitor Usage

- Check Supabase Usage tab weekly
- Set up alerts for 80% quota usage
- Consider upgrading to Pro if approaching limits regularly

---

## 🎯 SUCCESS CRITERIA

✅ Deleted 150+ old files from Storage  
✅ Deleted 150+ records from database  
✅ Egress drops below 200% (ideally below 150%)  
✅ Can access Supabase API again  
✅ Can login to app  
✅ App functions normally  

---

## SHOW ME AFTER CLEANUP

Please share:
1. Screenshot of Usage page showing new Egress %
2. Number of files deleted from Storage
3. Number of records deleted from database
4. Confirmation that login works again

---

**Good luck! 🍀**

The manual cleanup should take 10-15 minutes and will immediately free up bandwidth.
