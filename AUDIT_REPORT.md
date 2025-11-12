# RenderLab Audit Report - TASK AUDIT-001
**Branch:** `ui-unification-v2`  
**Date:** November 11, 2025  
**Auditor:** GitHub Copilot

---

## 📊 Summary

RenderLab has been audited across 9 critical areas. The project is **partially stable** but has several **CRITICAL** issues that prevent production deployment.

### Overall Status
- ✅ **TypeScript Configuration:** Properly configured with strict mode
- ✅ **Tailwind & PostCSS:** Theme tokens correctly implemented with `var(--rl-*)` 
- ✅ **Import Structure:** All imports use `@/` alias consistently
- ✅ **Security:** Only moderate vulnerabilities (no high/critical)
- ⚠️ **Dependencies:** Several outdated packages and version conflicts
- ❌ **Build Status:** FAILS - Cannot complete production build
- ❌ **ESLint:** 66 errors, 14 warnings (80 total problems)
- ⚠️ **Project Cleanup:** Legacy code and deprecated configurations remain

---

## 🔴 Issues

### CRITICAL (Must Fix Immediately)

#### 1. Build Failure - Missing Supabase Export
**Priority:** CRITICAL  
**File:** `app/(auth)/signup/page.tsx`  
**Error:** 
```
Export supabase doesn't exist in target module
import { supabase } from "@/lib/supabaseClient";
```

**Impact:** Production build completely fails. Cannot deploy to production.

**Root Cause:** The `supabaseClient.ts` file exports `createServer` but the signup page imports `supabase`.

---

#### 2. Next.js Version Conflict
**Priority:** CRITICAL  
**Issue:** 
```
npm ls error: invalid: next@16.0.0 /Users/anna/claude renderlab CURRENT/node_modules/next
next-view-transitions requires "^15.1.0" but got next@16.0.0
```

**Impact:** Dependency mismatch causes npm warnings and potential runtime issues.

---

#### 3. Invalid next.config.mjs Option
**Priority:** CRITICAL  
**File:** `next.config.mjs`  
**Issue:**
```javascript
swcMinify: true, // ❌ This option is deprecated in Next.js 16
```

**Impact:** Next.js 16 shows warning - `swcMinify` is no longer needed (SWC is default).

---

#### 4. TypeScript Errors - Async Params in Next.js 16
**Priority:** CRITICAL  
**File:** `app/api/prompts/[id]/like/route.ts`  
**Error:**
```
Type '{ params: Promise<{ id: string; }>; }' is not assignable to type '{ params: { id: string; }; }'.
```

**Root Cause:** Next.js 16 changed route handler params to be async (Promises). Legacy code uses synchronous params.

---

#### 5. Missing Default Export in Marketing Layout
**Priority:** CRITICAL  
**File:** `app/(marketing)/layout.tsx`  
**Error:**
```
Property 'default' is missing in type 'typeof import(".../app/(marketing)/layout")'
```

---

### WARNING (Should Fix Soon)

#### 6. ESLint Errors - 66 Errors, 14 Warnings
**Priority:** WARNING  
**Most Common Issues:**
- **React Hooks Violations:** Components created during render (pricing-table.tsx)
- **Missing Image Alt Text:** 14 accessibility warnings
- **Type Errors:** Icon type misuse in legacy components

**Files with Most Errors:**
- `app/(marketing)/pricing/pricing-table.tsx` - 40+ errors
- `components copy/*` - Multiple errors from legacy/backup files

---

#### 7. Outdated Dependencies
**Priority:** WARNING  

| Package | Current | Latest | Type |
|---------|---------|--------|------|
| `tailwindcss` | 3.4.18 | **4.1.17** | Major |
| `zod` | 3.25.76 | **4.1.12** | Major |
| `date-fns` | 3.6.0 | **4.1.0** | Major |
| `@types/react-dom` | 18.3.7 | **19.2.2** | Major |
| `@supabase/supabase-js` | 2.78.0 | 2.81.1 | Minor |
| `eslint` | 9.38.0 | 9.39.1 | Minor |
| `next` | 16.0.0 | 16.0.1 | Patch |

**Note:** Major version updates require testing before applying.

---

#### 8. Duplicate Radix UI Version Mismatch
**Priority:** WARNING  
**Issue:**
```
@radix-ui/react-label    2.1.7 → 2.1.8
@radix-ui/react-slot     1.2.3 → 1.2.4
```

**Impact:** Minor, but Radix UI components should maintain version consistency.

---

#### 9. Tailwind Version Conflict
**Priority:** WARNING  
**Issue:**
```
tailwindcss@3.4.18 installed
@tailwindcss/postcss@4.1.16 depends on tailwindcss@4.1.16
```

**Impact:** Two versions of Tailwind in dependency tree. Using v3 in config but v4 in build chain.

---

### MINOR (Low Priority)

#### 10. Extraneous Dependencies
**Priority:** MINOR  
**Packages installed but not declared in package.json:**
- `@emnapi/core@1.6.0`
- `@emnapi/runtime@1.7.0`
- `@emnapi/wasi-threads@1.1.0`
- `@napi-rs/wasm-runtime@0.2.12`
- `@tybys/wasm-util@0.10.1`

**Impact:** Likely from `sharp` binary dependencies. Safe to ignore.

---

#### 11. Duplicate Icon Libraries
**Priority:** MINOR  
**Issue:**
```json
"@tabler/icons-react": "^3.35.0",
"lucide-react": "^0.548.0",
"react-icons": "^5.5.0"
```

**Impact:** Bundle size bloat. Choose one icon library for consistency.

---

#### 12. Legacy Backup Folders
**Priority:** MINOR  
**Found:**
- `components copy/` - 19 files with broken imports
- `components/_backup_original_landing/` - Old landing page components
- `lib copy/` - Old backend files

**Impact:** TypeScript errors, confusion, increased bundle scan time.

---

#### 13. PostCSS Missing autoprefixer
**Priority:** MINOR  
**File:** `postcss.config.mjs`  
**Current:**
```javascript
plugins: {
  tailwindcss: {},
}
```

**Expected:**
```javascript
plugins: {
  tailwindcss: {},
  autoprefixer: {}, // ⚠️ Missing
}
```

**Note:** `autoprefixer` is installed but not configured in PostCSS.

---

#### 14. Security Vulnerabilities (Moderate)
**Priority:** MINOR  
**Package:** `prismjs <1.30.0`  
**Severity:** Moderate  
**CVE:** GHSA-x7hr-w5r2-h6wg - DOM Clobbering vulnerability

**Affected:**
```
prismjs → refractor → @mapbox/rehype-prism
```

**Status:** No fix available from upstream. Consider alternatives or accept risk for code highlighting.

---

#### 15. Package.json Metadata Incomplete
**Priority:** MINOR  
**Missing Fields:**
- `"license": "..."`
- `"repository": "..."`
- `"author": "..."`

**Impact:** Publishing, attribution, and documentation standards.

---

## 🛠️ Fix Suggestions

### Immediate Actions (Before Deployment)

#### 1. Fix Supabase Import in Signup Page
**File:** `app/(auth)/signup/page.tsx:6`

**Option A - Use Browser Client:**
```typescript
// Change from:
import { supabase } from "@/lib/supabaseClient";

// To:
import { createBrowserClient } from "@/lib/supabaseBrowser";
const supabase = createBrowserClient();
```

**Option B - Export supabase from supabaseClient:**
```typescript
// In lib/supabaseClient.ts, add:
export const supabase = createServer();
```

---

#### 2. Remove Deprecated swcMinify Option
**File:** `next.config.mjs`

```bash
# Remove line 36:
# swcMinify: true,
```

---

#### 3. Fix Next.js 16 Async Params
**File:** `app/api/prompts/[id]/like/route.ts`

```typescript
// Change from:
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // ...
}

// To:
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ⚠️ Await the Promise
  // ...
}
```

**Apply to all route handlers with dynamic params.**

---

#### 4. Fix next-view-transitions Override
**File:** `package.json`

```json
// In overrides section, change:
"next-view-transitions": {
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "next": "^15.1.0"  // ❌ Conflicts with next@16.0.0
}

// To:
"next-view-transitions": {
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "next": "^16.0.0"  // ✅ Match installed version
}
```

**Then run:**
```bash
npm install
```

---

#### 5. Export Default from Marketing Layout
**File:** `app/(marketing)/layout.tsx`

```typescript
// Ensure the file has:
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

---

### Short-term Fixes (This Week)

#### 6. Fix ESLint Errors in Pricing Table
**File:** `app/(marketing)/pricing/pricing-table.tsx`

```typescript
// Move CheckIcon outside the component:
const CheckIcon = () => (
  <IconCheck className="mx-auto h-4 w-4 flex-shrink-0 text-black dark:text-white" />
);

export function PricingTable({ pricing }: any) {
  // Remove const CheckIcon = () => { ... } from here
  // ...
}
```

---

#### 7. Delete Legacy Backup Folders

```bash
rm -rf "components copy"
rm -rf "components/_backup_original_landing"
rm -rf "lib copy"
```

**Verify** no active imports reference these folders first:
```bash
grep -r "components copy" .
grep -r "_backup_original_landing" .
```

---

#### 8. Add autoprefixer to PostCSS Config
**File:** `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}, // Add this
  },
};
```

---

#### 9. Standardize Button Components

**Current State:**
- `components/button.tsx`
- `components/ui/button.tsx`
- `components/ui/RenderLabButton.tsx`

**Recommendation:**
1. Keep `components/ui/button.tsx` as the canonical version
2. Delete or rename others to avoid confusion
3. Update all imports to use `@/components/ui/button`

---

#### 10. Update Minor Dependencies (Safe)

```bash
npm install @radix-ui/react-label@latest @radix-ui/react-slot@latest
npm install @supabase/supabase-js@latest
npm install eslint@latest next@latest
npm install @tailwindcss/postcss@latest
```

---

### Long-term Improvements (Next Sprint)

#### 11. Resolve Tailwind v3 → v4 Migration

**Current:** Mixed v3 (config) and v4 (postcss)

**Options:**
- **Option A:** Stay on v3 - Remove `@tailwindcss/postcss` v4
- **Option B:** Migrate to v4 - Update config and all usages

**Recommendation:** Defer to dedicated migration task.

---

#### 12. Major Dependency Updates (Requires Testing)

```bash
# ⚠️ Test thoroughly before applying:
npm install zod@^4.0.0
npm install date-fns@^4.0.0
npm install @types/react-dom@^19.0.0
```

**Breaking Changes Expected** - allocate testing time.

---

#### 13. Standardize Icon Library

**Recommendation:** Keep `lucide-react` (most modern, tree-shakeable)

```bash
# Consider removing:
npm uninstall react-icons @tabler/icons-react
```

**Then:** Migrate components to use `lucide-react` consistently.

---

#### 14. Add Missing package.json Metadata

```json
{
  "name": "renderlab",
  "version": "0.1.0",
  "private": true,
  "license": "MIT",
  "author": "RenderLab Team",
  "repository": {
    "type": "git",
    "url": "https://github.com/AnnaPaskini/renderlab"
  },
  "description": "AI-powered image generation platform"
}
```

---

#### 15. Add Prettier Configuration

**Create:** `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

---

## 📈 Verification Checklist

After applying fixes, verify:

```bash
# 1. TypeScript passes
npx tsc --noEmit
# Expected: 0 errors (currently 76+ errors)

# 2. Build succeeds
npm run build
# Expected: ✓ Compiled successfully

# 3. ESLint passes
npm run lint
# Expected: < 10 warnings, 0 errors (currently 66 errors)

# 4. No dependency conflicts
npm ls
# Expected: No "invalid" or "ELSPROBLEMS" errors

# 5. No high/critical vulnerabilities
npm audit
# Expected: 0 high, 0 critical

# 6. Dev server starts
npm run dev
# Expected: Ready on http://localhost:3000
```

---

## 🎯 Priority Order

1. **CRITICAL - Day 1:**
   - Fix supabase import (Issue #1)
   - Remove swcMinify (Issue #3)
   - Fix async params (Issue #4)
   - Fix next-view-transitions override (Issue #2)
   - Export default from marketing layout (Issue #5)

2. **WARNING - Week 1:**
   - Fix ESLint errors in pricing-table.tsx (Issue #6)
   - Delete legacy backup folders (Issue #12)
   - Add autoprefixer to PostCSS (Issue #13)
   - Update minor dependencies (Issue #9)

3. **MINOR - Sprint Planning:**
   - Resolve Tailwind v3/v4 (Issue #9)
   - Standardize icon library (Issue #11)
   - Major dependency updates (Issue #7)
   - Add package.json metadata (Issue #15)

---

## 📊 Metrics

### Before Fixes
- ❌ Build: **FAIL**
- ❌ TypeScript: **76+ errors**
- ⚠️ ESLint: **66 errors, 14 warnings**
- ⚠️ npm audit: **3 moderate vulnerabilities**
- ⚠️ Bundle: **Cannot measure (build fails)**

### Target After Fixes
- ✅ Build: **SUCCESS**
- ✅ TypeScript: **0 errors**
- ✅ ESLint: **< 10 warnings, 0 errors**
- ✅ npm audit: **0 high/critical**
- ✅ Bundle size: **< 600 kB for /landing-preview**

---

## 🏁 Conclusion

RenderLab is in **fair condition** with a solid foundation but requires **immediate attention** to 5 critical issues before production deployment. The codebase follows good practices (strict TypeScript, theme tokens, import aliases) but has accumulated technical debt from migration and legacy code.

**Estimated Time to Stable:**
- Critical fixes: **4-6 hours**
- Warning fixes: **1-2 days**
- Minor improvements: **1 week**

**Next Steps:**
1. Apply critical fixes (Issues #1-5)
2. Re-run build and verify success
3. Address ESLint errors
4. Schedule cleanup sprint for legacy code
5. Plan Tailwind v3→v4 migration

---

**Report Generated:** November 11, 2025  
**Audit Scope:** TASK AUDIT-001 - Full Dependency & Config Audit  
**Branch:** ui-unification-v2
