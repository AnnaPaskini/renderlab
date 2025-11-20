# ⚡ Quick Start: Templates Migration

## 🎯 What You Need to Do

### Step 1: Run Migration (Choose One Method)

**Method A: Automatic Script** ⭐ Easiest
```bash
./migrate-templates.sh
```

**Method B: Supabase Dashboard** 🌐 Most Reliable
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy all content from `supabase/migrations/create_templates_table.sql`
4. Paste and click **Run**

**Method C: Supabase CLI**
```bash
supabase db push
```

### Step 2: Test It Works

1. **Open your app** (refresh if already open)
2. **Sign in**
3. **Open workspace** → Advanced Settings
4. **Add some details**: Click bookmarks, select pills
5. **Add avoid elements**: Click "Elements to Avoid", select pills
6. **Save template**: Click "Save Template" button
7. **Name it** and click Save

### Step 3: Verify Success

**In Browser Console (F12):**
```
✅ Template saved to Supabase
📥 Loading templates from Supabase
✅ Loaded templates from Supabase
```

**In Supabase Dashboard:**
1. Go to **Table Editor**
2. Find **templates** table
3. Your template should be there!

## 🔍 Console Logs to Watch For

### When Selecting Avoid Elements:
```
📤 Sending avoid elements to parent: excessive bloom, incorrect perspective
📥 PromptBuilder received avoid elements: excessive bloom, incorrect perspective
```

### When Saving Template:
```
💾 Current state before save:
💾 details: golden hour, bird's-eye view
💾 avoidElements: excessive bloom, incorrect perspective
💾 finalPrompt: ...
💾 Template object to save: {...}
✅ Template saved to Supabase: {id: "...", name: "..."}
```

## ❌ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Please sign in to save templates" | Sign in first! |
| Migration failed | Use Supabase Dashboard method (Method B) |
| avoidElements empty | Make sure to click pills in "Elements to Avoid" bookmark |
| Templates not loading | Check console for errors, verify migration ran |
| Can't see templates table | Go to Supabase Dashboard → Table Editor |

## 🎉 What Changes

### Before (❌ localStorage)
- Templates lost on cache clear
- No cross-device sync
- No user accounts
- Limited to one browser

### After (✅ Supabase)
- ✅ Persistent storage
- ✅ Cross-device access
- ✅ User-specific templates
- ✅ Proper database management
- ✅ avoidElements properly saved

## 📚 Full Documentation

- **Complete guide**: `TEMPLATES_MIGRATION_GUIDE.md`
- **Technical details**: `TEMPLATES_FIX_SUMMARY.md`
- **Migration SQL**: `supabase/migrations/create_templates_table.sql`

## 💡 Pro Tips

1. **Test with a dummy template first** before saving important ones
2. **Check console logs** - they tell you exactly what's happening
3. **Verify in Supabase Dashboard** - see your data in real-time
4. **Sign in required** - templates are tied to your user account
5. **avoidElements** - they turn **orange** when selected

---

**Need help?** Check `TEMPLATES_MIGRATION_GUIDE.md` for detailed troubleshooting.
