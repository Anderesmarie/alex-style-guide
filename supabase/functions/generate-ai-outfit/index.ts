const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || Deno.env.get("OPENAI_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      wardrobe = [],
      weather = {},
      profil = {},
      anti_repetition = {},
      socialContext = "Quotidien",
      dayType = "Semaine",
      currentSeason = "",
    } = body || {};

    if (!Array.isArray(wardrobe) || wardrobe.length === 0) {
      return new Response(JSON.stringify({ error: "wardrobe is required (non-empty array)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tempMin = typeof weather.tempMin === "number" ? weather.tempMin : 18;
    const tempMax = typeof weather.tempMax === "number" ? weather.tempMax : 22;
    const isRaining = !!weather.isRaining;
    const isWindy = !!weather.isWindy;
    const wardrobeSize = wardrobe.length;

    // Slim wardrobe payload — inclut temperatures et pattern
    const slim = wardrobe.map((w: any) => ({
      id: w.id,
      category: w.category,
      subcategory: w.subcategory,
      type: w.type,
      color: Array.isArray(w.color) ? w.color : [w.color],
      pattern: w.pattern || "uni",
      style: w.style,
      occasion: w.occasion,
      temperatures: w.temperatures || [],
      est_ensemble: w.category === "Ensembles",
    }));

    // Profil utilisatrice
    const morphologie = profil.morphologie || null;
    const colorimetrie = profil.colorimetrie || null;
    const isWeekend = dayType === "Weekend";
    const stylesActifs = isWeekend
      ? profil.styles_weekend?.length
        ? profil.styles_weekend
        : profil.styles || []
      : profil.styles_semaine?.length
        ? profil.styles_semaine
        : profil.styles || [];

    // Anti-répétition — adapter selon taille du dressing
    const combosRejetees: string[][] = Array.isArray(anti_repetition.combos_rejetees)
      ? anti_repetition.combos_rejetees
      : [];
    const idsBloques: string[] = Array.isArray(anti_repetition.ids_bloques) ? anti_repetition.ids_bloques : [];
    const idsPortes: string[] = Array.isArray(anti_repetition.ids_portes) ? anti_repetition.ids_portes : [];
    const tenuesAimees: string[][] = Array.isArray(anti_repetition.tenues_aimees) ? anti_repetition.tenues_aimees : [];

    const petitDressing = wardrobeSize < 15;

    // Règles météo
    const rainRule = isRaining
      ? `Il pleut : évite les matières fragiles (soie, daim, lin), favorise des chaussures fermées et imperméables. `
      : "";
    const windRule = isWindy ? `Il y a du vent : évite les jupes très courtes non structurées. ` : "";
    const coldRule =
      tempMin < 10
        ? `Il fait très froid (< 10°C) : PAS de shorts, ni de jupes sans collants, ni de tops légers seuls. `
        : tempMin < 14
          ? `Il fait frais (< 14°C) : évite les shorts et les mini-jupes sans collants. `
          : "";
    const jacketRule =
      tempMin < 18
        ? `Ajoute une couche extérieure (veste, blazer, manteau) si disponible dans le dressing — tempMin < 18°C. `
        : "";

    // Règles profil
    const morphoRule = morphologie ? `Morphologie ${morphologie} : adapte les silhouettes en conséquence. ` : "";
    const colorRule = colorimetrie
      ? `Colorimétrie ${colorimetrie} : favorise les couleurs flatteuses pour ce type. `
      : "";
    const styleRule = stylesActifs.length > 0
      ? `Ambiance générale souhaitée (${dayType}) : ${stylesActifs.join(', ')}. Cette ambiance est une inspiration, pas un filtre strict. `
      : '';

    const occasionRule = `RÈGLE ABSOLUE — priorité maximale : toute pièce ayant "${socialContext}" dans son champ "occasion" EST adaptée à la situation, quel que soit son style, sa couleur ou son ambiance. L'utilisatrice a elle-même décidé que cette pièce convient à ce contexte — cette décision est INVIOLABLE et écrase toute autre considération stylistique. Le style général (${stylesActifs.join(', ')}) est une inspiration secondaire, jamais un filtre bloquant. `;

    // Règles anti-répétition
    let antiRepRule = "";
    if (!petitDressing) {
      if (idsBloques.length > 0) {
        antiRepRule += `INTERDIT — ne reproduis JAMAIS ces combinaisons de pièces (swipe gauche) : ${JSON.stringify(combosRejetees)}. `;
      }
      if (idsPortes.length > 0) {
        antiRepRule += `ÉVITE — ces pièces ont été portées récemment, ne les propose pas : ${JSON.stringify(idsPortes)}. `;
      }
      if (combosRejetees.length > 0) {
        antiRepRule += `DIVERSIFIE — évite de reproduire ces silhouettes récentes : ${JSON.stringify(combosRejetees)}. `;
      }
    } else {
      // Petit dressing : seulement les combos rejetées (swipe gauche strict)
      if (combosRejetees.length > 0) {
        antiRepRule += `INTERDIT — ne reproduis JAMAIS ces combinaisons exactes : ${JSON.stringify(combosRejetees)}. `;
      }
    }

    // Tenues aimées — inspiration style
    const tenuesAimeesRule =
      tenuesAimees.length > 0
        ? `INSPIRATION — ces tenues ont été aimées par la fille, inspire-toi de leur style si la météo et l'occasion sont compatibles (tu peux les reproposer si pertinent) : ${JSON.stringify(tenuesAimees)}. `
        : "";

    // Règles ensembles 2 pièces
    const ensembleRule = `Un ensemble 2 pièces (category = "Ensembles") est une pièce centrale complète : n'ajoute PAS de haut ni de bas supplémentaire sur un ensemble — uniquement chaussures et accessoires. `;

    // Règles sport & loungewear
    const sportRule = `Les pièces de sport et loungewear (category = "Sport & Loungewear") ne sont proposées QUE pour les occasions Sport ou Plage. Jamais pour Quotidien, Campus, Travail, Sortie, Soirée. `;

    // Règle températures
    const tempRule = `La compatibilité température s'applique à la pièce la plus EXTÉRIEURE uniquement. Les pièces en dessous peuvent avoir n'importe quelle plage de température. Température du jour : ${tempMin}°C à ${tempMax}°C. `;

    const prompt =
      `Tu es un styliste créatif pour l'app MyStyl, spécialisé dans la mode féminine 15-25 ans. ` +
      `Compose 3 TENUES DISTINCTES et visuellement différentes à partir des vêtements disponibles dans la garde-robe. ` +
      `\n\nCONTEXTE : Occasion : ${socialContext}. Jour : ${dayType}. Saison : ${currentSeason}. ` +
      `Température : ${tempMin}°C à ${tempMax}°C. ` +
      `\n\nPROFIL : ${morphoRule}${colorRule}${styleRule}${occasionRule}` +
      `\n\nMÉTÉO : ${tempRule}${rainRule}${windRule}${coldRule}${jacketRule}` +
      `\n\nRÈGLES STRICTES PAR TENUE : ` +
      `1 haut OU 1 robe OU 1 ensemble 2 pièces (jamais les deux) ; ` +
      `si haut alors 1 bas obligatoire ; ` +
      `1 paire de chaussures si disponible dans le dressing ; ` +
      `max 2 accessoires par tenue, uniquement si disponibles ; ` +
      `utilise UNIQUEMENT des id présents dans la liste fournie. ` +
      `\n\n${ensembleRule}` +
      `${sportRule}` +
      `\n\nANTI-RÉPÉTITION : ${antiRepRule}${tenuesAimeesRule}` +
      `\n\nLes 3 tenues doivent être visuellement distinctes entre elles (couleurs, silhouettes, styles différents). ` +
      `\n\nRETOUR : Retourne UNIQUEMENT un JSON strict : ` +
      `{ "tenues": [ { "tenue": [ { "id": "<id exact>", "categorie": "...", "nom": "..." } ], "mood": "3 mots max", "description": "1 phrase style" }, { ... }, { ... } ], "message": null }. ` +
      `Le champ "message" est null si tout va bien. Il contient un message d'alerte uniquement si une couche manque pour la météo ou si aucune chaussure adaptée n'est disponible.`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Garde-robe disponible (JSON):\n${JSON.stringify(slim)}` },
        ],
        temperature: 0.85,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error", openaiRes.status, errText);
      return new Response(JSON.stringify({ error: "OpenAI error", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await openaiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON from model", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ai-outfit error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
