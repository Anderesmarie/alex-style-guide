import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CANVAS_W = 360
const CANVAS_H = 500

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let b64 = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    b64 += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(b64)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { outfit_id } = await req.json()
    console.log('START', outfit_id)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: outfit, error: outfitError } = await supabase
      .from('outfits')
      .select('id, name, item_ids, layout_data, user_id')
      .eq('id', outfit_id)
      .single()

    if (outfitError || !outfit) {
      console.error('Tenue non trouvée')
      return new Response(
        JSON.stringify({ success: false, error: 'Tenue non trouvée' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('Tenue OK:', outfit.name)

    const { data: garments } = await supabase
      .from('wardrobe')
      .select('id, image_url')
      .in('id', outfit.item_ids)

    console.log('Garments:', garments?.length)

    const pieces = (outfit.layout_data?.pieces || [])
      .sort((a: any, b: any) => a.z - b.z)

    // Fond MyStyl
    let bgEmbed = ''
    try {
      const bgRes = await fetch('https://tseermbuwyrzcrulhxba.supabase.co/storage/v1/object/public/assets/fond-mystyl-final.png')
      const bgBuffer = await bgRes.arrayBuffer()
      const bgB64 = toBase64(bgBuffer)
      bgEmbed = `<image href="data:image/png;base64,${bgB64}" x="0" y="0" width="${CANVAS_W}" height="${CANVAS_H}" preserveAspectRatio="xMidYMid slice"/>`
      console.log('Fond OK')
    } catch (e) {
      console.error('Fond failed:', e?.message)
    }

    const imageEmbeds = await Promise.all(
      pieces.map(async (piece: any) => {
        const garment = garments?.find(g => g.id === piece.itemId)
        if (!garment?.image_url) {
          console.log('No image_url for:', piece.itemId)
          return ''
        }
        try {
          const res = await fetch(garment.image_url)
          const buffer = await res.arrayBuffer()
          const b64 = toBase64(buffer)
          const mime = res.headers.get('content-type') || 'image/jpeg'
          const px = (piece.x / 100) * CANVAS_W
          const py = CANVAS_H - ((piece.y / 100) * CANVAS_H) - ((piece.h / 100) * CANVAS_H)
          const pw = (piece.w / 100) * CANVAS_W
          const ph = (piece.h / 100) * CANVAS_H
          console.log('Image OK:', piece.itemId)
          return `<image href="data:${mime};base64,${b64}" x="${px}" y="${py}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid meet"/>`
        } catch (e) {
          console.error('Image failed:', piece.itemId, e?.message)
          return ''
        }
      })
    )

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  ${bgEmbed}
  ${imageEmbeds.join('\n  ')}
</svg>`

    console.log('SVG longueur:', svg.length, 'images:', imageEmbeds.filter(e => e !== '').length)

    const filePath = `${outfit_id}.svg`
    const { error: uploadError } = await supabase.storage
      .from('outfit-shares')
      .upload(filePath, new Blob([svg], { type: 'image/svg+xml' }), {
        contentType: 'image/svg+xml',
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload failed:', uploadError)
      throw uploadError
    }

    const { data: publicData } = supabase.storage
      .from('outfit-shares')
      .getPublicUrl(filePath)

    const shareUrl = `${publicData.publicUrl}?t=${Date.now()}`

    await supabase
      .from('outfits')
      .update({ share_snapshot_url: shareUrl })
      .eq('id', outfit_id)

    console.log('DONE:', shareUrl)

    return new Response(
      JSON.stringify({ success: true, share_url: shareUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('ERREUR GLOBALE:', error?.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
