# RenderLabToast System

## Overview
A theme-aware toast notification system built on top of Sonner, providing consistent styling across light/dark modes with helper functions for common notification types.

## Features
- ✅ Light/dark theme support via CSS custom properties
- ✅ Success, error, info, warning variants
- ✅ Promise toast for async operations
- ✅ Auto-dismiss with configurable duration
- ✅ Rich colors and icons
- ✅ Close button
- ✅ SSR-safe (Next.js compatible)
- ✅ No hydration issues

## Setup

The Toaster component should already be added to your root layout (`app/layout.tsx`):

```tsx
import { Toaster } from "@/components/ui/sonner";

<Toaster position="bottom-right" />
```

## Usage

### Import
```tsx
import { showToast } from "@/components/ui/RenderLabToast";
```

### Success Toast
```tsx
showToast.success("Operation completed successfully!");
```

### Error Toast
```tsx
showToast.error("Something went wrong!");
```

### Info Toast
```tsx
showToast.info("This is an informational message");
```

### Warning Toast
```tsx
showToast.warning("Please review your input");
```

### With Custom Options
```tsx
showToast.success("Saved!", {
  duration: 3000,
  position: "top-center",
});
```

## Promise Toast

For async operations:

```tsx
const uploadPromise = uploadFile(file);

showToast.promise(uploadPromise, {
  loading: "Uploading file...",
  success: "File uploaded successfully!",
  error: "Upload failed",
});
```

### With Dynamic Messages
```tsx
showToast.promise(fetchData(), {
  loading: "Loading...",
  success: (data) => `Loaded ${data.length} items`,
  error: (err) => `Error: ${err.message}`,
});
```

## Theme Styling

### Current Theme Tokens
```typescript
{
  background: "var(--rl-surface)",
  color: "var(--rl-text)",
  border: "1px solid var(--rl-border)",
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "14px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
}
```

### Customization
All `showToast` methods accept Sonner's `ExternalToast` options:

```tsx
showToast.success("Custom toast", {
  duration: 5000,
  position: "top-right",
  className: "custom-class",
  style: {
    // Override specific styles
    fontSize: "16px",
  },
});
```

## API Reference

### showToast.success(message, options?)
Shows a success toast with a checkmark icon.

**Parameters:**
- `message: string` - The message to display
- `options?: ExternalToast` - Optional Sonner options

**Example:**
```tsx
showToast.success("Profile updated!");
```

### showToast.error(message, options?)
Shows an error toast with an error icon.

**Parameters:**
- `message: string` - The error message
- `options?: ExternalToast` - Optional Sonner options

**Example:**
```tsx
showToast.error("Failed to save changes");
```

### showToast.info(message, options?)
Shows an informational toast.

**Parameters:**
- `message: string` - The info message
- `options?: ExternalToast` - Optional Sonner options

**Example:**
```tsx
showToast.info("New features available");
```

### showToast.warning(message, options?)
Shows a warning toast.

**Parameters:**
- `message: string` - The warning message
- `options?: ExternalToast` - Optional Sonner options

**Example:**
```tsx
showToast.warning("Unsaved changes will be lost");
```

### showToast.promise(promise, messages)
Shows a toast that updates based on promise state.

**Parameters:**
- `promise: Promise<T>` - The promise to track
- `messages: { loading, success, error }` - Messages for each state

**Example:**
```tsx
showToast.promise(
  deleteItem(id),
  {
    loading: "Deleting...",
    success: "Item deleted",
    error: "Delete failed",
  }
);
```

## Integration Examples

### With Forms
```tsx
async function handleSubmit(data) {
  try {
    await saveData(data);
    showToast.success("Form submitted successfully!");
  } catch (error) {
    showToast.error(error.message || "Submission failed");
  }
}
```

### With Modal
```tsx
<RenderLabButton 
  onClick={() => {
    setModalOpen(false);
    showToast.success("Settings saved!");
  }}
>
  Save
</RenderLabButton>
```

### With Async Actions
```tsx
async function generateImage() {
  const promise = fetch("/api/generate", { method: "POST" });
  
  showToast.promise(promise, {
    loading: "Generating image...",
    success: "Image generated!",
    error: "Generation failed",
  });
  
  const result = await promise;
  return result.json();
}
```

### With Delete Confirmation
```tsx
function handleDelete() {
  if (confirm("Are you sure?")) {
    showToast.promise(
      deleteCollection(id),
      {
        loading: "Deleting collection...",
        success: "Collection deleted",
        error: "Failed to delete",
      }
    );
  }
}
```

## Common Patterns

### Multi-step Operations
```tsx
async function importData() {
  showToast.info("Starting import...");
  
  try {
    await step1();
    showToast.info("Processing data...");
    
    await step2();
    showToast.info("Finalizing...");
    
    await step3();
    showToast.success("Import complete!");
  } catch (error) {
    showToast.error("Import failed");
  }
}
```

### Conditional Messages
```tsx
const count = items.length;
showToast.success(
  count === 1 
    ? "1 item added" 
    : `${count} items added`
);
```

### With Actions
```tsx
showToast.success("File uploaded", {
  action: {
    label: "View",
    onClick: () => navigate("/files"),
  },
});
```

## Configuration Options

All toast methods support these Sonner options:

| Option | Type | Description |
|--------|------|-------------|
| `duration` | `number` | Auto-dismiss time (ms) |
| `position` | `string` | Toast position |
| `dismissible` | `boolean` | Can be manually dismissed |
| `action` | `object` | Action button |
| `cancel` | `object` | Cancel button |
| `onDismiss` | `function` | Callback on dismiss |
| `onAutoClose` | `function` | Callback on auto-close |
| `className` | `string` | Custom CSS class |
| `style` | `object` | Inline styles |

## Accessibility

- **Close button** - Always visible (via Toaster config)
- **Rich colors** - Icons and colors for context
- **Keyboard** - ESC to dismiss
- **Screen readers** - Announced via ARIA live regions
- **Focus management** - Doesn't steal focus

## SSR / Hydration

✅ **Next.js Safe**
- Toaster rendered client-side only
- No hydration mismatches
- Uses `"use client"` directive

**In layout.tsx:**
```tsx
<Toaster 
  position="bottom-right"
  toastOptions={toastConfig}
/>
```

## Performance

- **Lazy loading** - Only loads when used
- **Portal rendering** - Doesn't affect layout
- **Auto cleanup** - Removes dismissed toasts
- **Pooling** - Reuses toast elements

## Troubleshooting

### Toast not appearing
- Check Toaster is in layout
- Verify import path
- Check z-index conflicts
- Test with simple message

### Theme colors not working
- Verify CSS variables defined
- Check `renderlab-theme.css` imported
- Test light/dark mode
- Inspect computed styles

### Toast hidden behind elements
- Check z-index (default: 50)
- Verify Toaster position
- Check parent overflow

### Multiple toasts stacking
This is normal! To limit:
```tsx
// In Toaster component
<Toaster 
  visibleToasts={3}
  position="bottom-right"
/>
```

## Migration from Old Toast

If migrating from the old `defaultToastStyle`:

**Before:**
```tsx
import { toast } from "sonner";
import { defaultToastStyle } from "@/lib/toast-config";

toast.success("Message", { style: defaultToastStyle });
```

**After:**
```tsx
import { showToast } from "@/components/ui/RenderLabToast";

showToast.success("Message");
```

## Advanced Usage

### Direct Sonner Access
```tsx
import { toast } from "@/components/ui/RenderLabToast";

// Full Sonner API available
toast.custom((t) => (
  <div>Custom JSX content</div>
));
```

### Custom Toast Wrapper
```tsx
export function customToast(type: "success" | "error", message: string) {
  const emoji = type === "success" ? "✨" : "❌";
  showToast[type](`${emoji} ${message}`);
}
```

## Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support  
- Safari: ✅ Full support
- Mobile: ✅ Touch-friendly
