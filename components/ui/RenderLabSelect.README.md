# RenderLabSelect Component

## Overview
A themed select dropdown component with custom chevron icon, full light/dark mode support, error states, and consistent styling with other form elements.

## Features
- ✅ Light/dark theme support via CSS custom properties
- ✅ Custom chevron icon (replaces native arrow)
- ✅ Focus state with accent ring
- ✅ Error state with red border and error message
- ✅ Disabled state with reduced opacity
- ✅ Smooth transitions (200ms)
- ✅ Full keyboard navigation
- ✅ Theme-aware icon color

## Usage

### Basic Select
```tsx
import { RenderLabSelect } from "@/components/ui/RenderLabSelect";

<RenderLabSelect defaultValue="">
  <option value="" disabled>
    Choose option...
  </option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
  <option value="3">Option 3</option>
</RenderLabSelect>
```

### With Error State
```tsx
<RenderLabSelect 
  defaultValue=""
  error="Please select an option"
>
  <option value="" disabled>Select...</option>
  <option>Choice A</option>
  <option>Choice B</option>
</RenderLabSelect>
```

### Controlled Select
```tsx
const [value, setValue] = useState("");

<RenderLabSelect 
  value={value}
  onChange={(e) => setValue(e.target.value)}
>
  <option value="">Select...</option>
  <option value="draft">Draft</option>
  <option value="published">Published</option>
</RenderLabSelect>
```

### With Form Libraries
```tsx
import { useForm } from "react-hook-form";

const { register, formState: { errors } } = useForm();

<RenderLabSelect 
  {...register("category", { required: "Category is required" })}
  error={errors.category?.message}
>
  <option value="">Choose category...</option>
  <option>Architecture</option>
  <option>Interior</option>
</RenderLabSelect>
```

### Disabled State
```tsx
<RenderLabSelect disabled>
  <option>Unavailable</option>
</RenderLabSelect>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `string` | `undefined` | Error message to display below select |
| `children` | `ReactNode` | - | `<option>` elements |
| `...props` | `SelectHTMLAttributes` | - | All standard HTML select props |

Extends all native HTML select attributes including:
- `value`, `defaultValue`, `onChange`
- `disabled`, `required`, `multiple`
- `name`, `id`, `autoFocus`

## Styling

### Theme Tokens Used
- `--rl-surface` - Select background
- `--rl-text` - Select text color
- `--rl-text-secondary` - Chevron icon color
- `--rl-border` - Default border color
- `--rl-accent` - Focus border and ring color
- `--rl-error` - Error border, ring, and message color

### Custom Icon
The component uses a custom ChevronDown icon from lucide-react:
- Positioned absolutely on the right
- Colored with `--rl-text-secondary`
- Pointer events disabled (clicks go through to select)
- Adapts to theme changes automatically

### Customization
```tsx
<RenderLabSelect 
  className="max-w-xs" 
  defaultValue=""
>
  <option value="">Custom width...</option>
</RenderLabSelect>
```

## States

### Focus
- Border changes from `--rl-border` to `--rl-accent`
- Ring appears with `--rl-accent` color
- Smooth 200ms transition
- No double-focus issues in Safari

### Error
- Border and ring change to `--rl-error`
- Error message appears below select in red
- Overrides focus color when present

### Disabled
- Opacity reduced to 60%
- Cursor changes to `not-allowed`
- Select becomes non-interactive
- Icon also grayed out

## Design Consistency

### With RenderLabInput
- Identical border radius (`rounded-lg`)
- Matching padding (`px-3 py-2`)
- Same focus ring style
- Same transition duration (200ms)
- Consistent disabled opacity (60%)
- Same error handling pattern

### With RenderLabButton
- Similar rounded corners
- Matching focus indicators
- Same transition timing
- Consistent spacing

## Best Practices

1. **First Option Pattern**
   ```tsx
   <option value="" disabled>Choose...</option>
   ```
   Use a disabled first option as placeholder

2. **Accessible Labels**
   ```tsx
   <label htmlFor="category">Category</label>
   <RenderLabSelect id="category">...</RenderLabSelect>
   ```

3. **Grouping Options**
   ```tsx
   <RenderLabSelect>
     <optgroup label="Renders">
       <option>Interior</option>
       <option>Exterior</option>
     </optgroup>
     <optgroup label="Quality">
       <option>Draft</option>
       <option>High</option>
     </optgroup>
   </RenderLabSelect>
   ```

4. **Set Width**
   ```tsx
   <RenderLabSelect className="w-full max-w-md">
   ```

## Accessibility
- Full keyboard navigation (arrow keys, Enter, Esc)
- Supports all ARIA attributes via spread props
- Error messages are visible
- Focus indicators meet WCAG standards
- Custom icon doesn't interfere with screen readers
- Native select behavior preserved

## Examples

### Complete Form Field
```tsx
<div>
  <label 
    htmlFor="render-quality" 
    className="block text-sm font-medium mb-1.5"
  >
    Render Quality
  </label>
  <RenderLabSelect 
    id="render-quality"
    defaultValue=""
    error={errors.quality}
  >
    <option value="" disabled>Select quality...</option>
    <option value="512">Draft (512px)</option>
    <option value="1024">Standard (1024px)</option>
    <option value="2048">High (2048px)</option>
  </RenderLabSelect>
</div>
```

### With Description
```tsx
<div className="space-y-1">
  <RenderLabSelect defaultValue="">
    <option value="">Choose style...</option>
    <option>Modern</option>
    <option>Classic</option>
  </RenderLabSelect>
  <p className="text-xs text-[var(--rl-text-secondary)]">
    This affects the overall aesthetic
  </p>
</div>
```

## Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (native appearance removed)
- Mobile: ✅ Native picker on mobile devices

## Improvements Over Native Select
1. Custom icon that matches theme
2. Consistent styling across browsers
3. Better visual integration with form elements
4. Error state handling
5. Focus ring that matches design system
6. No browser-specific quirks
