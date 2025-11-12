# HeroParallax Component

## Overview
A stunning hero section with multi-layer parallax scroll effects, theme integration, and smooth animations powered by Framer Motion.

## Features
- ✅ Multi-layer parallax (3 speeds: 40%, 20%, 10%)
- ✅ Fade-out effect on scroll
- ✅ Theme-aware colors (light/dark mode)
- ✅ CSS-based dot pattern (no external images)
- ✅ Light flare accent effect
- ✅ Animated scroll indicator
- ✅ GPU-accelerated transforms
- ✅ Responsive typography
- ✅ SSR-safe (Next.js compatible)
- ✅ 60fps smooth scrolling

## Usage

### Basic Implementation
```tsx
import { HeroParallax } from "@/components/landing/HeroParallax";

export default function HomePage() {
  return (
    <div>
      <HeroParallax />
      {/* Rest of your page content */}
    </div>
  );
}
```

### Full Page Example
```tsx
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--rl-bg)]">
      <HeroParallax />
      
      <div className="relative z-20 bg-[var(--rl-bg)] px-4 py-16">
        {/* Your content sections */}
      </div>
    </div>
  );
}
```

## Parallax Layers

### Layer 1: Background Gradient (40% speed)
- Moves fastest relative to scroll
- Gradient from `--rl-surface` to `--rl-bg`
- Creates depth perception

### Layer 2: Dot Pattern (20% speed)
- Mid-speed parallax effect
- CSS-generated radial gradient dots
- Uses `--rl-border` color
- 40% opacity for subtlety

### Layer 3: Foreground Content (10% speed)
- Slowest movement
- Main text and CTA button
- Fades out as user scrolls (100% → 0%)

### Bonus: Light Flare
- Static decorative element
- Radial gradient using `--rl-accent`
- Adds visual interest and depth
- 20% opacity with blur-3xl

## Scroll Behavior

### Scroll Progress Tracking
```typescript
const { scrollYProgress } = useScroll({ 
  target: ref, 
  offset: ["start start", "end start"] 
});
```

Tracks scroll from hero start to hero end.

### Transform Calculations
```typescript
const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
const yMid = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
const yFg = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0]);
```

## Styling

### Theme Tokens Used
- `--rl-bg` - Section background
- `--rl-surface` - Gradient start color
- `--rl-text` - Heading text
- `--rl-text-secondary` - Description text
- `--rl-accent` - Light flare & scroll indicator
- `--rl-border` - Dot pattern & scroll indicator border

### Responsive Typography
```tsx
<h1 className="text-5xl md:text-6xl lg:text-7xl">
  Craft Your Visuals
</h1>

<p className="text-lg md:text-xl">
  Description text...
</p>
```

### Layout
- **Height:** `100vh` (full viewport)
- **Overflow:** `hidden` (prevents horizontal scroll)
- **Positioning:** Absolute layers with z-index
- **Content:** Centered with flexbox
- **Padding:** `px-4` on mobile for safe margins

## Animations

### Initial Load Animations
Content fades in with staggered delays:
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8, delay: 0.2/0.4/0.6 }}
```

- Heading: 0.2s delay
- Description: 0.4s delay
- CTA Button: 0.6s delay

### Scroll Indicator
Continuous bounce animation:
```typescript
animate={{ y: [0, 8, 0] }}
transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
```

## Performance Optimizations

### GPU Acceleration
- All transforms use `translateY` (GPU-accelerated)
- No expensive properties (width, height, etc.)
- Framer Motion handles optimization automatically

### Pattern Generation
Instead of loading external image:
```typescript
backgroundImage: `radial-gradient(circle, var(--rl-border) 1px, transparent 1px)`
backgroundSize: '24px 24px'
```

### Pointer Events
Decorative layers have `pointer-events-none`:
```tsx
className="pointer-events-none"
```
Ensures clicks pass through to interactive content.

### Will-Change
Framer Motion automatically applies `will-change: transform` during scroll.

## Customization

### Change Parallax Speeds
```typescript
const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]); // Faster
const yFg = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);  // Slower
```

### Adjust Fade-Out
```typescript
const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8], [1, 1, 0]); 
// Keeps full opacity longer
```

### Modify Content
```tsx
<HeroParallax 
  title="Your Custom Title"
  description="Your custom description"
  ctaText="Your CTA"
  onCtaClick={() => console.log('clicked')}
/>
```
(Would require adding props to component)

### Change Height
```tsx
className="relative h-[80vh] overflow-hidden" // Shorter hero
className="relative h-[120vh] overflow-hidden" // Taller hero
```

## Integration with RenderLabButton

Uses the gradient variant for maximum visual impact:
```tsx
<RenderLabButton variant="gradient" size="lg">
  Get Started
</RenderLabButton>
```

The button inherits theme colors automatically.

## Accessibility

### ARIA
Consider adding:
```tsx
<section 
  ref={ref} 
  aria-label="Hero section"
  role="banner"
>
```

### Reduced Motion
For users with motion sensitivity:
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const yBg = useTransform(scrollYProgress, [0, 1], 
  prefersReducedMotion ? ["0%", "0%"] : ["0%", "40%"]
);
```

### Focus Management
Ensure CTA button is keyboard accessible (already is via RenderLabButton).

## SSR / Hydration

✅ **Next.js Safe**
- Uses `"use client"` directive
- useScroll triggers only on client
- No window/document calls during SSR
- All animations client-side only

## Browser Compatibility

- **Chrome/Edge:** ✅ Full support
- **Firefox:** ✅ Full support
- **Safari:** ✅ Full support (including iOS)
- **Mobile browsers:** ✅ Smooth on modern devices

### Performance Targets
- **Desktop:** Solid 60fps
- **Mobile:** 30-60fps (device-dependent)
- **Low-end devices:** May reduce parallax speed slightly

## Demo Page

Visit `/landing-preview` to see the component in action:
- Scroll to experience full parallax
- Toggle light/dark mode to see theme adaptation
- Test on mobile for responsive behavior

## Examples

### Marketing Landing Page
```tsx
export default function MarketingPage() {
  return (
    <>
      <HeroParallax />
      <Features />
      <Testimonials />
      <CTA />
    </>
  );
}
```

### Portfolio Site
```tsx
export default function Portfolio() {
  return (
    <>
      <HeroParallax />
      <ProjectGallery />
      <About />
      <Contact />
    </>
  );
}
```

### Product Launch
```tsx
export default function ProductLaunch() {
  return (
    <>
      <HeroParallax />
      <VideoDemo />
      <Pricing />
      <FAQ />
    </>
  );
}
```

## Troubleshooting

### Parallax not working
- Check if content below hero has enough height to scroll
- Verify `overflow-hidden` on hero section
- Test scroll position in DevTools

### Performance issues
- Check for other scroll listeners
- Reduce parallax speeds (smaller % values)
- Test on target devices

### Theme colors not applying
- Verify CSS variables in `renderlab-theme.css`
- Check `data-theme` attribute on root
- Inspect computed styles

### Layout shift on load
- Ensure `h-[100vh]` is applied
- Check for competing height styles
- Verify no max-height conflicts

## Advanced Techniques

### Add More Layers
```tsx
const yExtra = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

<motion.div style={{ y: yExtra }}>
  {/* Additional parallax layer */}
</motion.div>
```

### Horizontal Parallax
```tsx
const x = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

<motion.div style={{ x }}>
  {/* Moves horizontally */}
</motion.div>
```

### Scale Effect
```tsx
const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

<motion.div style={{ scale }}>
  {/* Scales up on scroll */}
</motion.div>
```

## Best Practices

1. **Keep it simple** - Too many layers can hurt performance
2. **Test on mobile** - Parallax can be jarring on small screens
3. **Provide contrast** - Ensure text is readable at all times
4. **Optimize images** - If using custom patterns, optimize files
5. **Consider reduced motion** - Respect user preferences
6. **Test scroll performance** - Aim for 60fps on target devices
