import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Referenced paths
    const { data: rows, error: rowsErr } = await supabase
      .from('wardrobe').select('image_url').not('image_url', 'is', null);
    if (rowsErr) throw rowsErr;
    const referenced = new Set<string>(
      (rows ?? [])
        .map((r: any) => (r.image_url as string).split('/wardrobe-images/')[1])
        .filter(Boolean),
    );

    // List all files (recursive, by user folder)
    const allPaths: string[] = [];
    const { data: roots, error: rootsErr } = await supabase.storage
      .from('wardrobe-images').list('', { limit: 1000 });
    if (rootsErr) throw rootsErr;
    for (const entry of roots ?? []) {
      if (entry.id) {
        allPaths.push(entry.name); // file at root
      } else {
        const { data: sub } = await supabase.storage
          .from('wardrobe-images').list(entry.name, { limit: 1000 });
        for (const f of sub ?? []) allPaths.push(`${entry.name}/${f.name}`);
      }
    }

    const orphans = allPaths.filter((p) => !referenced.has(p));
    let removed: string[] = [];
    if (orphans.length > 0) {
      const { data, error } = await supabase.storage
        .from('wardrobe-images').remove(orphans);
      if (error) throw error;
      removed = (data ?? []).map((o: any) => o.name);
    }

    return new Response(
      JSON.stringify({ total_files: allPaths.length, referenced: referenced.size, orphans_found: orphans.length, removed_count: removed.length, removed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
