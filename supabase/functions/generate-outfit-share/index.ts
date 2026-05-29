import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { outfit_id } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Lire la tenue
    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('id, name, item_ids, layout_data, user_id')
      .eq('id', outfit_id)
      .single()

    if (outfitError || !outfit) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tenue non trouvée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Lire le pseudo depuis profils
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', outfit.user_id)
      .single()

    const pseudo = profile?.username || 'MyStyl'
    console.log('Pseudo:', pseudo)

    // Lire les images des vêtements
    const { data: garments, error: garmentError } = await supabase
      .from('wardrobe')
      .select('id, image_url')
      .in('id', outfit.item_ids)

    if (garmentError || !garments) {
      return new Response(
        JSON.stringify({ success: false, error: 'Vêtements non trouvés' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('Vêtements trouvés:', garments.length)
    garments.forEach(g => console.log('  -', g.id, '→', g.image_url?.substring(0, 60)))

    return new Response(
      JSON.stringify({
        success: true,
        pseudo,
        garments_count: garments.length,
        garments: garments.map(g => ({ id: g.id, has_image: !!g.image_url })),
        layout_pieces: outfit.layout_data?.pieces?.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})