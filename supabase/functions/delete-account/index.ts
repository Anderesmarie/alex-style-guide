import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const USER_TABLES = [
  "rejected_outfits",
  "daily_outfits",
  "last_outfit",
  "outfits",
  "wishlist",
  "trips",
  "calendar_events",
  "wardrobe",
  "chat_styliste",
  "daily_counter",
  "user_preferences",
  "avatar",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { data, error } = await supabaseAuth.auth.getUser(token);

    if (error || !data?.user) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = data.user.id;
    console.log("delete-account: starting deletion for user:", userId);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const deletedTables: string[] = [];
    const failedTables: { table: string; error: string }[] = [];

    for (const table of USER_TABLES) {
      try {
        const { error: delError } = await admin
          .from(table)
          .delete()
          .eq("user_id", userId);
        if (delError) throw delError;
        deletedTables.push(table);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`delete-account: failed to delete from ${table}:`, msg);
        failedTables.push({ table, error: msg });
      }
    }

    try {
      const { error: profileError } = await admin
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (profileError) throw profileError;
      deletedTables.push("profiles");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("delete-account: failed to delete from profiles:", msg);
      failedTables.push({ table: "profiles", error: msg });
    }

    const STORAGE_BUCKETS = ["wardrobe-images", "outfit-shares", "snapshots"];
    const storageCleanedBuckets: string[] = [];
    const storageFailedBuckets: { bucket: string; error: string }[] = [];

    async function collectPaths(
      bucket: string,
      prefix: string,
    ): Promise<string[]> {
      const { data: entries, error: listError } = await admin.storage
        .from(bucket)
        .list(prefix, { limit: 1000 });
      if (listError) throw listError;
      if (!entries || entries.length === 0) return [];
      const paths: string[] = [];
      for (const entry of entries) {
        const fullPath = `${prefix}/${entry.name}`;
        // Folders have a null id in the Supabase storage list API
        if (entry.id === null) {
          const nested = await collectPaths(bucket, fullPath);
          paths.push(...nested);
        } else {
          paths.push(fullPath);
        }
      }
      return paths;
    }

    for (const bucket of STORAGE_BUCKETS) {
      try {
        const paths = await collectPaths(bucket, userId);
        if (paths.length === 0) {
          console.log(`delete-account: nothing to remove in ${bucket}`);
          storageCleanedBuckets.push(bucket);
          continue;
        }
        const { error: removeError } = await admin.storage
          .from(bucket)
          .remove(paths);
        if (removeError) throw removeError;
        console.log(
          `delete-account: removed ${paths.length} file(s) from ${bucket}`,
        );
        storageCleanedBuckets.push(bucket);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`delete-account: storage cleanup failed for ${bucket}:`, msg);
        storageFailedBuckets.push({ bucket, error: msg });
      }
    }

    let authDeletionFailed = false;
    let authError: string | null = null;
    try {
      const { error: authDelError } = await admin.auth.admin.deleteUser(userId);
      if (authDelError) throw authDelError;
      console.log("delete-account: auth user deleted:", userId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("delete-account: failed to delete auth user:", msg);
      authDeletionFailed = true;
      authError = msg;
    }

    const summary = {
      success: true,
      userId,
      deletedTables,
      failedTables,
      storageCleanedBuckets,
      storageFailedBuckets,
      authDeletionFailed,
      authError,
    };
    console.log("delete-account summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("delete-account error:", e);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
