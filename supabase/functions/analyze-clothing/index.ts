import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const FAL_KEY = Deno.env.get('FAL_KEY') ?? ''
const OPENAI_KEY = Deno.env.get('OPENAI_KEY') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANALYSIS_PROMPT = `PLACEHOLDER`

async function removeBackground(base64Image: string): Promise<string> {
  const isDataUrl = base64Image.startsWith('data:')
  const imageData = isDataUrl ? base64Image : `data:image/jpeg;base64,${base64Image}`
  const falRes = await fetch('https://fal.run/fal-ai/birefnet', {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageData,
      model: 'General Use (Light)',
      operating_resolution: '1024x1024',
      refine_foreground: true,
      output_format: 'png',
    }),
  })
  if (!falRes.ok) throw new Error(`fal.ai BiRefNet: ${falRes.status}`)
  const falData = await falRes.json()
  const cleanUrl: string = falData.image?.url
  if (!cleanUrl) throw new Error(`fal.ai: pas d'URL dans la réponse`)
  const imgRes = await fetch(cleanUrl)
  const imgBytes = new Uint8Array(await imgRes.arrayBuffer())
  let binary = ''
  imgBytes.forEach((b) => (binary += String.fromCharCode(b)))
  return `data:image/png;base64,${btoa(binary)}`
}

async function analyzeClothing(base64Image: string): Promise<unknown> {
  const isDataUrl = base64Image.startsWith('data:')
  const imageData = isDataUrl ? base64Image.split(',')[1] : base64Image
  const mediaType = base64Image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mediaType};base64,${imageData}`,
              detail: 'low'
            }
          },
          { type: 'text', text: ANALYSIS_PROMPT }
        ]
      }]
    }),
  })
  if (!res.ok) throw new Error(`OpenAI API: ${res.status}`)
  const data = await res.json()
  const rawText: string = data.choices?.[0]?.message?.content || ''
  const cleaned = rawText.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  try {
    const { image, skipBackgroundRemoval } = await req.json()
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'image manquante' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }
    const start = Date.now()
    let cleanImage = image
    let bgRemoved = false
    if (!skipBackgroundRemoval && FAL_KEY) {
      try {
        cleanImage = await removeBackground(image)
        bgRemoved = true
      } catch (err) {
        console.error('Background removal failed:', err)
      }
    }
    const analysis = await analyzeClothing(cleanImage)
    return new Response(
      JSON.stringify({ cleanImage, analysis, bgRemoved, processingMs: Date.now() - start }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Pipeline error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
