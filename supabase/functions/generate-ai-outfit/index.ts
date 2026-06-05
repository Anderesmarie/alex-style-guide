const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENAI_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      wardrobe = [],
      weather = {},
      mood = '',
      socialContext = 'Quotidien',
      dayType = 'Semaine',
      currentSeason = '',
    } = body || {};

    if (!Array.isArray(wardrobe) || wardrobe.length === 0) {
      return new Response(JSON.stringify({ error: 'wardrobe is required (non-empty array)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tempMin = typeof weather.tempMin === 'number' ? weather.tempMin : 18;
    const tempMax = typeof weather.tempMax === 'number' ? weather.tempMax : 22;
    const isRaining = !!weather.isRaining;

    // Slim wardrobe payload
    const slim = wardrobe.map((w: any) => ({
      id: w.id,
      category: w.category,
      subcategory: w.subcategory,
      type: w.type,
      color: w.color,
      style: w.style,
      occasion: w.occasion,
      season: w.season,
    }));

    const rainRule = isRaining
      ? `Il pleut : évite les matières fragiles (soie, daim, lin), favorise des chaussures fermées. `
      : '';
    const coldRule = tempMin < 14
      ? `Il fait froid (< 14°C) : PAS de shorts, ni de mini-jupes. `
      : '';
    const jacketRule = tempMin < 18
      ? `Ajoute 1 veste ou blazer (tempMin < 18°C). `
      : '';

    const prompt =
      `Tu es un styliste créatif pour l'app MyStyl. Compose 3 TENUES DISTINCTES (associations visuellement différentes les unes des autres) à partir des vêtements disponibles. ` +
      `Contexte social : ${socialContext}. Jour : ${dayType}. Saison actuelle : ${currentSeason}. ` +
      `Température : ${tempMin}°C à ${tempMax}°C. ${rainRule}${coldRule}` +
      `Mood d'inspiration (pas une contrainte stricte) : ${mood || 'libre'}. ` +
      `Règles strictes par tenue : ` +
      `1 haut OU 1 robe ; si haut alors 1 bas obligatoire ; ` +
      `1 paire de chaussures si disponible ; ` +
      `${jacketRule}` +
      `1 accessoire maximum ; ` +
      `pièces adaptées à la saison ${currentSeason} ; ` +
      `pièces adaptées au contexte ${socialContext}. ` +
      `Les 3 tenues doivent être visuellement distinctes entre elles (couleurs, silhouettes, ou associations différentes). ` +
      `Utilise uniquement des id présents dans la liste fournie. ` +
      `Retourne UNIQUEMENT un JSON strict de la forme : ` +
      `{ "tenues": [ { "tenue": [ { "id": "<id exact>", "categorie": "...", "nom": "..." } ], "mood": "3 mots", "raisonnement": "1-2 phrases" }, { ... }, { ... } ] }`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Vêtements disponibles (JSON):\n${JSON.stringify(slim)}` },
        ],
        temperature: 0.9,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error', openaiRes.status, errText);
      return new Response(JSON.stringify({ error: 'OpenAI error', details: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await openaiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON from model', raw: content }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-ai-outfit error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
