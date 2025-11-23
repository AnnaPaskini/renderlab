# Batch Studio History Saving Implementation

## ✅ Completed Tasks

### 1. Database Schema Update
**File**: `supabase/migrations/20251123000000_add_batch_id_to_images.sql`
- Added `batch_id UUID` column to `images` table
- Created index `idx_images_batch_id` for fast batch queries
- Documented the column purpose (grouping images from same batch operation)

### 2. API Route Enhancement
**File**: `app/api/generate/collection-preview/route.ts`

#### Changes Made:
1. **Import randomUUID**: Added `import { randomUUID } from "crypto";`
2. **Type Updates**: Extended `CompletePayload` type to include `saved?: boolean` and `imageRecordId?: string`
3. **Batch ID Generation**: Generate single UUID before stream creation:
   ```typescript
   const batchId = randomUUID();
   ```
4. **Database Insert**: After each successful generation:
   - Get user_id from authenticated session (RLS compliant)
   - Create complete payload with all fields:
     - `user_id` (from session)
     - `name` (formatted as "{collectionName} - {templateName}")
     - `prompt` (original template prompt)
     - `url` (Replicate output URL)
     - `thumbnail_url` (Supabase Transform API URL)
     - `reference_url` (base image used for generation)
     - `collection_id` (optional, from request)
     - `batch_id` (shared UUID for entire batch)
     - `model` (AI model used)
     - `created_at` (ISO timestamp)
   
5. **Error Handling**: Wrapped in try/catch - failures don't stop batch:
   ```typescript
   try {
     // Insert to database
   } catch (saveError) {
     console.error('Failed to save, continuing batch...');
     // Continue with next image
   }
   ```

6. **Return Saved Status**: Each result includes:
   - `saved: true/false` - indicates if DB insert succeeded
   - `imageRecordId: string` - the database record ID for saved images

7. **Thumbnail Generation**: Async trigger (doesn't block response):
   ```typescript
   fetch('/api/generate-thumbnail', {
     method: 'POST',
     body: JSON.stringify({ imageUrl, imageId })
   }).catch(err => console.error(...));
   ```

### 3. Frontend Type Updates
**File**: `app/batch/page.tsx`

Updated `GeneratedResult` interface:
```typescript
interface GeneratedResult {
    templateId: string;
    templateName: string;
    imageUrl: string;
    prompt: string;
    model: string;
    saved?: boolean;        // ← NEW
    imageRecordId?: string; // ← NEW
}
```

## 🎯 Architecture Decisions

### RLS Compliance ✅
- Uses `createClient()` from `@/lib/supabaseServer` (cookie-based session)
- **NOT** using admin SDK
- All inserts happen with user's authenticated session
- Respects Row Level Security policies

### Batch Grouping ✅
- Single `batch_id` (UUID) for all images in one batch operation
- Allows querying all images from same batch: `WHERE batch_id = '{uuid}'`
- NULL for non-batch generations (e.g., single workspace generations)

### Error Isolation ✅
- Each image insert wrapped in try/catch
- Database failures logged but don't stop the batch
- Frontend receives partial success status via `saved` field
- User sees which images saved successfully

### Consistency with Workspace ✅
- Same database schema usage
- Same thumbnail generation pattern
- Same field naming conventions (`url`, `thumbnail_url`, `reference_url`)
- Same async thumbnail generation approach

## 🔄 User Flow

1. User starts batch generation in Batch Studio
2. API generates `batch_id` (UUID)
3. For each template:
   - Generate image via Replicate
   - Save to database with `batch_id`
   - Return result with `saved: true` and `imageRecordId`
4. Frontend receives all results with save status
5. User can view all batch images in History page
6. Images can be queried by `batch_id` for batch management

## 📊 Database Query Examples

### Get all images from a specific batch:
```sql
SELECT * FROM images 
WHERE batch_id = '{uuid}' 
ORDER BY created_at ASC;
```

### Get user's batch operations:
```sql
SELECT batch_id, COUNT(*) as image_count, MIN(created_at) as batch_time
FROM images 
WHERE user_id = '{user_id}' AND batch_id IS NOT NULL
GROUP BY batch_id
ORDER BY batch_time DESC;
```

### Get all batch images for a collection:
```sql
SELECT * FROM images
WHERE collection_id = '{collection_id}' AND batch_id IS NOT NULL
ORDER BY batch_id, created_at;
```

## ✅ Verification Checklist

- [x] `batch_id` column added to images table
- [x] Index created for batch_id queries
- [x] Migration file properly named with timestamp
- [x] User authentication checked before insert
- [x] All required fields included in payload
- [x] RLS compliance (using cookie-session client)
- [x] Error handling doesn't break batch
- [x] Saved status returned to frontend
- [x] TypeScript types updated
- [x] No compilation errors
- [x] Thumbnail generation triggered asynchronously
- [x] Logging added for debugging

## 🚀 Next Steps

1. Apply migration to production database:
   ```bash
   npx supabase db push
   ```

2. Test batch generation flow:
   - Generate batch with 3-5 templates
   - Verify all images appear in History
   - Check database records have same `batch_id`
   - Confirm thumbnails generated

3. Optional enhancements:
   - Add batch name/title field
   - Add batch filtering in History UI
   - Add "View Batch" grouping in History
   - Add batch re-generation feature
