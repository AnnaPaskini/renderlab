# RenderLab Button Styles

## Premium Generate Button

### Design Philosophy
- Modern 2025 aesthetics (Apple Vision Pro inspired)
- Internal depth without external glow
- Clean integration with dark UI
- Premium feel without being flashy
- Consistent with RenderLab brand colors

### React Component Structure
```tsx
<Button
  className="
    w-full
    py-3 px-6
    text-[15px] font-semibold
    rounded-xl
    premium-generate-button
  "
  onClick={handleGenerateTemplate}
  disabled={isGenerating}
>
  {isGenerating ? "Generating..." : "Generate"}
</Button>
```

### CSS Class: `.premium-generate-button`
```css
.premium-generate-button {
  background: 
    radial-gradient(circle at 30% 25%, rgba(255, 160, 110, 0.35) 0%, rgba(255, 120, 70, 0.10) 35%, transparent 70%),
    linear-gradient(145deg, #FF7A3C 0%, #FF5A1F 50%, #E24315 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease, filter 0.2s ease;
  font-weight: 600;
  letter-spacing: 0.15px;
}

.premium-generate-button:hover {
  transform: translateY(-1px);
  filter: brightness(1.06) saturate(1.05);
}

.premium-generate-button:active {
  transform: translateY(0);
  filter: brightness(0.96);
}

.premium-generate-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  filter: none;
}
```

### Key Specifications
- **Width:** Full width (`w-full`)
- **Padding:** 12px vertical, 24px horizontal (`py-3 px-6`)
- **Font:** 15px, semibold (600), letter-spacing 0.15px
- **Border Radius:** Extra large (`rounded-xl`)
- **Background:** Dual-layer gradient (radial spotlight + linear base)
- **Shadow:** Multi-layer depth without glow
- **Height:** ~39px total
- **Color Scheme:** Modern layered orange depth
- **Behavior:** Premium CTA with subtle hover/active effects

### States
- **Default:** Full gradient with inner glow
- **Hover:** Lift (-1px), brightness increase, saturation boost
- **Active:** Press down, slight dim
- **Disabled:** 50% opacity, no transforms, no cursor
- **Loading:** Show "Generating..." text (or spinner)

### File Locations
- Component: `components/ui/PremiumButton.tsx`
- CSS: `app/globals.css`
- Documentation: `docs/BUTTON_STYLES.md`

### Usage Examples

#### Primary Button (Generate)
```tsx
<PremiumButton onClick={handleGenerate} isLoading={isGenerating} loadingText="Generating...">
  Generate
</PremiumButton>
```

#### Secondary Button (Save)
```tsx
<PremiumButton variant="secondary" onClick={handleSave}>
  Save as Template
</PremiumButton>
```

#### Destructive Button (Delete)
```tsx
<PremiumButton variant="destructive" onClick={handleDelete}>
  Delete
</PremiumButton>
```

#### Size Variants
```tsx
{/* Small */}
<PremiumButton size="sm" onClick={handleLoad}>
  Load
</PremiumButton>

{/* Medium (default) */}
<PremiumButton size="md" onClick={handleGenerate}>
  Generate
</PremiumButton>

{/* Large */}
<PremiumButton size="lg" onClick={handleGenerate}>
  Start Generation
</PremiumButton>
```

### Button Variants

#### Primary (Orange Gradient)
- Use for main actions: Generate, Start, Create
- Color: Orange gradient (#FF7A3C → #FF5A1F → #E24315)
- Most prominent in the interface

#### Secondary (Outline)
- Use for secondary actions: Save, Load, Cancel
- Color: Orange outline with transparent background
- Less prominent than primary

#### Destructive (Red Gradient)
- Use for dangerous actions: Delete, Remove, Clear
- Color: Red gradient (#EF4444 → #DC2626 → #B91C1C)
- Visually distinct to prevent accidental clicks

### Accessibility
- ✅ Sufficient color contrast (WCAG AA compliant)
- ✅ Clear disabled state (50% opacity)
- ✅ Keyboard accessible (standard button behavior)
- ✅ Screen reader friendly (semantic HTML)
- ✅ Loading state prevents double-clicks

### Best Practices
1. **Use sparingly:** Only 1-2 primary buttons per page
2. **Clear hierarchy:** Primary > Secondary > Destructive
3. **Consistent sizing:** Stick to sm/md/lg sizes
4. **Loading states:** Always show feedback for async operations
5. **Disabled states:** Disable during loading or when action is invalid

### Migration Guide
Replace existing buttons with PremiumButton:

**Before:**
```tsx
<button className="bg-orange-500 hover:bg-orange-600 ...">
  Generate
</button>
```

**After:**
```tsx
<PremiumButton onClick={handleGenerate} isLoading={isGenerating}>
  Generate
</PremiumButton>
```

### Troubleshooting

**Issue:** Button doesn't show gradient
- **Solution:** Ensure `premium-generate-button` class is in globals.css

**Issue:** Hover effect not working
- **Solution:** Check that button is not disabled

**Issue:** Loading spinner not showing
- **Solution:** Import Loader2 from lucide-react

**Issue:** Button too tall/short
- **Solution:** Adjust size prop (sm/md/lg)

---

**Last Updated:** November 24, 2025  
**Version:** 1.0.0  
**Maintained by:** RenderLab Team
