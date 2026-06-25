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

    const summary = { success: true, userId, deletedTables, failedTables };
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
