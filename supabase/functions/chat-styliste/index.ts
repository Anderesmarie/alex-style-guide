import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DAILY_LIMIT = 3;
const TESTER_EMAILS = ["anderes.richez@gmail.com", "alexandra.richez2021@gmail.com"];

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

    const lat = typeof body?.lat === "number" ? body.lat : null;
    const lon = typeof body?.lon === "number" ? body.lon : null;
    const weatherFromBody = body?.weather && typeof body.weather === "object" ? body.weather : null;

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

    // --- Weather (toujours en contexte) ---
    const seasonalDefault = () => {
      const m = new Date().getMonth(); // 0=jan
      if (m === 11 || m <= 1) return { tempMin: 3, tempMax: 8 };   // hiver
      if (m >= 2 && m <= 4) return { tempMin: 10, tempMax: 17 };   // printemps
      if (m >= 5 && m <= 7) return { tempMin: 18, tempMax: 28 };   // été
      return { tempMin: 11, tempMax: 18 };                          // automne
    };

    let weather: { tempMin: number; tempMax: number } | null = null;
    if (weatherFromBody && typeof weatherFromBody.tempMin === "number" && typeof weatherFromBody.tempMax === "number") {
      weather = { tempMin: weatherFromBody.tempMin, tempMax: weatherFromBody.tempMax };
    } else if (lat != null && lon != null) {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto&forecast_days=1`;
        const r = await fetch(url);
        if (r.ok) {
          const d = await r.json();
          const times: string[] = d?.hourly?.time ?? [];
          const temps: number[] = d?.hourly?.temperature_2m ?? [];
          const nowH = new Date().getHours();
          const todayStr = new Date().toISOString().slice(0, 10);
          const futureTemps: number[] = [];
          for (let i = 0; i < times.length; i++) {
            const t = new Date(times[i]);
            if (times[i].slice(0, 10) !== todayStr) continue;
            const h = t.getHours();
            if (h >= nowH && h <= 21) futureTemps.push(temps[i]);
          }
          if (futureTemps.length > 0) {
            weather = {
              tempMin: Math.round(Math.min(...futureTemps)),
              tempMax: Math.round(Math.max(...futureTemps)),
            };
          }
        }
      } catch (e) {
        console.error("weather fetch failed", e);
      }
    }
    if (!weather) weather = seasonalDefault();

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

RÈGLE ABSOLUE — INVENTAIRE RÉEL UNIQUEMENT :

Tu ne dois JAMAIS mentionner une pièce, une couleur ou un accessoire qui n'apparaît pas explicitement dans la liste "SA GARDE-ROBE" ci-dessous. Si tu veux suggérer un sac, des chaussures, une veste ou tout accessoire, vérifie qu'il existe réellement dans cette liste avant de l'écrire. Si la pièce idéale n'existe pas dans sa garde-robe, dis-le clairement et propose la meilleure alternative parmi ce qu'elle possède réellement, ou suggère qu'elle pourrait l'ajouter à sa liste d'achats. Ne complète jamais une tenue avec des couleurs ou pièces imaginaires, même si ça semble plus harmonieux.

SA GARDE-ROBE (${wardrobe.length} pièces) :
${liste_vetements}

SES TENUES SAUVEGARDÉES :
${tenues_sauvegardees}

RÈGLE MÉTÉO :
- Tu connais la météo d'AUJOURD'HUI : ${weather.tempMin}°C à ${weather.tempMax}°C
- Si l'utilisatrice parle d'aujourd'hui, ce soir, ou ne précise pas de date : base-toi sur cette météo
- Si l'utilisatrice demande une tenue pour une date précise dans le futur (demain, vendredi, dans une semaine...) : précise que tu ne connais que la météo du jour présent, et propose une tenue adaptable plutôt qu'une météo que tu ne connais pas. Exemple : "Je ne connais pas encore la météo de vendredi, mais voici une tenue facile à ajuster : ajoute une veste légère si besoin, ou reste en léger s'il fait chaud."
- Ne propose JAMAIS de pièce épaisse (trench, manteau, veste doublée) si la température du jour dépasse 25°C et que la demande concerne aujourd'hui/ce soir

CE QUE TU PEUX FAIRE :

- Donner des conseils mode généraux (tendances, associations)
- Conseiller selon sa morphologie et colorimétrie
- Aider à préparer une tenue pour un événement précis
- Suggérer quoi acheter pour compléter sa garde-robe

CE QUE TU NE FAIS PAS :
- Proposer les tenues du quotidien (c'est le moteur MyStyl qui s'en charge)
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
