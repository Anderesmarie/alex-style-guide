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
      userStyle = '',
      socialContext = '',
      dayType = '',
    } = body || {};

    if (!Array.isArray(wardrobe) || wardrobe.length === 0) {
      return new Response(JSON.stringify({ error: 'wardrobe is required (non-empty array)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tempMin = typeof weather.tempMin === 'number' ? weather.tempMin : 18;
    const tempMax = typeof weather.tempMax === 'number' ? weather.tempMax : 22;

    // Slim wardrobe payload
    const slim = wardrobe.map((w: any) => ({
      id: w.id,
      category: w.category,
      type: w.type,
      color: w.color,
      style: w.style,
      occasion: w.occasion,
      season: w.season,
    }));

    const prompt =
      `Tu es un assistant styliste créatif pour l'app MyStyl. Compose UNE tenue cohérente et originale à partir des vêtements disponibles. ` +
      `Le style préféré de l'utilisatrice est ${userStyle}, mais tu peux t'en écarter si tu trouves une association plus intéressante. ` +
      `Contexte : ${socialContext}, ${dayType}, température ${tempMin}°C à ${tempMax}°C. ` +
      `Règles : 1 haut OU 1 robe, si haut alors 1 bas obligatoire, 1 paire de chaussures si disponible, 1 veste/blazer si tempMin < 18°C, 1 accessoire max. ` +
      `Retourne UNIQUEMENT un JSON : { tenue: [ { id: 'id exact du vêtement', categorie: '...', nom: '...' } ], mood: '3 mots', raisonnement: '2-3 phrases' }`;

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
        temperature: 0.8,
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
