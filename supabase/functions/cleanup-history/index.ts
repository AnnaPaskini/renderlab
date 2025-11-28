import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async () => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const BUCKET = 'renderlab-images-v2';
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000; // 14 days ago
    let totalDeleted = 0;

    // List all user folders
    const { data: userFolders, error: listError } = await supabase
        .storage
        .from(BUCKET)
        .list('', { limit: 1000 });

    if (listError) {
        return new Response(JSON.stringify({ error: listError.message }), { status: 500 });
    }

    // For each user folder, check history subfolder
    for (const folder of userFolders ?? []) {
        if (!folder.id) continue; // skip files, only folders

        const historyPath = `${folder.name}/history`;

        const { data: files } = await supabase
            .storage
            .from(BUCKET)
            .list(historyPath, { limit: 5000 });

        const toDelete: string[] = [];

        for (const file of files ?? []) {
            if (!file.created_at) continue;
            const created = new Date(file.created_at).getTime();
            if (created < cutoff) {
                toDelete.push(`${historyPath}/${file.name}`);
            }
        }

        if (toDelete.length > 0) {
            await supabase.storage.from(BUCKET).remove(toDelete);
            totalDeleted += toDelete.length;
        }
    }

    return new Response(JSON.stringify({ status: 'ok', deleted: totalDeleted }), {
        headers: { 'Content-Type': 'application/json' }
    });
});
