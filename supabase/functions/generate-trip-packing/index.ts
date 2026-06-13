import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const BAG_LIMITS: Record<string, number> = {
  'cabine-legere': 12,
  'valise-cabine': 20,
  'valise-soute': 35,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      wardrobe = [],
      savedOutfits = [],
      destination = '',
      nbDays = 1,
      tempMin = 15,
      tempMax = 25,
      styles = [],
      occasions = [],
      bagType = 'valise-cabine',
    } = body;

    const maxPieces = BAG_LIMITS[bagType] ?? 20;

    const slimWardrobe = (wardrobe as any[]).map((it) => ({
      id: it.id,
      category: it.category,
      subcategory: it.subcategory,
      type: it.type,
      color: it.color,
      style: it.style,
      occasion: it.occasion,
    }));

    const slimOutfits = (savedOutfits as any[]).slice(0, 10).map((o) => ({
      name: o.name,
      itemIds: o.itemIds,
    }));

    const stylesStr = Array.isArray(styles) ? styles.join(', ') : String(styles);
    const occasionsStr = Array.isArray(occasions) ? occasions.join(', ') : String(occasions);

    const systemPrompt = `Tu es une styliste personnelle qui prépare une valise.
Voyage de ${nbDays} jours à ${destination}, ${tempMin}–${tempMax}°C.
Styles : ${stylesStr}. Occasions : ${occasionsStr}.
Bagage : ${bagType} max ${maxPieces} pièces.

Règles strictes :
- Utilise UNIQUEMENT les ids fournis dans la garde-robe ci-dessous.
- Ne dépasse JAMAIS ${maxPieces} pièces au total.
${tempMin < 14 ? '- Température basse : PAS de shorts ni jupes courtes.' : ''}
${tempMin < 18 ? '- Inclure au moins 1 veste ou manteau.' : ''}

Retourne UNIQUEMENT un JSON strict de la forme :
{
  "valise": {
    "Hauts": [{"id": "...", "type": "...", "color": "..."}],
    "Bas": [...],
    "Robes & Combinaisons": [...],
    "Chaussures": [...],
    "Vestes & Manteaux": [...],
    "Accessoires": [...]
  },
  "conseil": "1 phrase de conseil styling pour ce voyage"
}`;

    const userPrompt = JSON.stringify({
      wardrobe: slimWardrobe,
      savedOutfits: slimOutfits,
    });

    const openaiKey = Deno.env.get('OPENAI_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_KEY manquante' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('OpenAI error:', aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'Erreur OpenAI', status: aiRes.status, details: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? '{}';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('JSON parse error:', e, content);
      return new Response(
        JSON.stringify({ error: 'Réponse IA invalide', raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('generate-trip-packing error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
