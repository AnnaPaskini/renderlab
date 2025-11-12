# RenderLabInput Component

## Overview
A themed input component with full support for light/dark modes, error states, focus indicators, and disabled states. Implements `forwardRef` for seamless integration with form libraries.

## Features
- ✅ Light/dark theme support via CSS custom properties
- ✅ Focus state with accent ring
- ✅ Error state with red border and error message
- ✅ Disabled state with reduced opacity
- ✅ Smooth transitions (200ms)
- ✅ Forward ref support for form libraries (React Hook Form, etc.)
- ✅ All standard HTML input types supported
- ✅ Accessible placeholder styling

## Usage

### Basic Input
```tsx
import { RenderLabInput } from "@/components/ui/RenderLabInput";

<RenderLabInput 
  placeholder="Enter your name..." 
  type="text"
/>
```

### With Error State
```tsx
<RenderLabInput 
  placeholder="Email address" 
  type="email"
  error="Please enter a valid email"
/>
```

### With Form Libraries (React Hook Form)
```tsx
import { useForm } from "react-hook-form";

const { register, formState: { errors } } = useForm();

<RenderLabInput 
  {...register("email", { required: "Email is required" })}
  placeholder="Email"
  error={errors.email?.message}
/>
```

### Different Input Types
```tsx
<RenderLabInput type="email" placeholder="email@example.com" />
<RenderLabInput type="password" placeholder="Password" />
<RenderLabInput type="number" min="0" max="100" />
<RenderLabInput type="url" placeholder="https://..." />
```

### Disabled State
```tsx
<RenderLabInput 
  placeholder="Disabled field" 
  disabled
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `string` | `undefined` | Error message to display below input |
| `...props` | `InputHTMLAttributes` | - | All standard HTML input props |

Extends all native HTML input attributes including:
- `placeholder`, `type`, `value`, `onChange`
- `disabled`, `required`, `min`, `max`
- `pattern`, `autoComplete`, `autoFocus`

## Styling

### Theme Tokens Used
- `--rl-surface` - Input background
- `--rl-text` - Input text color
- `--rl-text-secondary` - Placeholder color
- `--rl-border` - Default border color
- `--rl-accent` - Focus border and ring color
- `--rl-error` - Error border, ring, and message color

### Customization
```tsx
<RenderLabInput 
  className="max-w-md" 
  placeholder="Custom width"
/>
```

## States

### Focus
- Border changes from `--rl-border` to `--rl-accent`
- Ring appears with `--rl-accent` color
- Smooth 200ms transition

### Error
- Border and ring change to `--rl-error`
- Error message appears below input in red
- Overrides focus color when present

### Disabled
- Opacity reduced to 60%
- Cursor changes to `not-allowed`
- Input becomes non-interactive

## Design Consistency

### With RenderLabButton
- Uses `rounded-lg` (buttons use `rounded-xl`)
- Similar padding structure (`px-3 py-2`)
- Matching focus ring style
- Same transition duration (200ms)
- Consistent disabled opacity (60%)

### Best Practices
1. Always provide meaningful placeholders
2. Use error prop for validation feedback
3. Pair with `<label>` elements for accessibility
4. Use appropriate input types for better UX
5. Consider max-width for better readability

## Accessibility
- Supports all ARIA attributes via spread props
- Error messages are visible (consider `aria-describedby`)
- Focus indicators meet WCAG contrast requirements
- Disabled state prevents interaction
- Works with screen readers

## Examples

### Complete Form Field
```tsx
<div>
  <label htmlFor="name" className="block text-sm font-medium mb-1.5">
    Full Name
  </label>
  <RenderLabInput 
    id="name"
    placeholder="John Doe" 
    type="text"
    error={errors.name}
  />
</div>
```

### Controlled Input
```tsx
const [value, setValue] = useState("");

<RenderLabInput 
  value={value}
  onChange={(e) => setValue(e.target.value)}
  placeholder="Type here..."
/>
```

## Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (no double-focus issues)
- Mobile: ✅ Native input behavior preserved
