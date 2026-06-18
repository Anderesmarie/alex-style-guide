import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DAILY_LIMIT = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPENAI_KEY");
    if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY not configured" }, 500);

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return json({ error: "message is required" }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // --- Quota ---
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("pseudo, silhouette, styles, colorimetry_season, budget, chat_messages_today, chat_reset_date")
      .eq("id", userId)
      .maybeSingle();
    if (profileErr) {
      console.error("profile error", profileErr);
      return json({ error: "profile_error" }, 500);
    }

    const today = new Date().toISOString().slice(0, 10);
    let messagesToday = profile?.chat_messages_today ?? 0;
    const resetDate = profile?.chat_reset_date ?? null;

    if (resetDate !== today) {
      messagesToday = 0;
    }

    if (messagesToday >= DAILY_LIMIT) {
      return json({ error: "quota_exceeded", messages_remaining: 0 }, 403);
    }

    const newCount = messagesToday + 1;
    await supabase
      .from("profiles")
      .update({ chat_messages_today: newCount, chat_reset_date: today })
      .eq("id", userId);

    // --- Wardrobe ---
    const { data: wardrobeAll } = await supabase
      .from("wardrobe")
      .select("id, type, color, style, occasion, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    const wardrobe = wardrobeAll ?? [];

    const wardrobeById = new Map<string, any>();
    for (const w of wardrobe) wardrobeById.set(w.id, w);

    const fmtColor = (c: any) => {
      if (!c) return "";
      if (typeof c === "string") return c;
      if (Array.isArray(c)) return c.join("/");
      if (typeof c === "object") return c.name || c.label || c.hex || "";
      return String(c);
    };
    const fmtList = (v: any) => Array.isArray(v) ? v.join(", ") : (v ?? "");

    const liste_vetements = wardrobe.length
      ? wardrobe.map((w: any) => `- ${w.type ?? "pièce"} ${fmtColor(w.color)}${w.style ? ` (style: ${fmtList(w.style)})` : ""}${w.occasion ? ` [${fmtList(w.occasion)}]` : ""}`).join("\n")
      : "(garde-robe vide)";

    // --- Outfits ---
    const { data: outfits } = await supabase
      .from("outfits")
      .select("name, item_ids")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Resolve missing item ids not in the 50
    const missingIds = new Set<string>();
    for (const o of outfits ?? []) {
      const ids = Array.isArray(o.item_ids) ? o.item_ids : [];
      for (const id of ids) if (id && !wardrobeById.has(id)) missingIds.add(id);
    }
    if (missingIds.size > 0) {
      const { data: extra } = await supabase
        .from("wardrobe")
        .select("id, type, color")
        .in("id", Array.from(missingIds));
      for (const e of extra ?? []) wardrobeById.set(e.id, e);
    }

    const tenues_sauvegardees = (outfits ?? []).length
      ? (outfits ?? []).map((o: any) => {
          const ids = Array.isArray(o.item_ids) ? o.item_ids : [];
          const parts = ids
            .map((id: string) => wardrobeById.get(id))
            .filter(Boolean)
            .map((w: any) => `${w.type ?? "pièce"} ${fmtColor(w.color)}`.trim());
          return `- ${o.name ?? "Tenue"} : ${parts.join(", ") || "(pièces inconnues)"}`;
        }).join("\n")
      : "(aucune tenue sauvegardée)";

    // --- History ---
    const { data: historyDesc } = await supabase
      .from("chat_styliste")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    const history = (historyDesc ?? []).slice().reverse();

    // --- System prompt ---
    const pseudo = profile?.pseudo ?? "toi";
    const silhouette = profile?.silhouette ?? "non renseignée";
    const colorimetry_season = profile?.colorimetry_season ?? "non renseignée";
    const styles = fmtList(profile?.styles) || "non renseignés";
    const budget = profile?.budget ?? "non renseigné";

    const systemPrompt = `Tu es la styliste IA personnelle de l'app MyStyl.

TON PROFIL :
- Tu parles toujours en français, tu tutoies l'utilisatrice
- Ton ton est fun et chaleureux au quotidien, précis et structuré quand la question est sérieuse
- Tu utilises les emojis avec parcimonie (1-2 max par message)
- Tes réponses sont courtes et directes (3-5 phrases max sauf si on te demande un conseil détaillé)
- Tu ne fais jamais semblant de ne pas connaître la garde-robe de l'utilisatrice

CE QUE TU CONNAIS DE L'UTILISATRICE :
- Prénom : ${pseudo}
- Morphologie : ${silhouette}
- Colorimétrie : ${colorimetry_season}
- Styles préférés : ${styles}
- Budget shopping : ${budget}€

SA GARDE-ROBE (${wardrobe.length} pièces) :
${liste_vetements}

SES TENUES SAUVEGARDÉES :
${tenues_sauvegardees}

CE QUE TU PEUX FAIRE :
- Donner des conseils mode généraux (tendances, associations)
- Conseiller selon sa morphologie et colorimétrie
- Aider à préparer une tenue pour un événement précis
- Suggérer quoi acheter pour compléter sa garde-robe

CE QUE TU NE FAIS PAS :
- Proposer les tenues du quotidien (c'est le moteur MyStyl qui s'en charge)
- Inventer des vêtements qu'elle ne possède pas
- Parler d'autre chose que de mode et style`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.8,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error", openaiRes.status, errText);
      return json({ error: "openai_error" }, 500);
    }

    const data = await openaiRes.json();
    const reply: string = data?.choices?.[0]?.message?.content?.trim() ?? "";

    await supabase.from("chat_styliste").insert([
      { user_id: userId, role: "user", content: message },
      { user_id: userId, role: "assistant", content: reply },
    ]);

    return json({ reply, messages_remaining: Math.max(0, DAILY_LIMIT - newCount) }, 200);
  } catch (e) {
    console.error("chat-styliste error", e);
    return json({ error: "internal_error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
