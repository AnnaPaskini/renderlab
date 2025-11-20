#!/bin/bash

# Templates Migration Script
# This script helps you migrate templates from localStorage to Supabase

echo "🚀 Templates Migration to Supabase"
echo "=================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo "  # or"
    echo "  brew install supabase/tap/supabase"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  No Supabase project linked"
    echo ""
    echo "Link your project with:"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo "Find your project ref in:"
    echo "  Supabase Dashboard → Settings → API → Project URL"
    echo ""
    exit 1
fi

echo "✅ Supabase project linked"
echo ""

# Show the migration file
echo "📄 Migration to apply:"
echo "   supabase/migrations/create_templates_table.sql"
echo ""

# Ask for confirmation
read -p "Apply migration to Supabase? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 0
fi

# Apply migration
echo ""
echo "🔄 Applying migration..."
echo ""

supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Verify in Supabase Dashboard → Table Editor"
    echo "   2. Look for 'templates' table"
    echo "   3. Test saving a template in your app"
    echo "   4. Check console for: '✅ Template saved to Supabase'"
    echo ""
    echo "📖 Full guide: TEMPLATES_MIGRATION_GUIDE.md"
else
    echo ""
    echo "❌ Migration failed"
    echo ""
    echo "Try manual migration:"
    echo "   1. Open Supabase Dashboard"
    echo "   2. Go to SQL Editor"
    echo "   3. Copy contents of: supabase/migrations/create_templates_table.sql"
    echo "   4. Paste and Run"
    echo ""
fi
