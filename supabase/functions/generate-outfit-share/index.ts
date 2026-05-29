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
    console.log('outfit_id reçu:', outfit_id)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: outfit, error } = await supabase
      .from('outfits')
      .select('id, name, item_ids, layout_data, user_id')
      .eq('id', outfit_id)
      .single()

    if (error || !outfit) {
      console.error('Tenue non trouvée:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Tenue non trouvée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('Tenue trouvée:', JSON.stringify(outfit))
    console.log('item_ids:', outfit.item_ids)
    console.log('layout_data:', JSON.stringify(outfit.layout_data))

    return new Response(
      JSON.stringify({
        success: true,
        outfit_id: outfit.id,
        name: outfit.name,
        item_ids: outfit.item_ids,
        layout_data: outfit.layout_data,
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