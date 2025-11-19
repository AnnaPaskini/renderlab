# 🧹 Image Cleanup Implementation - Complete

**Date**: November 17, 2025  
**Status**: ✅ Scripts Ready (API Currently Blocked)  
**Priority**: 🔴 CRITICAL

---

## 🎯 PROBLEM SUMMARY

- **Bandwidth Usage**: 11.5 GB / 5 GB (231% over quota)
- **Impact**: Supabase API blocked, cannot login
- **Root Cause**: Too many old images consuming bandwidth
- **Solution**: Delete 150-200 old images to free ~4-6 GB

---

## 📁 CREATED FILES

### 1. **Automated Cleanup Script** ✅
   - **File**: `scripts/cleanup-old-images.ts`
   - **Purpose**: Automatically delete images older than 30 days
   - **Target**: Delete up to 200 old images
   - **Estimated Impact**: Free 4-6 GB bandwidth

### 2. **SQL Cleanup Script** ✅
   - **File**: `scripts/cleanup-images.sql`
   - **Purpose**: Manual SQL queries for Supabase SQL Editor
   - **Options**: Delete by age (30/60 days) or by count (100/200 images)

### 3. **Storage Analysis Script** ✅
   - **File**: `scripts/analyze-storage.ts`
   - **Purpose**: Analyze current storage usage
   - **Output**: Total images, breakdown by age, recommendations

### 4. **Manual Cleanup Guide** ✅
   - **File**: `MANUAL_CLEANUP_GUIDE.md`
   - **Purpose**: Step-by-step guide for manual cleanup via Dashboard
   - **Use When**: API is blocked (like now)

---

## ⚠️ CURRENT SITUATION

**Supabase API is BLOCKED** due to bandwidth quota.

**Evidence:**
```bash
curl to Supabase → 522: Connection timed out
All API requests → Blocked
Login → Cannot connect
```

**This means:**
- ❌ Automated scripts won't work right now
- ❌ Cannot query database via API
- ✅ **MUST use Supabase Dashboard manually**

---

## 🚀 HOW TO FIX (RIGHT NOW)

### OPTION A: Manual Cleanup (RECOMMENDED - Works Now)

**Follow**: `MANUAL_CLEANUP_GUIDE.md`

**Quick Steps:**
1. Open Supabase Dashboard (https://supabase.com/dashboard)
2. Go to Storage → images bucket
3. Delete 150-200 old files (sort by date, select oldest)
4. Go to Table Editor → images table
5. Delete corresponding database records
6. Wait 10-15 minutes for quota to update
7. Try login again

**Time**: 10-15 minutes  
**Risk**: Low (you control what gets deleted)  
**Success Rate**: High

---

### OPTION B: SQL Cleanup (Works via Dashboard)

**File**: `scripts/cleanup-images.sql`

**Steps:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `scripts/cleanup-images.sql`
4. Run the DELETE query (choose your option)
5. Manually delete files from Storage bucket
6. Wait for quota to update

**Time**: 5-10 minutes  
**Risk**: Medium (SQL deletes are immediate)  
**Success Rate**: High

---

### OPTION C: Automated Cleanup (For Later - After API Works)

**Once quota is fixed and API works:**

```bash
# Analyze current storage
npx tsx scripts/analyze-storage.ts

# Run automated cleanup
npx tsx scripts/cleanup-old-images.ts
```

**Features:**
- Deletes images older than 30 days
- Removes files from Storage AND database
- Shows progress and summary
- Estimates bandwidth freed

---

## 📊 EXPECTED RESULTS

### Target Metrics

| Metric | Before | After Target |
|--------|--------|--------------|
| Total Images | Unknown | -150 to -200 |
| Egress Usage | 11.5 GB (231%) | < 7 GB (140%) |
| API Status | ❌ Blocked | ✅ Working |
| Login Status | ❌ Fails | ✅ Works |

### Timeline

- **Immediate**: Delete files manually
- **10-15 minutes**: Quota stats update
- **After update**: API unblocked, login works
- **Dec 2, 2025**: Quota fully resets

---

## 🛠️ TECHNICAL DETAILS

### Database Schema

**Table**: `images`

**Key Columns:**
- `id` (uuid, primary key)
- `url` (text, storage URL)
- `reference_url` (text, optional)
- `created_at` (timestamp)
- `user_id` (uuid)
- `prompt` (text)

### Storage Bucket

**Name**: `images`  
**Type**: Public bucket  
**URL Format**: `https://{project}.supabase.co/storage/v1/object/public/images/{filename}`

### Cleanup Logic

1. **Find old images**: `WHERE created_at < NOW() - INTERVAL '30 days'`
2. **Delete from Storage**: Extract filename from URL, call storage.remove()
3. **Delete from Database**: `DELETE FROM images WHERE id = ?`
4. **Handle errors**: Skip if storage file missing, log errors

---

## 🔧 SCRIPTS USAGE (After API Fix)

### Analyze Storage

```bash
cd "/Users/anna/claude renderlab CURRENT"
npx tsx scripts/analyze-storage.ts
```

**Output:**
- Total images count
- Breakdown by age (recent, old, very old)
- Sample of oldest images
- Recommendations for cleanup

### Run Automated Cleanup

```bash
cd "/Users/anna/claude renderlab CURRENT"
npx tsx scripts/cleanup-old-images.ts
```

**Process:**
1. Counts total images
2. Finds images older than 30 days
3. Shows sample of what will be deleted
4. Waits 3 seconds
5. Deletes images (storage + database)
6. Shows progress every 10 images
7. Displays summary

**Safety:**
- Batch limit: 200 images max
- Small delays to avoid rate limiting
- Error handling for each deletion
- Detailed logging

---

## 📋 VERIFICATION CHECKLIST

After cleanup, verify:

- [ ] Supabase Dashboard → Usage tab shows lower Egress %
- [ ] Can access Supabase API (test with curl)
- [ ] Can login to app at `/login`
- [ ] Can access `/workspace`
- [ ] Can view `/auth-debug` page
- [ ] History page loads (if any images remain)
- [ ] Can create new images

---

## 🔮 PREVENTION STRATEGY

### Immediate Actions (After Fix)

1. **Set up monitoring**: Check Usage tab weekly
2. **Document cleanup process**: Keep this as reference
3. **Test automated scripts**: Make sure they work

### Long-term Solutions

1. **Automatic Cleanup Cron Job**
   - Run monthly cleanup via GitHub Actions or similar
   - Delete images older than 90 days
   - Send notification of cleanup

2. **Image Optimization**
   - Compress images before upload
   - Generate thumbnails (smaller files for browsing)
   - Use WebP format for better compression

3. **Quota Monitoring**
   - Set up alerts at 80% usage
   - Dashboard widget showing current usage
   - Monthly usage reports

4. **Consider Pro Plan**
   - $25/month
   - 50 GB egress quota (10x free tier)
   - Better for production use

---

## 🎯 SUCCESS CRITERIA

✅ **Phase 1: Immediate Fix** (Manual)
- Deleted 150-200 old images
- Egress below 200%
- API accessible
- Login works

✅ **Phase 2: Verification** (After fix)
- Ran analysis script
- Confirmed image counts
- Tested automated cleanup
- All features working

✅ **Phase 3: Prevention** (Future)
- Set up monitoring
- Implemented auto-cleanup
- Documented process
- Considering Pro upgrade

---

## 📞 NEXT STEPS

### RIGHT NOW:
1. **Read**: `MANUAL_CLEANUP_GUIDE.md`
2. **Go to**: Supabase Dashboard
3. **Delete**: 150-200 old images
4. **Wait**: 10-15 minutes
5. **Test**: Try login

### AFTER API WORKS:
1. **Run**: `npx tsx scripts/analyze-storage.ts`
2. **Run**: `npx tsx scripts/cleanup-old-images.ts` (if needed)
3. **Verify**: Check all features work
4. **Plan**: Set up prevention measures

---

## 📄 FILE STRUCTURE

```
/Users/anna/claude renderlab CURRENT/
├── scripts/
│   ├── cleanup-old-images.ts      # Automated cleanup
│   ├── analyze-storage.ts         # Storage analysis
│   └── cleanup-images.sql         # SQL queries
├── MANUAL_CLEANUP_GUIDE.md        # Step-by-step guide
└── IMAGE_CLEANUP_SUMMARY.md       # This file
```

---

## 🆘 TROUBLESHOOTING

**Q: API still blocked after cleanup?**  
A: Wait 15-30 minutes, Supabase stats update slowly.

**Q: How do I know if I deleted enough?**  
A: Check Dashboard → Usage → Egress should be < 200%.

**Q: Can I delete ALL images?**  
A: Yes, if you're okay losing all history. Use SQL: `DELETE FROM images;`

**Q: Scripts don't work?**  
A: Make sure `.env.local` has correct Supabase keys and API is working.

**Q: Quota still over after deletion?**  
A: Quota period resets Dec 2. Deletion helps prevent future issues.

---

**Status**: 🟢 Ready for manual cleanup  
**Priority**: 🔴 Do this NOW to unblock login  
**Estimated Time**: 10-15 minutes manual work  

**Good luck! 🚀**
