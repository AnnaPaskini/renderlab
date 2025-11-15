# RenderLab API Optimization Strategy
**Complete Guide to File Transfer, Storage, and Thumbnail System**

Generated: November 14, 2025  
For: Inpaint Integration Planning

---

## 📋 Table of Contents

1. [File Transfer Strategy](#1-file-transfer-strategy)
2. [Thumbnail System](#2-thumbnail-system)
3. [Storage Upload Flow](#3-storage-upload-flow)
4. [Recommendations for Inpaint API](#4-recommendations-for-inpaint-api)
5. [Code Examples](#5-code-examples)

---

## 1. FILE TRANSFER STRATEGY

### 🎯 Core Pattern: **URL-Based Transfer**

**RenderLab follows a consistent pattern across all API routes:**
- ✅ **Frontend sends URLs (strings)** to backend
- ❌ **NOT base64 or Blobs** (except for direct file uploads via FormData)
- 🔄 **Backend downloads, processes, and re-uploads to permanent storage**

---

### Example: `/api/generate` (Main Generation)

**Frontend → Backend:**
```typescript
// From: app/workspace/page.tsx
const response = await fetch("/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "modern architecture",
    model: "google/nano-banana",
    imageUrl: uploadedImage || null  // ✅ URL string, not blob!
  }),
});
```

**Backend Logic:**
```typescript
// From: app/api/generate/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const referenceImageUrl = body.imageUrl; // ✅ Receive URL

  // Pass URL directly to Replicate
  const result = await generateSingle({
    prompt: body.prompt,
    imageUrl: referenceImageUrl,  // ✅ Replicate downloads from URL
  });

  const replicateUrl = result.url; // Replicate returns URL

  // Download Replicate result and upload to Supabase
  const permanentUrl = await uploadImageToStorage(
    replicateUrl,  // ✅ URL to download from
    user.id,
    `generated_${Date.now()}.png`
  );

  // Save permanent URL to database
  await supabase.from("images").insert([{
    url: permanentUrl,  // ✅ Permanent Supabase URL
    reference_url: referenceImageUrl
  }]);
}
```

---

### Example: `/api/generate/edit` (Inpainting)

**Frontend → Backend:**
```typescript
// Expected pattern (NOT YET IMPLEMENTED in frontend)
const response = await fetch('/api/generate/edit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: "https://supabase.../image.png",  // ✅ URL to image
    maskUrl: "https://supabase.../mask.png",     // ✅ URL to mask
    prompt: "restore seamlessly",
    baseImageUrl: "https://..." // Optional original reference
  })
});
```

**Backend Logic:**
```typescript
// From: app/api/generate/edit/route.ts
export async function POST(req: Request) {
  const { imageUrl, maskUrl, prompt, baseImageUrl } = await req.json();

  // Send URLs directly to Replicate (they download)
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    body: JSON.stringify({
      version: "google/nano-banana",
      input: {
        image: imageUrl,  // ✅ Replicate downloads from URL
        mask: maskUrl,    // ✅ Replicate downloads from URL
        prompt: prompt
      }
    })
  });

  // Poll for result
  const replicateUrl = result.output[0];

  // Download and upload to permanent storage
  const permanentUrl = await uploadImageToStorage(
    replicateUrl,
    user.id,
    `edited_${Date.now()}.png`
  );
}
```

---

### Example: `/api/upload` (Direct File Upload)

**Only endpoint that uses FormData:**

```typescript
// Frontend sends binary file
const formData = new FormData();
formData.append('file', blob, 'reference.png');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData  // ✅ FormData with binary file
});
```

**Backend:**
```typescript
// From: app/api/upload/route.ts
const formData = await req.formData();
const file = formData.get("file") as File;

// Upload directly to Supabase Storage
await supabase.storage
  .from("renderlab-images")
  .upload(fileName, file, { upsert: false });
```

**Use case:** User drags file from desktop → Uploads to temporary storage

---

### 🔑 Key Insights

| Scenario | Frontend Sends | Backend Receives | Backend Does |
|----------|----------------|------------------|--------------|
| **Text-to-Image** | `{ prompt, imageUrl: null }` | JSON with null URL | Generate via Replicate |
| **Img-to-Img** | `{ prompt, imageUrl: "https://..." }` | JSON with URL | Pass URL to Replicate |
| **Inpainting** | `{ imageUrl, maskUrl, prompt }` | JSON with URLs | Pass URLs to Replicate |
| **File Upload** | FormData with File | Binary file | Upload to Storage |

**Why URLs instead of Base64?**
1. ✅ **Smaller payloads** (URL = ~100 bytes vs base64 = ~1.3x image size)
2. ✅ **No timeout issues** (no large request bodies)
3. ✅ **Replicate API expects URLs** (not base64)
4. ✅ **Easier debugging** (can open URLs in browser)
5. ✅ **Better caching** (browser/CDN can cache images)

---

## 2. THUMBNAIL SYSTEM

### 🎯 Workflow: Async Fire-and-Forget

**RenderLab generates thumbnails AFTER saving to database:**

```
User generates image
    ↓
Save to DB with full URL
    ↓
Return success to user immediately
    ↓
Fire async request to /api/generate-thumbnail (no await!)
    ↓
Thumbnail service downloads, resizes, uploads, updates DB
```

---

### When Thumbnails Are Created

**Every time an image is saved to the `images` table:**

1. **After text-to-image generation** (`/api/generate`)
2. **After inpaint/edit** (`/api/generate/edit`)
3. **After collection batch generation** (`/api/generate/collection`)
4. **After direct file upload** (`/api/upload`)

**Not blocking:** User sees result immediately, thumbnail generates in background

---

### Implementation Pattern

**From: `app/api/generate/route.ts`**
```typescript
const { data: newImage, error: dbError } = await supabase
  .from("images")
  .insert([{
    user_id: user.id,
    url: permanentUrl,  // ✅ Full image saved
    thumb_url: null     // ✅ Thumbnail not yet created
  }])
  .select()
  .single();

// ✅ Trigger thumbnail generation (fire-and-forget)
if (newImage) {
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-thumbnail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl: permanentUrl,  // ✅ Full image URL
      imageId: newImage.id     // ✅ DB record ID
    })
  }).catch(err => console.error('❌ Thumbnail generation failed:', err));
  // ⚠️ NO AWAIT - continues immediately
}

// Return success to user (thumbnail still processing)
return NextResponse.json({ success: true, output: permanentUrl });
```

---

### Thumbnail Service Details

**From: `app/api/generate-thumbnail/route.ts`**

**Process:**
1. Download original image from URL
2. Resize to 400x400 WebP (75% quality)
3. Upload to `renderlab-images/thumbs/{userId}/{imageId}.webp`
4. Update DB record with `thumb_url`

**Code:**
```typescript
export async function POST(request: NextRequest) {
  const { imageUrl, imageId } = await request.json();

  // Download original
  const imageResponse = await fetch(imageUrl);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());

  // Resize with Sharp
  const thumbnailBuffer = await sharp(buffer)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
      kernel: sharp.kernel.lanczos3
    })
    .webp({ quality: 75, effort: 4 })
    .toBuffer();

  // Upload to storage
  const path = `thumbs/${userId}/${imageId}.webp`;
  await supabase.storage
    .from('renderlab-images')
    .upload(path, thumbnailBuffer, {
      contentType: 'image/webp',
      upsert: true
    });

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('renderlab-images')
    .getPublicUrl(path);

  // Update DB record
  await supabase
    .from('images')
    .update({ thumb_url: publicUrl })
    .eq('id', imageId);
}
```

---

### Storage Structure

```
renderlab-images/
├── {userId}/
│   ├── generated_1731567890123.png      (full image)
│   ├── edited_1731567891234.png
│   └── collection_xyz_1731567892345.png
└── thumbs/
    └── {userId}/
        ├── {imageId-1}.webp             (400x400 thumbnail)
        ├── {imageId-2}.webp
        └── {imageId-3}.webp
```

---

### How Thumbnails Are Used in UI

**History page displays thumbnails when available:**

```typescript
// From: lib/context/HistoryContext.tsx
const { data: images } = await supabase
  .from('images')
  .select('id, name, url, thumb_url, reference_url, prompt, created_at')
  .eq('user_id', user.id);

// In UI component
<img 
  src={image.thumb_url || image.url}  // ✅ Fallback to full image if thumb not ready
  alt={image.name}
/>
```

**Benefits:**
- ✅ Faster page load (400x400 WebP vs 1024x1024 PNG)
- ✅ Lower bandwidth usage
- ✅ Graceful degradation (shows full image if thumb unavailable)

---

## 3. STORAGE UPLOAD FLOW

### 🔄 Complete Journey: External URL → Permanent Supabase URL

---

### Flow 1: User Uploads Image

**Step 1: User drags file from desktop**
```typescript
// Frontend: components/workspace/ImageUploadPanel.tsx
const handleDrop = (e: DragEvent) => {
  const file = e.dataTransfer.files[0];
  
  // Option A: Upload immediately to storage
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const { output } = await response.json();
  setUploadedImage(output.publicUrl); // ✅ Permanent Supabase URL
};

// Option B: Create blob URL for preview (not uploaded yet)
const reader = new FileReader();
reader.onload = (e) => {
  setUploadedImage(e.target.result); // ✅ Blob URL (blob:http://...)
};
reader.readAsDataURL(file);
```

**Step 2: Backend uploads to storage**
```typescript
// Backend: app/api/upload/route.ts
const formData = await req.formData();
const file = formData.get("file") as File;

const fileName = `${Date.now()}_${file.name}`;
const { data } = await supabase.storage
  .from("renderlab-images")
  .upload(`${userId}/${fileName}`, file);

const { data: { publicUrl } } = supabase.storage
  .from("renderlab-images")
  .getPublicUrl(`${userId}/${fileName}`);

// ✅ publicUrl = "https://{supabase-url}/storage/v1/object/public/renderlab-images/{userId}/{fileName}"
```

---

### Flow 2: Replicate Returns Result URL

**Step 1: API calls Replicate**
```typescript
const result = await generateSingle({
  prompt: "modern house",
  imageUrl: referenceImageUrl
});

// result.url = "https://replicate.delivery/pbxt/abc123.png"
// ⚠️ Temporary URL (expires in ~1 hour)
```

**Step 2: Backend downloads and re-uploads**
```typescript
const replicateUrl = result.url;

// Download from Replicate and upload to Supabase
const permanentUrl = await uploadImageToStorage(
  replicateUrl,
  user.id,
  `generated_${Date.now()}.png`
);

// ✅ permanentUrl = "https://{supabase-url}/storage/v1/object/public/renderlab-images/{userId}/generated_1731567890123.png"
```

---

### Flow 3: `uploadImageToStorage` Implementation

**From: `lib/utils/uploadToStorage.ts`**

```typescript
export async function uploadImageToStorage(
  imageUrl: string | URL,      // External URL (Replicate, user URL, etc.)
  userId: string,               // User ID for folder organization
  fileName?: string             // Optional custom filename
): Promise<string | null> {
  
  // 1. Download image from external URL
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  
  // 2. Generate unique filename
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const extension = imageUrl.split('.').pop()?.split('?')[0] || 'png';
  const finalFileName = fileName || `${timestamp}_${randomId}.${extension}`;
  
  // 3. Upload to Supabase Storage
  const filePath = `${userId}/${finalFileName}`;
  const { data, error } = await supabase.storage
    .from('renderlab-images')
    .upload(filePath, blob, {
      contentType: blob.type,
      cacheControl: '3600',
      upsert: false
    });
  
  // 4. Get permanent public URL
  const { data: { publicUrl } } = supabase.storage
    .from('renderlab-images')
    .getPublicUrl(filePath);
  
  return publicUrl;
  // ✅ Returns: "https://{supabase-url}/storage/v1/object/public/renderlab-images/{userId}/{fileName}"
}
```

---

### Key Characteristics

| Stage | URL Type | Lifespan | Example |
|-------|----------|----------|---------|
| **User uploads file** | Blob URL | Browser session | `blob:http://localhost:3000/abc-123` |
| **After `/api/upload`** | Supabase URL | Permanent | `https://xyz.supabase.co/storage/.../file.png` |
| **Replicate output** | Replicate CDN | ~1 hour | `https://replicate.delivery/pbxt/abc123.png` |
| **After `uploadImageToStorage`** | Supabase URL | Permanent | `https://xyz.supabase.co/storage/.../generated.png` |

**Why convert Replicate URLs to Supabase?**
1. ✅ **Persistence:** Replicate URLs expire, Supabase URLs are permanent
2. ✅ **Ownership:** Images stored in our bucket, not external CDN
3. ✅ **Control:** Can delete, manage, apply storage policies
4. ✅ **Performance:** Thumbnails generated from permanent storage
5. ✅ **Reliability:** No dependency on Replicate's CDN availability

---

## 4. RECOMMENDATIONS FOR INPAINT API

### 🎯 Recommended Pattern: Follow `/api/generate/edit`

**For your new `/api/inpaint/nano-banana` endpoint:**

---

### Option A: URL-Based (RECOMMENDED ✅)

**Why?** Matches existing pattern, minimal changes needed

**Frontend:**
```typescript
// Step 1: Upload canvas images to temporary storage
const uploadCanvasImage = async (canvas: HTMLCanvasElement, name: string) => {
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  
  const formData = new FormData();
  formData.append('file', blob, name);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  const { output } = await response.json();
  return output.publicUrl;
};

// Step 2: Get URLs for both image and mask
const imageUrl = await uploadCanvasImage(imageCanvasRef.current, 'image.png');
const maskUrl = await uploadCanvasImage(maskCanvasRef.current, 'mask.png');

// Step 3: Call inpaint API with URLs
const response = await fetch('/api/inpaint/nano-banana', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: imageUrl,        // ✅ URL string
    maskUrl: maskUrl,          // ✅ URL string
    prompt: inpaintPrompt,
    baseImageUrl: referenceImage // ✅ Original reference (optional)
  })
});
```

**Backend:**
```typescript
// app/api/inpaint/nano-banana/route.ts
export async function POST(req: Request) {
  const { imageUrl, maskUrl, prompt, baseImageUrl } = await req.json();
  
  // Pass URLs to Replicate (exact same as /api/generate/edit)
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    body: JSON.stringify({
      version: "google/nano-banana",
      input: {
        image: imageUrl,  // ✅ Replicate downloads from URL
        mask: maskUrl,
        prompt: prompt
      }
    })
  });
  
  // Poll for result
  const replicateUrl = result.output[0];
  
  // Upload to permanent storage
  const permanentUrl = await uploadImageToStorage(
    replicateUrl,
    user.id,
    `inpaint_${Date.now()}.png`
  );
  
  // Save to DB
  await supabase.from("images").insert([{
    url: permanentUrl,
    reference_url: baseImageUrl || imageUrl,
    prompt: prompt
  }]);
  
  return NextResponse.json({ success: true, output: permanentUrl });
}
```

---

### Option B: Base64 (NOT RECOMMENDED ❌)

**Why not?**
- ❌ Large request payloads (1MB+ for typical image)
- ❌ Replicate API doesn't accept base64 (would need to convert to URL)
- ❌ Slower network transfer
- ❌ More complex error handling
- ❌ Different from existing patterns

**Only use if:**
- You can't upload to temporary storage
- You need synchronous processing (no upload step)

---

### Recommended Implementation Steps

**Phase 1: Minimal Changes**
1. Reuse `/api/generate/edit` endpoint as-is
2. Upload canvas images via `/api/upload`
3. Call `/api/generate/edit` with URLs
4. Display result

**Phase 2: Dedicated Endpoint (Optional)**
1. Create `/api/inpaint/nano-banana` endpoint
2. Copy logic from `/api/generate/edit`
3. Add inpaint-specific metadata (mask_url, inpaint_prompt)
4. Migrate frontend to new endpoint

**Phase 3: Optimizations**
1. Add mask caching (avoid re-uploading identical masks)
2. Store masks in separate `inpaint-masks` bucket
3. Add inpaint history tracking
4. Implement re-edit functionality

---

### Reference Image Handling

**Follow same pattern as `/api/generate`:**

```typescript
// Frontend passes reference image URL
const response = await fetch('/api/inpaint/nano-banana', {
  body: JSON.stringify({
    imageUrl: currentImageUrl,      // Image being edited
    maskUrl: maskUrl,               // Mask overlay
    prompt: inpaintPrompt,          // Inpainting instructions
    baseImageUrl: originalReference // ✅ Original source (for history tracking)
  })
});

// Backend saves to DB
await supabase.from("images").insert([{
  url: resultUrl,                   // Generated result
  reference_url: baseImageUrl,      // ✅ Link to original
  prompt: prompt                    // Inpainting prompt
}]);
```

**Why track `baseImageUrl`?**
- ✅ History shows "Edited from: [original image]"
- ✅ Can re-open original in inpaint tool
- ✅ Enables iteration tracking (v1 → v2 → v3)

---

## 5. CODE EXAMPLES

### Example 1: Frontend Call to `/api/generate`

```typescript
// From: app/workspace/page.tsx (line 166)

const handleGenerate = async (model: string) => {
  setIsGenerating(true);

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: prompt,                    // ✅ Text prompt
        model: model || "google/nano-banana",
        imageUrl: uploadedImage || null   // ✅ URL or null (not blob!)
      }),
    });

    const data = await response.json();

    if (data?.status === "succeeded" && data?.output?.imageUrl) {
      const nextImage = data.output.imageUrl;
      setPreviews((prev) => [...prev, nextImage]);
      await refreshHistory(); // ✅ Refresh to show new generation
      toast.success("✨ Generated successfully");
    }
  } catch (error) {
    console.error("Generation error:", error);
    toast.error("Generation failed");
  } finally {
    setIsGenerating(false);
  }
};
```

---

### Example 2: Backend `/api/generate/edit` Implementation

```typescript
// From: app/api/generate/edit/route.ts (complete flow)

export async function POST(req: Request) {
  const { imageUrl, maskUrl, prompt, baseImageUrl } = await req.json();
  
  // 1. Send to Replicate
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      version: "google/nano-banana",
      input: {
        image: imageUrl,   // ✅ Replicate downloads from URL
        mask: maskUrl,
        prompt: prompt || "restore and blend seamlessly"
      }
    })
  });
  
  // 2. Poll for result
  let result = await create.json();
  const getUrl = result.urls?.get;
  
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise((r) => setTimeout(r, 1000));
    const poll = await fetch(getUrl, {
      headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` }
    });
    result = await poll.json();
  }
  
  // 3. Upload to permanent storage
  const replicateUrl = result.output?.[0];
  const permanentUrl = await uploadImageToStorage(
    replicateUrl,
    user.id,
    `edited_${Date.now()}.png`
  );
  
  // 4. Save to database
  const { data: newImage } = await supabase
    .from("images")
    .insert([{
      user_id: user.id,
      name: `edited_${Date.now()}`,
      prompt: prompt,
      url: permanentUrl,
      reference_url: baseImageUrl || imageUrl
    }])
    .select()
    .single();
  
  // 5. Trigger thumbnail generation (fire-and-forget)
  if (newImage) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-thumbnail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: permanentUrl,
        imageId: newImage.id
      })
    }).catch(err => console.error('Thumbnail failed:', err));
  }
  
  // 6. Return success
  return NextResponse.json({
    success: true,
    output: permanentUrl,
    status: result.status
  });
}
```

---

### Example 3: `uploadImageToStorage` Usage

```typescript
// From: app/api/generate/route.ts (line 75)

// After Replicate returns result
const replicateUrl = result.url;
// Example: "https://replicate.delivery/pbxt/abc123xyz.png"

// Upload to permanent storage
const permanentUrl = await uploadImageToStorage(
  replicateUrl,              // ✅ External URL to download from
  user.id,                   // ✅ User ID for folder organization
  `generated_${Date.now()}.png` // ✅ Custom filename
);

// ✅ permanentUrl = "https://xyz.supabase.co/storage/v1/object/public/renderlab-images/user-123/generated_1731567890123.png"

// Save to database
await supabase.from("images").insert([{
  url: permanentUrl,         // ✅ Permanent URL (never expires)
  reference_url: referenceImageUrl
}]);
```

---

### Example 4: Complete Inpaint Flow (Recommended)

```typescript
// Frontend: components/inpaint/BottomToolbar.tsx
const handleGenerate = async () => {
  setIsGenerating(true);
  
  try {
    // Step 1: Upload canvas images to storage
    const uploadCanvas = async (canvas: HTMLCanvasElement, name: string) => {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      const formData = new FormData();
      formData.append('file', blob, name);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const { output } = await response.json();
      return output.publicUrl;
    };
    
    const imageUrl = await uploadCanvas(imageCanvasRef.current, 'image.png');
    const maskUrl = await uploadCanvas(maskCanvasRef.current, 'mask.png');
    
    // Step 2: Call inpaint API
    const response = await fetch('/api/generate/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: imageUrl,
        maskUrl: maskUrl,
        prompt: inpaintPrompt,
        baseImageUrl: originalImage // Track original for history
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Step 3: Display result on canvas
      const img = new Image();
      img.onload = () => {
        const ctx = imageCanvasRef.current.getContext('2d');
        ctx.drawImage(img, 0, 0);
        clearMask(); // Clear mask after success
      };
      img.src = result.output;
      
      // Step 4: Refresh history
      await refreshHistory();
      
      toast.success('Inpainting complete!');
    }
  } catch (error) {
    console.error('Inpaint error:', error);
    toast.error('Inpainting failed');
  } finally {
    setIsGenerating(false);
  }
};
```

---

## 🎯 Summary & Recommendations

### ✅ DO (Recommended Patterns)

1. **Send URLs in JSON** (not base64 or blobs)
2. **Upload canvases to `/api/upload` first** (get URLs)
3. **Pass URLs to Replicate** (they download)
4. **Use `uploadImageToStorage`** for Replicate results
5. **Trigger thumbnails asynchronously** (fire-and-forget)
6. **Save permanent URLs to database** (not temporary Replicate URLs)
7. **Track `reference_url` for history** (enables re-editing)

---

### ❌ DON'T (Anti-Patterns)

1. ❌ Don't send base64 in API requests (too large)
2. ❌ Don't send Blobs in JSON (not serializable)
3. ❌ Don't save Replicate URLs to DB (they expire)
4. ❌ Don't await thumbnail generation (blocks response)
5. ❌ Don't skip `uploadImageToStorage` (lose control)

---

### 📝 For `/api/inpaint/nano-banana`

**Recommended Implementation:**

```typescript
// Option 1: Reuse existing endpoint (fastest)
// Just call `/api/generate/edit` - it already does everything you need!

// Option 2: Create dedicated endpoint (cleaner)
// Copy `/api/generate/edit` logic, add inpaint-specific features:
// - Save mask_url to database
// - Add inpaint_prompt field
// - Track iteration history

// Either way, follow the URL-based pattern:
// Frontend → Upload canvases → Get URLs → Pass to API → API downloads → Process → Upload result
```

---

**Key Takeaway:**  
RenderLab's optimization strategy is **URL-based transfer with backend download/upload**, not direct binary transfer. This minimizes request size, leverages CDNs, and maintains consistency across all API routes.

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Purpose:** API optimization guide for inpaint feature integration
