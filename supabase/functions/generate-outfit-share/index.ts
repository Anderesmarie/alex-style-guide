import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CANVAS_W = 360
const CANVAS_H = 500

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

    // 1. Lire la tenue
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

    // 2. Lire les images
    const { data: garments } = await supabase
      .from('wardrobe')
      .select('id, image_url')
      .in('id', outfit.item_ids)

    const pieces = outfit.layout_data?.pieces || []

    // 3. Construire le SVG
    const imageEmbeds = await Promise.all(
      pieces.map(async (piece: any) => {
        const garment = garments?.find(g => g.id === piece.itemId)
        if (!garment?.image_url) return ''

        try {
          const res = await fetch(garment.image_url)
          const blob = await res.arrayBuffer()
          const b64 = btoa(String.fromCharCode(...new Uint8Array(blob)))
          const mime = res.headers.get('content-type') || 'image/jpeg'

          const px = (piece.x / 100) * CANVAS_W
          const py = (piece.y / 100) * CANVAS_H
          const pw = (piece.w / 100) * CANVAS_W
          const ph = (piece.h / 100) * CANVAS_H

          return `<image href="data:${mime};base64,${b64}" x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid meet"/>`
        } catch {
          return ''
        }
      })
    )

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <rect width="${CANVAS_W}" height="${CANVAS_H}" fill="#FDF8F5"/>
  ${imageEmbeds.join('\n  ')}
</svg>`

    console.log('SVG généré, longueur:', svg.length)

    return new Response(
      svg,
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/svg+xml'
        },
        status: 200
      }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
