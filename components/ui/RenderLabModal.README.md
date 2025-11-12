# RenderLabModal Component

## Overview
A fully accessible modal dialog component with Framer Motion animations, backdrop blur, scroll lock, ESC key handling, and complete theme support.

## Features
- ✅ Smooth fade + scale animations via Framer Motion
- ✅ Backdrop blur effect
- ✅ ESC key to close
- ✅ Click outside to close
- ✅ Body scroll lock when open
- ✅ Theme-aware styling (light/dark)
- ✅ ARIA attributes for accessibility
- ✅ Optional close button
- ✅ Responsive (max-w-md, mobile-safe)
- ✅ Auto-scrollable content (max-h-90vh)

## Usage

### Basic Modal
```tsx
import { RenderLabModal } from "@/components/ui/RenderLabModal";
import { RenderLabButton } from "@/components/ui/RenderLabButton";
import { useState } from "react";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <RenderLabButton onClick={() => setIsOpen(true)}>
        Open Modal
      </RenderLabButton>

      <RenderLabModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Modal Title"
      >
        <p>Modal content goes here</p>
      </RenderLabModal>
    </>
  );
}
```

### Confirmation Dialog
```tsx
<RenderLabModal 
  isOpen={confirmOpen} 
  onClose={() => setConfirmOpen(false)}
  title="Confirm Action"
>
  <p className="text-[var(--rl-text-secondary)] mb-4">
    Are you sure you want to proceed?
  </p>
  <div className="flex justify-end gap-3">
    <RenderLabButton 
      variant="outline" 
      onClick={() => setConfirmOpen(false)}
    >
      Cancel
    </RenderLabButton>
    <RenderLabButton 
      variant="filled" 
      onClick={handleConfirm}
    >
      Confirm
    </RenderLabButton>
  </div>
</RenderLabModal>
```

### Form Modal
```tsx
<RenderLabModal 
  isOpen={formOpen} 
  onClose={() => setFormOpen(false)}
  title="Create Item"
>
  <form onSubmit={handleSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-1.5">
        Name
      </label>
      <RenderLabInput placeholder="Enter name" />
    </div>
    
    <div className="flex justify-end gap-3">
      <RenderLabButton 
        type="button" 
        variant="outline"
        onClick={() => setFormOpen(false)}
      >
        Cancel
      </RenderLabButton>
      <RenderLabButton type="submit">
        Create
      </RenderLabButton>
    </div>
  </form>
</RenderLabModal>
```

### Without Title/Close Button
```tsx
<RenderLabModal 
  isOpen={isOpen} 
  onClose={onClose}
  showCloseButton={false}
>
  <div className="text-center">
    <h3 className="text-xl font-bold mb-4">Custom Header</h3>
    <p>Content here</p>
  </div>
</RenderLabModal>
```

### Large Modal
```tsx
<RenderLabModal 
  isOpen={isOpen} 
  onClose={onClose}
  title="Large Content"
  className="max-w-2xl"
>
  <div className="space-y-4">
    {/* Long content will scroll automatically */}
  </div>
</RenderLabModal>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Controls modal visibility |
| `onClose` | `() => void` | - | Callback when modal should close |
| `title` | `string` | `undefined` | Optional modal title |
| `children` | `ReactNode` | - | Modal content |
| `className` | `string` | `undefined` | Additional CSS classes for modal container |
| `showCloseButton` | `boolean` | `true` | Show X button in header |

## Styling

### Theme Tokens Used
- `--rl-border` - Modal border
- `--rl-surface` - Modal background
- `--rl-text` - Text color
- `--rl-text-secondary` - Close button color
- `--rl-bg` - Close button hover background

### Animation Details
- **Backdrop:** Fade in/out (200ms)
- **Modal:** Scale 0.95→1.0 + fade + Y translate (250ms)
- **Easing:** Custom cubic-bezier [0.4, 0, 0.2, 1]

### Size & Spacing
- Default width: `max-w-md` (28rem)
- Mobile: `mx-4` margins
- Max height: `max-h-[90vh]` with auto-scroll
- Padding: `p-6`
- Border radius: `rounded-2xl`

## Behavior

### Closing Methods
1. **ESC key** - Triggers onClose
2. **Click backdrop** - Triggers onClose
3. **Close button (X)** - Triggers onClose
4. **Programmatic** - Call setIsOpen(false)

### Scroll Lock
When modal opens:
- Body overflow set to `hidden`
- Prevents background scrolling

When modal closes:
- Body overflow reset to `unset`
- Normal scrolling restored

### Focus Management
- Modal has `role="dialog"` and `aria-modal="true"`
- Title linked with `aria-labelledby`
- Click events don't propagate from modal content

## Accessibility

### ARIA Support
```tsx
role="dialog"
aria-modal="true"
aria-labelledby="modal-title"  // When title provided
```

### Keyboard Navigation
- **ESC** - Closes modal
- **Tab** - Cycles through focusable elements
- **Shift+Tab** - Reverse tab cycle

### Screen Readers
- Title announced as dialog label
- Close button has `aria-label="Close modal"`
- Backdrop has `aria-hidden="true"`

### Best Practices
1. Always provide a way to close (ESC, backdrop, button)
2. Use meaningful titles for context
3. Keep content focused and concise
4. Don't nest modals (avoid modal-in-modal)
5. Provide keyboard-accessible actions

## Integration with Toast

Combine modal and toast for better UX:

```tsx
<RenderLabButton 
  onClick={() => {
    setModalOpen(false);
    showToast.success("Action completed!");
  }}
>
  Confirm
</RenderLabButton>
```

## Animation Examples

### Custom Animation
```tsx
<RenderLabModal 
  isOpen={isOpen} 
  onClose={onClose}
  title="Custom"
  className="animate-bounce" // Add your own
>
  Content
</RenderLabModal>
```

### Disable Animations
Not directly supported, but you can:
1. Wrap modal in a `<div>` with `pointer-events-none`
2. Remove AnimatePresence wrapper (requires component modification)

## SSR / Hydration

✅ **Safe for Next.js SSR**
- Uses `"use client"` directive
- Modal only renders when `isOpen={true}`
- No hydration mismatches
- AnimatePresence handles mounting/unmounting

## Performance

- **Lazy rendering** - Only renders when open
- **No layout shift** - Fixed positioning
- **GPU acceleration** - Transform animations
- **Optimized unmount** - AnimatePresence cleanup

## Troubleshooting

### Modal not closing on ESC
- Check if `onClose` is properly defined
- Verify no other ESC listeners interfering
- Ensure modal is actually mounted

### Scroll not locking
- Check for multiple body scroll manipulations
- Verify cleanup in useEffect
- Test in different browsers

### Backdrop click not working
- Ensure `onClick={onClose}` on backdrop
- Check `stopPropagation()` on modal content
- Verify z-index isn't blocking clicks

### Theme colors not applying
- Check CSS variable definitions in `renderlab-theme.css`
- Verify `data-theme` attribute on root
- Test light/dark mode toggle

## Browser Support
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Works with native scroll
