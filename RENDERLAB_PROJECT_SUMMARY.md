# RenderLab Project Summary
**Comprehensive Technical Documentation for Inpainting Feature Integration**

Generated: November 14, 2025  
Repository: renderlab (AnnaPaskini/renderlab)  
Branch: ui-unification-v2

---

## Table of Contents
1. [Database Schema](#1-database-schema)
2. [File Storage Structure](#2-file-storage-structure)
3. [API Routes](#3-api-routes)
4. [Edit/Inpaint Implementation Status](#4-editinpaint-implementation-status)
5. [Key Utilities & Helpers](#5-key-utilities--helpers)
6. [State Management](#6-state-management)
7. [Environment Variables](#7-environment-variables)
8. [Current User Flows](#8-current-user-flows)
9. [File Structure](#9-file-structure)
10. [Integration Points for Inpaint](#10-integration-points-for-inpaint)

---

## 1. DATABASE SCHEMA

### Main Tables

#### **`images`** (Primary table for generated renders)
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,                    -- Permanent Supabase Storage URL
  thumb_url TEXT,                        -- Thumbnail URL (generated async)
  prompt TEXT,                           -- Generation prompt text
  reference_url TEXT,                    -- Reference image URL (for img2img)
  collection_id TEXT,                    -- Optional collection association
  hidden_from_preview BOOLEAN DEFAULT FALSE,  -- Hide from history/preview
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_created_at ON images(created_at DESC);
CREATE INDEX idx_images_reference_url ON images(reference_url);
CREATE INDEX idx_images_hidden_preview ON images(user_id, hidden_from_preview, created_at DESC) 
  WHERE hidden_from_preview = FALSE;
```

**Key Points:**
- `url`: Permanent storage URL in format: `https://{supabase-url}/storage/v1/object/sign/renderlab-images-v2/{userId}/{filename}?token=...`
- `reference_url`: Stores the reference image used for img2img generation (NULL for text-only)
- `hidden_from_preview`: Added for filtering preview images from history
- No `width`, `height`, or `metadata` columns yet (potential additions for inpainting)

---

#### **`prompts`** (Prompt Library feature)
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar_url TEXT,
  title TEXT NOT NULL CHECK (char_length(title) >= 10 AND char_length(title) <= 100),
  prompt TEXT NOT NULL CHECK (char_length(prompt) >= 50 AND char_length(prompt) <= 2000),
  image_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('exterior', 'interior', 'lighting', 'materials', 'atmosphere')),
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  badge TEXT CHECK (badge IN ('featured', 'trending', 'community-favorite')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prompts_user_id ON prompts(user_id);
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_created_at ON prompts(created_at DESC);
CREATE INDEX idx_prompts_status_created ON prompts(status, created_at DESC);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
```

---

#### **`prompt_likes`** (User likes for prompts)
```sql
CREATE TABLE prompt_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(prompt_id, user_id)
);

-- Indexes
CREATE INDEX idx_prompt_likes_prompt_id ON prompt_likes(prompt_id);
CREATE INDEX idx_prompt_likes_user_id ON prompt_likes(user_id);
```

---

#### **`credits`** (User credits - mentioned in API)
```sql
CREATE TABLE credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0
);
```

---

### Database Functions

#### **`create_prompt_with_limit`**
Atomically creates a prompt with a 5 pending prompts limit check.

```sql
CREATE OR REPLACE FUNCTION create_prompt_with_limit(
  p_user_id UUID,
  p_author_name TEXT,
  p_author_avatar_url TEXT,
  p_title TEXT,
  p_prompt TEXT,
  p_image_url TEXT,
  p_category TEXT,
  p_tags TEXT[]
) RETURNS UUID
```

---

#### **`toggle_prompt_like`**
Handles atomic like/unlike with race condition protection.

```sql
CREATE OR REPLACE FUNCTION toggle_prompt_like(
  p_prompt_id UUID,
  p_user_id UUID
) RETURNS JSON
```

---

#### **`get_user_history_grouped`**
Returns user's image history grouped by date.

```sql
CREATE OR REPLACE FUNCTION get_user_history_grouped(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
) RETURNS TABLE (
  date_group DATE,
  images_count INTEGER,
  images JSON
)
```

**Maps `url` → `image_url` in JSON output for frontend compatibility.**

---

### Row Level Security (RLS)

**Prompts Table:**
- Anyone can view approved prompts
- Users can view their own prompts (any status)
- Users can create/update/delete their own pending prompts

**Prompt Likes Table:**
- Users can view all likes
- Users can insert/delete their own likes

**Images Table:**
- RLS likely configured (not visible in migrations) - check Supabase dashboard
- Should allow: users to CRUD their own images

---

## 2. FILE STORAGE STRUCTURE

### Supabase Storage Buckets

#### **`renderlab-images-v2`** (Main image bucket)
- **Type:** Private bucket with RLS
- **Access:** Authenticated read/write via RLS policies
- **Folder Structure:**
  ```
  renderlab-images-v2/
  ├── {userId}/
  │   ├── generated_{timestamp}_{randomId}.png
  │   ├── edited_{timestamp}.png
  │   ├── collection_{collectionId}_{timestamp}_{index}.png
  │   └── {timestamp}_{filename}
  ```

**URL Format:**
```
https://{SUPABASE_URL}/storage/v1/object/sign/renderlab-images-v2/{userId}/{filename}?token=...
```

**Upload Process:**
1. Generate unique filename: `{timestamp}_{randomId}.{extension}`
2. Upload to path: `{userId}/{filename}`
3. Get signed URL via `supabase.storage.from('renderlab-images-v2').createSignedUrl(filePath, 3600)`

---

#### **`prompt-images`** (Prompt library images)
- **Type:** Public bucket
- **Folder Structure:**
  ```
  prompt-images/
  └── {userId}/
      └── {timestamp}.{ext}
  ```

**Used by:** Prompts Library feature for user-submitted prompt images

---

### Storage Utilities

**`lib/utils/uploadToStorage.ts`**

```typescript
export async function uploadImageToStorage(
  imageUrl: string | URL,
  userId: string,
  fileName?: string
): Promise<string | null>
```

**Process:**
1. Download image from remote URL (e.g., Replicate output)
2. Convert to Blob
3. Generate unique filename if not provided
4. Upload to `renderlab-images/{userId}/{filename}`
5. Return public URL

**Example Usage:**
```typescript
const permanentUrl = await uploadImageToStorage(
  replicateOutputUrl,
  user.id,
  `generated_${Date.now()}.png`
);
```

---

## 3. API ROUTES

### Generation Endpoints

#### **`POST /api/generate`** - Main generation endpoint
**Purpose:** Generate image from text prompt + optional reference image

**Request:**
```json
{
  "prompt": "modern architectural render",
  "model": "google/nano-banana",
  "imageUrl": "https://..." // optional reference image
}
```

**Response:**
```json
{
  "status": "succeeded",
  "output": { "imageUrl": "https://..." }
}
```

**Flow:**
1. Validate user auth
2. Call `generateSingle()` with Replicate
3. Upload result to Supabase Storage
4. Save to `images` table with `reference_url`
5. Trigger async thumbnail generation
6. Return permanent URL

**Dependencies:**
- `lib/generateSingle.ts` - Replicate API wrapper
- `lib/utils/uploadToStorage.ts` - Image storage
- `lib/supabaseServer.ts` - Auth & DB

---

#### **`POST /api/generate/edit`** - Inpainting endpoint
**Purpose:** Edit image with mask using google/nano-banana inpainting

**Request:**
```json
{
  "imageUrl": "https://...",        // Image to edit
  "maskUrl": "https://...",          // Mask image (white = inpaint)
  "prompt": "restore seamlessly",    // Inpainting prompt
  "baseImageUrl": "https://..."      // Original reference (optional)
}
```

**Response:**
```json
{
  "success": true,
  "output": "https://...",
  "status": "succeeded"
}
```

**Flow:**
1. Create Replicate prediction with `google/nano-banana`
2. Poll for completion (max 50 attempts, 1s interval)
3. Upload result to storage
4. Save to `images` table with `reference_url = baseImageUrl || imageUrl`
5. Trigger async thumbnail generation
6. Return permanent URL

**Key Code:**
```typescript
const create = await fetch("https://api.replicate.com/v1/predictions", {
  method: "POST",
  headers: {
    Authorization: `Token ${REPLICATE_API_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    version: "google/nano-banana",
    input: {
      image: imageUrl,
      mask: maskUrl,
      prompt: prompt || "restore and blend seamlessly",
    },
  }),
});
```

---

#### **`POST /api/generate/collection`** - Batch generation
**Purpose:** Generate multiple images from collection templates

**Request:**
```json
{
  "templates": [
    { "id": "1", "prompt": "...", "model": "google/nano-banana" }
  ],
  "baseImage": "https://...",     // Optional shared reference
  "collectionId": "uuid",
  "collectionName": "My Collection"
}
```

**Response:** NDJSON stream
```json
{"type":"start","total":5}
{"type":"progress","index":0,"status":"succeeded","url":"https://..."}
{"type":"done","succeeded":5,"failed":0}
```

**Flow:**
1. Validate auth & templates
2. Create readable stream
3. Process templates in parallel (p-limit: 5)
4. For each template:
   - Generate via `generateSingle()`
   - Upload to storage
   - Save to DB with `collection_id`
   - Stream progress event
5. Return stream

**Key Features:**
- Progress tracking
- Parallel processing (5 concurrent)
- Automatic retries
- Async thumbnail generation

---

### Upload & Image Management

#### **`POST /api/upload`** - Direct file upload
**Purpose:** Upload user files directly to storage

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "status": "succeeded",
  "output": { "publicUrl": "https://..." }
}
```

**Flow:**
1. Validate auth
2. Upload file to `renderlab-images/{timestamp}_{filename}`
3. Save to `images` table (no `prompt` or `reference_url`)
4. Trigger thumbnail generation
5. Return public URL

---

#### **`GET /api/images`** - Get user's images
**Purpose:** Fetch all images for current user

**Response:**
```json
{
  "images": [
    {
      "id": "uuid",
      "name": "...",
      "url": "...",
      "prompt": "...",
      "reference_url": "...",
      "created_at": "..."
    }
  ]
}
```

---

#### **`DELETE /api/images/[id]`** - Delete image
**Purpose:** Delete image from DB and storage

---

#### **`POST /api/images/[id]/hide`** - Hide from preview
**Purpose:** Toggle `hidden_from_preview` flag

---

### History & Credits

#### **`GET /api/history`** - Get generation history
**Purpose:** Fetch user's generation history

**Response:**
```json
{
  "history": [
    { "name": "...", "url": "...", "created_at": "..." }
  ]
}
```

---

#### **`GET /api/credits`** - Get user credits
**Purpose:** Fetch user's credit balance

**Response:**
```json
{ "balance": 1000 }
```

---

### Prompts Library

#### **`GET /api/prompts`** - Get prompts
**Query Params:** `category`, `badge`, `search`

---

#### **`POST /api/prompts/create`** - Create prompt
**Purpose:** Submit new prompt to library (pending approval)

---

#### **`POST /api/prompts/[id]/like`** - Toggle like
**Purpose:** Like/unlike a prompt

---

#### **`POST /api/admin/prompts/moderate`** - Moderate prompts (admin)
**Purpose:** Approve/reject prompts, assign badges

---

### Thumbnails

#### **`POST /api/generate-thumbnail`** - Generate thumbnail
**Purpose:** Create thumbnail for uploaded image (async)

**Request:**
```json
{
  "imageUrl": "https://...",
  "imageId": "uuid"
}
```

**Flow:**
1. Download original image
2. Resize to thumbnail (e.g., 256x256)
3. Upload to storage as `thumb_{imageId}.jpg`
4. Update `images` table `thumb_url` field
5. Uses Supabase Service Role Key for DB updates

---

## 4. EDIT/INPAINT IMPLEMENTATION STATUS

### Current Implementation

#### **Page: `/app/inpaint/page.tsx`**
**Status:** ✅ Fully implemented standalone inpaint UI

**Features:**
- Canvas-based drawing system
- Brush/Eraser/Lasso tools
- Undo/Redo functionality
- Mask visibility toggle
- Image upload via drag-and-drop
- Clear mask functionality
- Remove image functionality

**State Management:**
```typescript
const [image, setImage] = useState<string | null>(null);
const [brushSize, setBrushSize] = useState(40);
const [activeTool, setActiveTool] = useState<Tool>('brush');
const [inpaintPrompt, setInpaintPrompt] = useState('');
const [showMask, setShowMask] = useState(true);
const [hasMask, setHasMask] = useState(false);
const [referenceImage, setReferenceImage] = useState<string | null>(null);
const [canUndo, setCanUndo] = useState(false);
const [canRedo, setCanRedo] = useState(false);
```

---

### Components

#### **`components/inpaint/CanvasArea.tsx`**
**Purpose:** Main canvas rendering and interaction

**Features:**
- Triple-canvas setup:
  - `imageCanvas`: Displays base image
  - `maskCanvas`: Red mask overlay
  - `drawCanvas`: Active drawing layer
- Brush stroke smoothing (interpolated lines)
- Lasso tool (polygon selection)
- Drag-and-drop image upload
- Canvas scaling to fit viewport

**Key Code:**
```typescript
const drawBrushStroke = (ctx, x, y, lastX?, lastY?) => {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = brushSize;
  ctx.strokeStyle = 'rgba(255, 70, 70, 1)'; // Solid red
  // ... draw smooth line
};
```

---

#### **`components/inpaint/BrushControls.tsx`**
**Purpose:** Brush size slider UI

---

#### **`components/inpaint/TopControls.tsx`**
**Purpose:** Top toolbar (e.g., title, close button)

---

#### **`components/inpaint/ToolIconsBar.tsx`**
**Purpose:** Tool selection sidebar (Brush, Eraser, Lasso, Undo, Redo, Clear)

---

#### **`components/inpaint/BottomToolbar.tsx`**
**Purpose:** Prompt input and Generate button

**Key Features:**
- Prompt text input
- Generate button (disabled if no mask)
- Character count indicator

---

### Integration with Generation API

**Status:** ⚠️ Partially implemented

**Current API Call:**
- Uses `/api/generate/edit` endpoint
- Sends `imageUrl`, `maskUrl`, `prompt`, `baseImageUrl`

**Missing Pieces:**
1. Canvas → Blob → Upload → URL conversion
2. Mask canvas → Blob → Upload → URL conversion
3. Error handling & loading states
4. Result display & history integration

**Expected Integration Code:**
```typescript
// Convert canvas to Blob
const imageBlob = await new Promise<Blob>((resolve) => {
  imageCanvas.toBlob(resolve, 'image/png');
});

const maskBlob = await new Promise<Blob>((resolve) => {
  maskCanvas.toBlob(resolve, 'image/png');
});

// Upload to temporary storage or convert to data URL
const imageDataUrl = imageCanvas.toDataURL('image/png');
const maskDataUrl = maskCanvas.toDataURL('image/png');

// Call API
const response = await fetch('/api/generate/edit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: imageDataUrl,
    maskUrl: maskDataUrl,
    prompt: inpaintPrompt,
    baseImageUrl: referenceImage
  })
});
```

---

## 5. KEY UTILITIES & HELPERS

### Image Processing

#### **`lib/utils/uploadToStorage.ts`**
```typescript
// Upload remote URL to Supabase Storage
export async function uploadImageToStorage(
  imageUrl: string | URL,
  userId: string,
  fileName?: string
): Promise<string | null>

// Delete image from storage
export async function deleteImageFromStorage(url: string): Promise<boolean>
```

---

### Replicate API Wrapper

#### **`lib/generateSingle.ts`**
**Purpose:** Core generation logic for all endpoints

```typescript
export async function generateSingle({
  prompt,
  model,
  imageUrl,
}: {
  prompt: string;
  model?: string;
  imageUrl?: string | null;
}): Promise<{ status: string; url?: string; message?: string }>
```

**Features:**
- Supports text-only and img2img generation
- Handles reference images via `image_input` array
- Matches aspect ratio to reference image
- Returns output URL or error message

**Key Code:**
```typescript
const input: Record<string, any> = { prompt };

if (imageUrl) {
  input.image_input = [imageUrl]; // nano-banana uses array format
  input.aspect_ratio = "match_input_image";
  input.output_format = "jpg";
}

const output = await replicate.run(
  `${model || "google/nano-banana"}` as `${string}/${string}`,
  { input }
);
```

---

### Supabase Clients

#### **`lib/supabase.ts`** - Client-side (browser)
```typescript
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

---

#### **`lib/supabaseServer.ts`** - Server-side (API routes)
```typescript
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* async cookie handlers */ } }
  );
}
```

---

#### **`lib/supabaseClient.ts`** - Alternative server client
```typescript
export async function createServer() {
  // Similar to supabaseServer.ts
}
```

---

### Database Utilities

#### **`lib/db/prompts.ts`**
**Purpose:** Prompts library database queries

```typescript
export async function getPrompts(filters?: PromptFilters): Promise<Prompt[]>
export async function createPrompt(data: CreatePromptData): Promise<Prompt>
```

---

### Collections (LocalStorage)

#### **`lib/useCollections.ts`**
**Purpose:** Client-side collection management (stored in localStorage)

```typescript
export interface Collection {
  id: string;
  title: string;
  templates: any[];
  createdAt: string;
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  // CRUD operations: createCollection, deleteCollection, addTemplate, removeTemplate
}
```

**Storage Key:** `RenderLab_collections`

---

### Type Definitions

#### **`lib/types/database.ts`**
```typescript
export interface Template {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: string;
  image_url: string;
  thumb_url?: string | null;
  reference_url: string | null;
  created_at: string;
}
```

---

## 6. STATE MANAGEMENT

### React Context Architecture

#### **`lib/context/HistoryContext.tsx`**
**Purpose:** Global history state for user's generated images

**Provides:**
```typescript
interface HistoryContextType {
  groups: GroupedData[];      // Images grouped by date
  loading: boolean;
  hasMore: boolean;
  error: DatabaseError | null;
  loadMore: () => void;
  refresh: (includeHidden?: boolean) => Promise<void>;
}
```

**Data Flow:**
1. Fetch images from `images` table
2. Group by date (YYYY-MM-DD)
3. Filter out `hidden_from_preview = true`
4. Paginate (20 per page)
5. Provide `refresh()` for re-fetching after generation

**Usage:**
```typescript
const { groups, loading, refresh } = useHistory();

// After generation
await refresh();
```

---

#### **`lib/context/WorkspaceContext.tsx`**
**Purpose:** Track active item being edited in workspace

**Provides:**
```typescript
interface WorkspaceContextType {
  activeItem: ActiveItem;
  loadTemplate: (template: Template) => void;
  loadCollection: (collection: CollectionWithTemplates) => void;
  loadTemporary: (prompt: string, reference_url: string | null) => void;
  clear: () => void;
}

type ActiveItem = 
  | { type: 'template'; data: Template }
  | { type: 'collection'; data: CollectionWithTemplates }
  | { type: 'temporary'; data: { prompt: string; reference_url: string | null } }
  | { type: null; data: null };
```

**Data Flow:**
1. User clicks on template/collection/history item
2. Context loads item data
3. Workspace UI updates to show item details
4. User makes edits and generates

**Usage:**
```typescript
const { activeItem, loadTemporary } = useWorkspace();

// Load from history
loadTemporary(prompt, reference_url);

// In workspace component
if (activeItem.type === 'temporary') {
  setUploadedImage(activeItem.data.reference_url);
}
```

---

### Component State Patterns

#### **Workspace Page (`app/workspace/page.tsx`)**
**Local State:**
- `uploadedImage`: Current reference image URL
- `prompt`: Text prompt
- `previews`: Array of generated image URLs
- `isGenerating`: Loading state

**Parent-Child Data Flow:**
```
WorkspacePage
  ├─> WorkspaceLayout (layout wrapper)
  │   ├─> PromptBuilderPanel (left panel)
  │   │   └─ Sends: onGenerate(model) → parent
  │   ├─> ImageUploadPanel (right panel)
  │   │   └─ Sends: onImageChange(url) → parent
  │   └─> Recent history preview (bottom)
  │
  └─> Calls: /api/generate → Updates previews → Calls refresh()
```

---

#### **Prompt Builder (`components/workspace/PromptBuilderPanelNew.tsx`)**
**Complex state:**
- Template/Collection management
- Collection batch generation progress
- Stream processing for collection generation
- Dialog states for template management

**Key Hooks:**
```typescript
const { collections } = useCollections();           // LocalStorage
const { activeItem, loadTemplate } = useWorkspace(); // Context
const [templates, setTemplates] = useState([]);
const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
```

---

## 7. ENVIRONMENT VARIABLES

### Required Variables

```bash
# Supabase Configuration (Client-side & Server-side)
NEXT_PUBLIC_SUPABASE_URL=https://{project-id}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY={anon-key}

# Supabase Service Role (Server-side only - for thumbnails)
SUPABASE_URL=https://{project-id}.supabase.co
SUPABASE_SERVICE_ROLE_KEY={service-role-key}
SUPABASE_ANON_KEY={anon-key}

# Replicate API
REPLICATE_API_TOKEN={replicate-token}

# Application URL (for thumbnail generation callback)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

---

### Usage Patterns

**Client-side (React components):**
```typescript
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**Server-side (API routes):**
```typescript
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});
```

**Service Role (Admin operations):**
```typescript
const adminSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

---

## 8. CURRENT USER FLOWS

### Flow 1: Text-to-Image Generation

**Path:** `/workspace`

1. User enters prompt in Prompt Builder
2. (Optional) User selects template or loads from library
3. (Optional) User uploads reference image
4. User clicks "Generate"
5. System calls `POST /api/generate` with:
   ```json
   { "prompt": "...", "model": "google/nano-banana", "imageUrl": "..." }
   ```
6. API generates via Replicate → Uploads to storage → Saves to DB
7. Result added to `previews` array
8. History refreshed via `HistoryContext.refresh()`
9. User sees new image in workspace preview + history panel

---

### Flow 2: Collection Batch Generation

**Path:** `/workspace` → Custom tab → Collections

1. User creates collection in CollectionsPanel
2. User adds templates to collection (drag-and-drop or picker)
3. User selects collection in Prompt Builder
4. User uploads base image (required for collections)
5. User clicks "Generate Collection"
6. System calls `POST /api/generate/collection` with:
   ```json
   {
     "templates": [...],
     "baseImage": "...",
     "collectionId": "...",
     "collectionName": "..."
   }
   ```
7. API streams NDJSON progress events
8. Frontend updates progress bar and previews in real-time
9. Completed images saved to DB with `collection_id`
10. History refreshed

---

### Flow 3: Prompt Library → Workspace

**Path:** `/prompts` → Click "Use Prompt" → `/workspace?prompt=...`

1. User browses Prompts Library (`/prompts`)
2. User clicks "Use Prompt" button on a prompt
3. Redirected to `/workspace?prompt={encodedPrompt}&additionalPrompt={encodedPrompt}`
4. Workspace page detects URL params
5. Loads prompt into Prompt Builder
6. Shows toast notification
7. User can immediately generate or edit prompt

---

### Flow 4: History → Re-edit

**Path:** `/history` → Click image → Load in workspace

1. User views generation history (`/history`)
2. User clicks on a previous generation
3. System calls `WorkspaceContext.loadTemporary(prompt, reference_url)`
4. Workspace loads:
   - Prompt text
   - Reference image (if any)
5. User can edit and re-generate

---

### Flow 5: Inpainting (Current Standalone)

**Path:** `/inpaint`

1. User navigates to `/inpaint`
2. User uploads/drags image onto canvas
3. User selects Brush tool
4. User paints red mask over areas to inpaint
5. User enters inpainting prompt (e.g., "restore seamlessly")
6. User clicks "Generate"
7. **⚠️ NOT YET CONNECTED:** Should call `/api/generate/edit`
8. **Expected:** Result replaces image on canvas
9. **Expected:** Saved to history

---

## 9. FILE STRUCTURE

### Key Directories

```
renderlab/
├── app/                          # Next.js app directory (routes)
│   ├── (auth)/                  # Auth routes (login, signup, etc.)
│   ├── (marketing)/             # Landing pages
│   ├── api/                     # API routes
│   │   ├── generate/
│   │   │   ├── route.ts         # Main generation
│   │   │   ├── edit/route.ts    # Inpainting
│   │   │   └── collection/route.ts  # Batch generation
│   │   ├── upload/route.ts      # Direct file upload
│   │   ├── images/              # Image CRUD
│   │   ├── history/route.ts     # History
│   │   ├── credits/route.ts     # Credits
│   │   ├── prompts/             # Prompts library
│   │   └── generate-thumbnail/route.ts
│   ├── workspace/               # Main workspace page
│   │   └── page.tsx
│   ├── inpaint/                 # Inpaint standalone page
│   │   └── page.tsx
│   ├── history/                 # History page
│   │   └── page.tsx
│   ├── prompts/                 # Prompts library page
│   │   └── page.tsx
│   ├── collections/             # Collections page
│   │   └── page.tsx
│   ├── custom/                  # Custom templates page
│   │   └── page.tsx
│   └── layout.tsx               # Root layout
│
├── components/                   # React components
│   ├── workspace/               # Workspace-specific components
│   │   ├── WorkspaceLayout.tsx  # Main layout wrapper
│   │   ├── PromptBuilderPanelNew.tsx  # Prompt builder
│   │   ├── ImageUploadPanel.tsx # Image upload UI
│   │   ├── CollectionPanel.tsx  # Collections management
│   │   ├── PromptTemplates.tsx  # Templates management
│   │   └── PanelWrapper.tsx     # Panel styling wrapper
│   ├── inpaint/                 # Inpaint components
│   │   ├── CanvasArea.tsx       # Main canvas
│   │   ├── BrushControls.tsx    # Brush size slider
│   │   ├── TopControls.tsx      # Top toolbar
│   │   ├── ToolIconsBar.tsx     # Tool selection sidebar
│   │   └── BottomToolbar.tsx    # Prompt input + Generate
│   ├── prompts/                 # Prompts library components
│   ├── ui/                      # Reusable UI components (Radix UI)
│   ├── layout/                  # Layout components
│   └── navbar/                  # Navigation
│
├── lib/                          # Utilities & helpers
│   ├── generateSingle.ts        # Replicate API wrapper
│   ├── supabase.ts              # Client-side Supabase
│   ├── supabaseServer.ts        # Server-side Supabase
│   ├── supabaseClient.ts        # Alternative server client
│   ├── useCollections.ts        # Collections hook (localStorage)
│   ├── context/
│   │   ├── HistoryContext.tsx   # History state
│   │   └── WorkspaceContext.tsx # Active item state
│   ├── db/
│   │   └── prompts.ts           # Prompts DB queries
│   ├── hooks/
│   │   ├── useCollections.ts    # Collections hook (DB)
│   │   └── useTemplates.ts      # Templates hook
│   ├── types/
│   │   ├── database.ts          # DB type definitions
│   │   └── prompts.ts           # Prompts types
│   └── utils/
│       └── uploadToStorage.ts   # Storage utilities
│
├── supabase/
│   └── migrations/              # Database migrations
│       ├── create_prompts_functions.sql
│       ├── add_reference_url_to_images.sql
│       ├── add_hidden_from_preview.sql
│       └── update_get_user_history_grouped.sql
│
├── public/                       # Static assets
│   └── logos/
│
├── package.json                  # Dependencies
├── next.config.mjs              # Next.js config
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind config
└── README.md                    # Project docs
```

---

## 10. INTEGRATION POINTS FOR INPAINT

### Where Inpainting Will Connect

#### **1. API Integration**

**Existing Endpoint:** `/api/generate/edit`
- ✅ Already implemented and working
- ✅ Handles image + mask → Replicate → Storage → DB
- ⚠️ Needs to be called from `/inpaint` page

**Required Changes:**
```typescript
// In components/inpaint/BottomToolbar.tsx or CanvasArea.tsx

const handleGenerate = async () => {
  setIsGenerating(true);
  
  // 1. Convert canvases to Blobs
  const imageBlob = await new Promise<Blob>((resolve) => {
    imageCanvasRef.current.toBlob(resolve, 'image/png');
  });
  
  const maskBlob = await new Promise<Blob>((resolve) => {
    maskCanvasRef.current.toBlob(resolve, 'image/png');
  });
  
  // 2. Upload to temporary storage or use data URLs
  // Option A: Data URLs (simple but large)
  const imageDataUrl = imageCanvasRef.current.toDataURL('image/png');
  const maskDataUrl = maskCanvasRef.current.toDataURL('image/png');
  
  // Option B: Upload to Supabase Storage first (cleaner)
  const imageUrl = await uploadImageToStorage(imageBlob, user.id, `temp_image_${Date.now()}.png`);
  const maskUrl = await uploadImageToStorage(maskBlob, user.id, `temp_mask_${Date.now()}.png`);
  
  // 3. Call API
  const response = await fetch('/api/generate/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl,
      maskUrl,
      prompt: inpaintPrompt,
      baseImageUrl: referenceImage // Store original reference
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // 4. Update canvas with result
    const img = new Image();
    img.onload = () => {
      const ctx = imageCanvasRef.current.getContext('2d');
      ctx.drawImage(img, 0, 0);
      clearMask(); // Clear mask after successful generation
      toast.success('Inpainting complete!');
    };
    img.src = result.output;
    
    // 5. Refresh history
    await refreshHistory();
  } else {
    toast.error('Inpainting failed: ' + result.error);
  }
  
  setIsGenerating(false);
};
```

---

#### **2. Database Extensions**

**Recommended:** Add inpainting metadata to `images` table

```sql
ALTER TABLE images 
ADD COLUMN inpaint_base_id UUID REFERENCES images(id) ON DELETE SET NULL,
ADD COLUMN mask_url TEXT,
ADD COLUMN inpaint_prompt TEXT;

CREATE INDEX idx_images_inpaint_base ON images(inpaint_base_id);
```

**Purpose:**
- `inpaint_base_id`: Link to original image (for history tracking)
- `mask_url`: Store mask for re-editing
- `inpaint_prompt`: Store inpainting prompt separately

---

#### **3. History Integration**

**Add to `/history` page:**
- Display inpainted images with "Edited" badge
- Show original image vs edited image comparison
- Allow re-opening in inpaint tool

**Code:**
```typescript
// In history page
const handleReopenInInpaint = (image: GeneratedImage) => {
  router.push(`/inpaint?imageUrl=${encodeURIComponent(image.image_url)}`);
};
```

---

#### **4. Workspace Integration**

**Add "Edit" button to workspace preview images:**

```typescript
// In components/workspace/WorkspaceLayout.tsx
const handleEditImage = (imageUrl: string) => {
  router.push(`/inpaint?imageUrl=${encodeURIComponent(imageUrl)}`);
};

// In preview card
<button onClick={() => handleEditImage(img.image_url)}>
  <PencilIcon /> Edit
</button>
```

---

#### **5. Inpaint Page Enhancements**

**Add to `/app/inpaint/page.tsx`:**

1. **Load image from URL params:**
```typescript
useEffect(() => {
  const imageUrl = searchParams.get('imageUrl');
  if (imageUrl) {
    setImage(decodeURIComponent(imageUrl));
  }
}, [searchParams]);
```

2. **Add "Back to Workspace" button:**
```typescript
<button onClick={() => router.push('/workspace')}>
  <ArrowLeftIcon /> Back to Workspace
</button>
```

3. **Add "Save to Collection" after generation:**
```typescript
const handleSaveToCollection = async (collectionId: string) => {
  // Add current image to collection
};
```

---

#### **6. Storage Bucket for Masks**

**Option A:** Use existing `renderlab-images` bucket
- Store masks as `{userId}/mask_{timestamp}.png`

**Option B:** Create dedicated `inpaint-masks` bucket
```sql
-- In Supabase Dashboard → Storage
CREATE BUCKET inpaint-masks (public: true)
```

**Recommended:** Option A (simplicity)

---

#### **7. UI/UX Improvements**

**Add to inpaint UI:**
- ✅ Loading state during generation (spinner on canvas)
- ✅ Progress indicator for long generations
- ✅ Result preview before saving
- ✅ "Download" button for result
- ✅ "Regenerate" button to try again with same mask
- ✅ History of inpaint iterations

---

### Recommended Implementation Order

1. **Phase 1: Basic Integration**
   - Connect Generate button to `/api/generate/edit`
   - Handle canvas → blob → upload → API call
   - Display result on canvas
   - Add loading states

2. **Phase 2: History Integration**
   - Save inpainted images to DB
   - Show in history page with "Edited" badge
   - Add "Re-edit" button in history

3. **Phase 3: Workspace Integration**
   - Add "Edit" button to workspace previews
   - Deep link to inpaint page with image URL
   - Add "Back to Workspace" navigation

4. **Phase 4: Advanced Features**
   - Mask storage for re-editing
   - Inpainting history (iterations)
   - Collection integration
   - Batch inpainting

5. **Phase 5: Polish**
   - Undo/Redo persistence
   - Keyboard shortcuts
   - Touch device support
   - Mobile responsive design

---

## Summary

This document provides a complete technical overview of RenderLab's architecture, focusing on:

1. **Database:** `images`, `prompts`, `prompt_likes`, `credits` tables with RLS and functions
2. **Storage:** `renderlab-images` and `prompt-images` buckets with user-based folder structure
3. **API Routes:** 15+ endpoints for generation, upload, history, prompts, and inpainting
4. **Inpaint UI:** Fully implemented canvas-based tool (needs API integration)
5. **Utilities:** Image upload, Replicate wrapper, Supabase clients, collections management
6. **State:** React Context for history and workspace active items
7. **Environment:** Supabase + Replicate API keys required
8. **User Flows:** Text-to-image, collection generation, prompt library, history re-editing
9. **File Structure:** Next.js app directory with modular components
10. **Integration Points:** Clear roadmap for connecting inpaint feature to existing architecture

**Next Steps:**
- Implement inpaint API integration (Phase 1)
- Add database columns for inpaint metadata
- Integrate with history and workspace
- Polish UI/UX

**Key Dependencies:**
- Replicate API (google/nano-banana model)
- Supabase (auth, storage, database)
- Next.js 16 (app directory, server actions)
- React 19 (hooks, context)
- Tailwind CSS + Radix UI (styling)

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Author:** Claude (AI Assistant)  
**Purpose:** Technical specification for Nano Banana inpainting feature integration
