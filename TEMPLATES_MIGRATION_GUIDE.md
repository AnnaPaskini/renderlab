# Templates Migration Guide

## What Changed?

Templates are now saved to **Supabase database** instead of localStorage. This means:

✅ **Persistent storage** - Templates won't be lost when clearing browser cache  
✅ **Cross-device access** - Access templates from any device  
✅ **User-specific** - Templates are tied to your user account  
✅ **Proper data management** - Easy to backup, share, and manage  

## Migration Steps

### 1. Run the Database Migration

You need to create the `templates` table in your Supabase database.

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/create_templates_table.sql`
4. Paste into the SQL editor
5. Click **Run**

**Option B: Using Supabase CLI**

```bash
# Make sure you're logged in
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

### 2. Verify the Migration

After running the migration, verify it worked:

1. Go to **Table Editor** in Supabase Dashboard
2. Look for the `templates` table
3. It should have these columns:
   - `id` (UUID)
   - `user_id` (UUID)
   - `name` (TEXT)
   - `ai_model` (TEXT)
   - `style` (TEXT)
   - `details` (TEXT)
   - `avoid_elements` (TEXT)
   - `final_prompt` (TEXT)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

### 3. Test the New System

1. **Clear your browser cache** (or open an incognito window)
2. **Sign in** to your app
3. **Create a new template**:
   - Add some prompt details
   - Select some "Elements to Avoid"
   - Click "Save Template"
   - Give it a name
4. **Check the console**:
   - Should see: `✅ Template saved to Supabase`
   - Should NOT see: `Template saved to localStorage`
5. **Verify in Supabase Dashboard**:
   - Go to Table Editor → `templates`
   - Your template should appear there
   - Check that `avoid_elements` has your selections

### 4. Migrate Old Templates (Optional)

If you have templates in localStorage that you want to keep:

1. Open browser console (F12)
2. Run this code to export them:

```javascript
// Export old templates
const oldTemplates = JSON.parse(localStorage.getItem('RenderAI_customTemplates') || '[]');
console.log('Old templates:', oldTemplates);
copy(JSON.stringify(oldTemplates, null, 2)); // Copies to clipboard
```

3. Save the JSON somewhere safe
4. You can manually re-create important templates in the new system

### 5. Clean Up localStorage (Optional)

After you're confident everything works, clean up old localStorage data:

```javascript
// Remove old templates from localStorage
localStorage.removeItem('RenderAI_customTemplates');
console.log('✅ Old templates removed from localStorage');
```

## Troubleshooting

### "Please sign in to save templates"

**Cause**: Not authenticated  
**Solution**: Make sure you're signed in before saving templates

### Templates not appearing

**Cause**: RLS policies not working or wrong user_id  
**Solution**: Check in Supabase Dashboard → Table Editor → templates table

### "Failed to save template"

**Cause**: Database connection issue or RLS policies  
**Solution**: 
1. Check console for detailed error
2. Verify migration ran successfully
3. Check Supabase project is running
4. Verify RLS policies exist

### avoidElements still empty

**Cause**: Not selecting avoid elements before saving  
**Solution**: 
1. Open "Advanced Settings"
2. Click "Elements to Avoid" bookmark
3. Click pills to select them (they should turn orange)
4. Then save the template
5. Check console for: `📤 Sending avoid elements to parent: ...`

## What to Expect

### Console Logs

When saving a template, you should see:

```
💾 Current state before save:
💾 details: golden hour, bird's-eye view
💾 avoidElements: excessive bloom, incorrect perspective
💾 finalPrompt: golden hour, bird's-eye view...
💾 Template object to save: {user_id: "...", name: "...", ...}
📥 Loading templates from Supabase for user: ...
✅ Template saved to Supabase: {id: "...", name: "...", ...}
✅ Loaded templates from Supabase: [...]
```

### Database

In Supabase Dashboard → Table Editor → templates:

| id | user_id | name | details | avoid_elements | final_prompt |
|----|---------|------|---------|----------------|--------------|
| uuid | your-user-id | My Template | golden hour, ... | excessive bloom, ... | golden hour... |

## Need Help?

If you encounter issues:

1. Check browser console for error messages
2. Check Supabase Dashboard → Logs
3. Verify the migration ran successfully
4. Make sure you're signed in
5. Check that RLS policies are enabled
