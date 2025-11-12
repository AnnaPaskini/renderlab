# RenderLabPanel Component

## Overview

Universal panel component for consistent UI across Workspace, Builder, Preview, Settings and all other pages.

## Features

✅ Theme-aware (uses CSS tokens)
✅ Multiple variants (left, right, floating)
✅ Optional header with title and icon
✅ Customizable via className
✅ Smooth transitions on theme change
✅ Responsive and accessible

## Usage

### Basic Panel

```tsx
import { RenderLabPanel } from "@/components/panels/RenderLabPanel";

<RenderLabPanel>
  <p>Panel content goes here</p>
</RenderLabPanel>
```

### With Title and Icon

```tsx
import { RenderLabPanel } from "@/components/panels/RenderLabPanel";
import { Folder } from "lucide-react";

<RenderLabPanel 
  title="My Collections" 
  icon={<Folder />}
>
  <p>Your collections content</p>
</RenderLabPanel>
```

### Variants

**Left Panel (default):**
```tsx
<RenderLabPanel variant="left" title="Sidebar Panel">
  <p>Content with standard padding (p-4)</p>
</RenderLabPanel>
```

**Right Panel:**
```tsx
<RenderLabPanel variant="right" title="Details Panel">
  <p>Content with standard padding (p-4)</p>
</RenderLabPanel>
```

**Floating Panel:**
```tsx
<RenderLabPanel variant="floating" title="Modal Panel">
  <p>Content with larger padding (p-6) and enhanced shadow</p>
</RenderLabPanel>
```

### Custom Styling

```tsx
<RenderLabPanel 
  title="Custom Panel"
  className="bg-gradient-to-br from-[#ff6b35]/10 to-[#ff8555]/10"
>
  <p>Panel with custom background</p>
</RenderLabPanel>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Optional panel header title |
| `icon` | `ReactNode` | `undefined` | Optional icon displayed before title |
| `children` | `ReactNode` | **required** | Panel content |
| `variant` | `"left" \| "right" \| "floating"` | `"left"` | Visual style variant |
| `className` | `string` | `undefined` | Additional CSS classes |

## Visual Differences

### Standard (left/right)
- Border: 1px solid
- Padding: 16px (p-4)
- Shadow: medium (shadow-md)
- Backdrop blur: enabled

### Floating
- Border: 1px solid
- Padding: 24px (p-6) - **more spacious**
- Shadow: large (shadow-lg) - **more prominent**
- Backdrop blur: enabled

## Theme Integration

The panel automatically uses theme tokens:

- `--rl-border` - Border color
- `--rl-surface` - Background color
- `--rl-text` - Title text color
- `--rl-text-secondary` - Content text color
- `--rl-accent` - Icon color

All colors transition smoothly on theme change (300ms duration).

## Examples

### Workspace Left Panel

```tsx
<RenderLabPanel 
  title="Upload Image" 
  icon={<Upload />}
  variant="left"
>
  <ImageUploadZone />
</RenderLabPanel>
```

### Settings Panel

```tsx
<RenderLabPanel 
  title="Account Settings" 
  icon={<Settings />}
  variant="floating"
>
  <SettingsForm />
</RenderLabPanel>
```

### Stats Dashboard

```tsx
<div className="grid grid-cols-3 gap-6">
  <RenderLabPanel title="Total Generations">
    <p className="text-3xl font-bold">1,234</p>
  </RenderLabPanel>
  
  <RenderLabPanel title="Collections">
    <p className="text-3xl font-bold">12</p>
  </RenderLabPanel>
  
  <RenderLabPanel title="Prompts">
    <p className="text-3xl font-bold">48</p>
  </RenderLabPanel>
</div>
```

### Empty State

```tsx
<RenderLabPanel>
  <div className="text-center py-12">
    <FolderIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
    <h3 className="text-lg font-medium mb-2">No Collections Yet</h3>
    <p className="text-[var(--rl-text-secondary)] mb-4">
      Create your first collection
    </p>
    <button className="btn-primary">Get Started</button>
  </div>
</RenderLabPanel>
```

## Best Practices

1. **Use variant="floating"** for modals, dialogs, and prominent cards
2. **Use variant="left"/"right"** for sidebar panels and standard content
3. **Always provide title and icon** for better UX (unless it's obvious from context)
4. **Group related content** inside a single panel rather than many small panels
5. **Use className sparingly** - let theme tokens do the work

## Migration Guide

### From old card components:

**Before:**
```tsx
<div className="bg-white rounded-lg border p-4 shadow-sm">
  <h2 className="text-lg font-medium mb-3">Title</h2>
  <p>Content</p>
</div>
```

**After:**
```tsx
<RenderLabPanel title="Title">
  <p>Content</p>
</RenderLabPanel>
```

### From custom panels:

**Before:**
```tsx
<div className="panel-container">
  <div className="panel-header">
    <Icon />
    <h2>Title</h2>
  </div>
  <div className="panel-content">
    Content
  </div>
</div>
```

**After:**
```tsx
<RenderLabPanel title="Title" icon={<Icon />}>
  Content
</RenderLabPanel>
```

## Accessibility

- Uses semantic `<section>` element
- Header uses `<header>` element
- Proper heading hierarchy with `<h2>`
- Focus-visible styles inherit from theme
- Color contrast meets WCAG AA standards

## Performance

- No unnecessary re-renders (pure component)
- CSS transitions (GPU-accelerated)
- No JavaScript animations
- Minimal DOM nodes
- Backdrop blur optimized for modern browsers
