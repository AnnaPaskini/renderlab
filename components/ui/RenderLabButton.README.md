# RenderLabButton Component

## Overview

Flexible button system with full theme support and three visual variants for different use cases.

## Features

✅ Three variants: filled, outline, gradient
✅ Three sizes: sm, md, lg
✅ Loading state with spinner
✅ Full theme integration via CSS tokens
✅ Smooth hover animations
✅ Keyboard focus ring
✅ Disabled state handling
✅ Icon support
✅ Extends native button props

## Usage

### Basic Buttons

```tsx
import { RenderLabButton } from "@/components/ui/RenderLabButton";

// Filled (Primary CTA)
<RenderLabButton variant="filled">
  Primary Action
</RenderLabButton>

// Outline (Secondary)
<RenderLabButton variant="outline">
  Secondary Action
</RenderLabButton>

// Gradient (Special CTA)
<RenderLabButton variant="gradient">
  Special CTA
</RenderLabButton>
```

### Sizes

```tsx
<RenderLabButton size="sm">Small</RenderLabButton>
<RenderLabButton size="md">Medium (default)</RenderLabButton>
<RenderLabButton size="lg">Large</RenderLabButton>
```

### With Icons

```tsx
import { Plus, Save, Download } from "lucide-react";

<RenderLabButton variant="filled">
  <Plus className="w-4 h-4" />
  Create New
</RenderLabButton>

<RenderLabButton variant="outline">
  <Save className="w-4 h-4" />
  Save
</RenderLabButton>
```

### Loading State

```tsx
const [isLoading, setIsLoading] = useState(false);

<RenderLabButton 
  variant="filled" 
  isLoading={isLoading}
  onClick={handleSubmit}
>
  Submit
</RenderLabButton>
```

### Disabled State

```tsx
<RenderLabButton disabled>
  Cannot Click
</RenderLabButton>
```

### All Native Props

```tsx
<RenderLabButton
  type="submit"
  onClick={handleClick}
  disabled={!isValid}
  className="custom-class"
  aria-label="Action button"
>
  Click Me
</RenderLabButton>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"filled" \| "outline" \| "gradient"` | `"filled"` | Visual style variant |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Button size |
| `isLoading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `className` | `string` | `undefined` | Additional CSS classes |
| `children` | `ReactNode` | **required** | Button content |
| `...props` | `ButtonHTMLAttributes` | - | All native button props |

## Variants

### Filled (Primary CTA)
- **Use for:** Main actions, submit buttons, primary CTAs
- **Style:** Solid background with accent color
- **Hover:** Darker shade + larger shadow
- **Best for:** "Save", "Create", "Submit", "Continue"

```tsx
<RenderLabButton variant="filled">
  Save Changes
</RenderLabButton>
```

### Outline (Secondary)
- **Use for:** Secondary actions, cancel buttons
- **Style:** Transparent background with border
- **Hover:** Subtle background fill + accent border
- **Best for:** "Cancel", "Back", "View Details"

```tsx
<RenderLabButton variant="outline">
  Cancel
</RenderLabButton>
```

### Gradient (Special CTA)
- **Use for:** Premium features, special promotions, landing pages
- **Style:** Gradient from accent to accent-hover
- **Hover:** Opacity reduction + slight scale
- **Best for:** "Upgrade", "Get Started", "Learn More"

```tsx
<RenderLabButton variant="gradient">
  Upgrade Now
</RenderLabButton>
```

## Size Guidelines

| Size | Use Case | Padding | Font Size |
|------|----------|---------|-----------|
| `sm` | Compact UI, tables, tags | `px-3 py-1.5` | `text-sm` |
| `md` | Standard buttons | `px-4 py-2` | `text-base` |
| `lg` | Hero sections, main CTAs | `px-6 py-3` | `text-lg` |

## Theme Integration

Uses CSS tokens for automatic theme switching:

```css
--rl-accent          /* Primary color */
--rl-accent-hover    /* Hover state */
--rl-border          /* Outline borders */
--rl-text            /* Text color */
--rl-surface         /* Hover background */
```

All colors transition smoothly (300ms) on theme change.

## Examples

### Action Bar

```tsx
<div className="flex gap-3 justify-end">
  <RenderLabButton variant="outline">
    Cancel
  </RenderLabButton>
  <RenderLabButton variant="filled">
    Save
  </RenderLabButton>
</div>
```

### Form Submit

```tsx
<form onSubmit={handleSubmit}>
  {/* form fields */}
  <RenderLabButton 
    type="submit" 
    variant="filled"
    isLoading={isSubmitting}
    disabled={!isValid}
  >
    Create Account
  </RenderLabButton>
</form>
```

### Modal Actions

```tsx
<div className="flex gap-3">
  <RenderLabButton 
    variant="outline" 
    onClick={onCancel}
  >
    Cancel
  </RenderLabButton>
  <RenderLabButton 
    variant="filled" 
    onClick={onConfirm}
    isLoading={isDeleting}
  >
    <Trash2 className="w-4 h-4" />
    Delete
  </RenderLabButton>
</div>
```

### Landing CTA

```tsx
<div className="text-center">
  <RenderLabButton 
    size="lg" 
    variant="gradient"
    onClick={scrollToSignup}
  >
    Get Started Free
  </RenderLabButton>
</div>
```

### Button Group

```tsx
<div className="inline-flex rounded-lg border border-[var(--rl-border)]">
  <RenderLabButton 
    variant="outline" 
    className="rounded-r-none border-0"
  >
    Option 1
  </RenderLabButton>
  <RenderLabButton 
    variant="outline"
    className="rounded-none border-x border-[var(--rl-border)]"
  >
    Option 2
  </RenderLabButton>
  <RenderLabButton 
    variant="outline"
    className="rounded-l-none border-0"
  >
    Option 3
  </RenderLabButton>
</div>
```

## Accessibility

✅ **Keyboard Navigation** - Full keyboard support
✅ **Focus Ring** - Visible focus indicator (2px ring)
✅ **ARIA Support** - Accepts all aria-* props
✅ **Disabled State** - Proper cursor and opacity
✅ **Loading State** - Button remains focusable but disabled

```tsx
<RenderLabButton
  aria-label="Save document"
  aria-describedby="save-hint"
  disabled={!canSave}
>
  Save
</RenderLabButton>
```

## Best Practices

### Do's ✅

- Use `filled` for primary actions
- Use `outline` for secondary actions
- Use `gradient` sparingly for special CTAs
- Always show loading state for async actions
- Use icons to improve clarity
- Keep button text concise (2-3 words max)
- Group related buttons together

### Don'ts ❌

- Don't use multiple `gradient` buttons in same view
- Don't mix too many variants in small spaces
- Don't use `lg` size for regular UI (reserve for hero sections)
- Don't forget to handle loading/disabled states
- Don't use button for navigation (use Link instead)

## Performance

- **No JavaScript animations** - Pure CSS transitions
- **GPU-accelerated** - transform and opacity only
- **No re-renders** - Pure props, no internal state (except loading)
- **Tree-shakeable** - Import only what you need

## Comparison with shadcn/ui Button

| Feature | RenderLabButton | shadcn Button |
|---------|----------------|---------------|
| Theme tokens | ✅ CSS variables | ❌ Hardcoded |
| Gradient variant | ✅ Built-in | ❌ Manual |
| Loading state | ✅ Built-in | ❌ Manual |
| Size options | 3 sizes | 4 sizes |
| Icons | Auto-spacing | Manual gap |

**Migration tip:** RenderLabButton is designed to coexist with shadcn Button. Use RenderLabButton for theme-aware UI, keep shadcn Button for complex scenarios.

## Troubleshooting

**Issue:** Gradient doesn't show in dark mode
**Solution:** Check that CSS tokens are defined in both `:root` and `[data-theme="dark"]`

**Issue:** Loading spinner is too large/small
**Solution:** Spinner size is fixed at `w-4 h-4`. Adjust if needed.

**Issue:** Focus ring not visible
**Solution:** Ensure parent doesn't have `outline: none` or `ring-0`

**Issue:** Hover animation laggy
**Solution:** Check if you have too many simultaneous CSS transitions on page

## Advanced Customization

### Custom Colors

```tsx
<RenderLabButton
  variant="filled"
  style={{
    '--rl-accent': '#ff6b6b',
    '--rl-accent-hover': '#ff5252',
  } as React.CSSProperties}
>
  Custom Color
</RenderLabButton>
```

### Custom Animation

```tsx
<RenderLabButton
  className="hover:rotate-3 active:scale-95"
>
  Fun Button
</RenderLabButton>
```

### Full Width

```tsx
<RenderLabButton className="w-full">
  Full Width Button
</RenderLabButton>
```
