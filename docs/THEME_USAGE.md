npm run dev
# RenderLab Theme Usage

## CSS Variables

The theme tokens are now available as CSS variables in `/app/renderlab-theme.css`

### Available Variables

**Light Mode (default):**
- `--rl-bg`: #fafafa
- `--rl-surface`: #ffffff
- `--rl-panel`: rgba(255, 255, 255, 0.85)
- `--rl-panel-hover`: rgba(255, 255, 255, 0.9)
- `--rl-border`: #e4e4e7
- `--rl-glass-border`: rgba(255, 255, 255, 0.4)
- `--rl-text`: #1a1a1a
- `--rl-text-secondary`: #6b6b6b
- `--rl-accent`: #7c3aed
- `--rl-accent-hover`: #6d28d9
- `--rl-success`: #16a34a
- `--rl-error`: #dc2626
- `--rl-warning`: #f59e0b

**Dark Mode (`[data-theme="dark"]`):**
- `--rl-bg`: #0f0f11
- `--rl-surface`: #18181b
- `--rl-panel`: rgba(12, 12, 18, 0.78)
- `--rl-panel-hover`: rgba(17, 17, 17, 0.8)
- `--rl-border`: #27272a
- `--rl-glass-border`: rgba(255, 255, 255, 0.24)
- `--rl-text`: #f5f5f5
- `--rl-text-secondary`: #a1a1aa
- `--rl-accent`: #8b5cf6
- `--rl-accent-hover`: #a78bfa
- `--rl-success`: #22c55e
- `--rl-error`: #ef4444
- `--rl-warning`: #fbbf24

## Usage

### In Tailwind CSS classes:

```tsx
// Background
<div className="bg-rl-bg">...</div>
<div className="bg-rl-surface">...</div>

// Text
<p className="text-rl-text">Main text</p>
<p className="text-rl-text-secondary">Secondary text</p>

// Borders
<div className="border border-rl-border">...</div>

// Accent colors
<button className="bg-rl-accent hover:bg-rl-accent-hover">...</button>

// Status colors
<div className="text-rl-success">Success message</div>
<div className="text-rl-error">Error message</div>
<div className="text-rl-warning">Warning message</div>
```

### In CSS:

```css
.custom-component {
  background-color: var(--rl-surface);
  color: var(--rl-text);
  border: 1px solid var(--rl-border);
}

.custom-button {
  background: var(--rl-accent);
}

.custom-button:hover {
  background: var(--rl-accent-hover);
}
```

### Toggle Dark Mode:

Add `data-theme="dark"` to the root element:

```tsx
// In your theme provider
<html data-theme={theme}>
  <body>...</body>
</html>
```

Or toggle dynamically:

```tsx
document.documentElement.setAttribute('data-theme', 'dark');
// or
document.documentElement.removeAttribute('data-theme'); // back to light
```

## File Structure

```
/app
  ├── renderlab-theme.css      # Theme variables (NEW)
  └── globals.css              # Imports theme + Tailwind

/tailwind.config.ts            # Extended with rl.* colors
```

## Example Component

```tsx
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-rl-surface text-rl-text border border-rl-border rounded-lg p-6 shadow-lg">
      {children}
    </div>
  );
}

export function PrimaryButton({ children, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        bg-rl-accent 
        hover:bg-rl-accent-hover 
        text-white 
        px-4 py-2 
        rounded-lg 
        transition-colors
      "
    >
      {children}
    </button>
  );
}
```

## Benefits

✅ Centralized theme management
✅ Easy dark/light mode switching
✅ Type-safe with Tailwind IntelliSense
✅ Consistent colors across the app
✅ Simple to customize and extend
