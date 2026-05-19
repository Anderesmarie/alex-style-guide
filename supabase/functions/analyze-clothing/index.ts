import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const FAL_KEY = Deno.env.get('FAL_KEY') ?? ''
const OPENAI_KEY = Deno.env.get('OPENAI_KEY') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANALYSIS_PROMPT = `Tu es un expert en mode. Analyse ce vêtement et retourne UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après.

Utilise EXCLUSIVEMENT les valeurs suivantes :

CATÉGORIES > SOUS-CATÉGORIES > TYPES :

- "Manteaux & vestes" > "Manteaux" > ["Manteaux longs","Manteau court","Parka","Imperméable","Trench","Caban","Duffle-coat","Bomber"]

- "Manteaux & vestes" > "Vestes" > ["Veste en jean","Perfecto","Doudoune","Veste militaire","Veste coupe-vent","Veste chic","Blouson","Cape / Poncho"]

- "Manteaux & vestes" > "Vestes sans manches" > ["Gilet sans manches","Doudoune sans manches"]

- "Hauts" > "T-shirts & tops" > ["Blouses","T-shirts","Débardeurs","Crop top","Top corset","Top à lacets","Tops courts","Tuniques","Tops épaules dénudées","Bodies","Cols roulés","T-shirt oversize","T-shirt graphique","Autres hauts"]

- "Hauts" > "Chemises & blouses" > ["Chemise classique","Chemise oversize","Tunique"]

- "Hauts" > "Pulls & sweats" > ["Sweat oversize","Pull col rond","Pull col V","Pull col roulé","Pull sans manche","Cardigan","Hoodie","Veste en maille / tricot"]

- "Hauts" > "Blazers & tailleurs" > ["Blazer classique","Blazer oversize","Tailleurs pièces séparées","Ensemble tailleur/pantalon","Jupe et robe tailleur","Autres ensembles et tailleurs"]

- "Bas" > "Jeans" > ["Jean baggy","Jean boyfriend","Jean skinny","Jean droit","Jean évasé","Jean taille haute","Jean court","Jean troué","Autre jean"]

- "Bas" > "Pantalons" > ["Pantalons courts et chinos","Pantalons skinny","Pantalons ajustés","Pantalons à jambes larges","Leggings","Pantalons en cuir","Pantalons droits","Pantalons cargo","Pantalon pyjama (ville)","Jogging","Autres pantalons et leggings"]

- "Bas" > "Shorts" > ["Shorts taille haute","Shorts en jean","Shorts longueur genou","Shorts cargo","Bermuda","Autres shorts"]

- "Bas" > "Jupes" > ["Mini-jupes","Jupes mi-longues","Jupes longues","Jupes trapèze","Jupes moulantes","Jupes patineuses","Jupes en jean","Jupes plissées","Jupes taille haute","Jupes crayon","Autres jupes"]

- "Robes & combinaisons" > "Robes" > ["Robe courte","Robe midi","Robe longue","Robe de soirée","Robe de cérémonie","Robe bain de soleil","Robe chemise","Robe pull","Autres robes"]

- "Robes & combinaisons" > "Combinaisons" > ["Combinaison pantalon","Combinaison short","Combinaison de soirée"]

- "Streetwear" > "Streetwear pur" > ["Hoodie oversize","Sweat à capuche graphique","Jogger streetwear","Veste de survêtement","Ensemble survêtement"]

- "Streetwear" > "Skate" > ["T-shirt skate","Pantalon skate","Veste skate"]

- "Streetwear" > "Workwear urbain" > ["Cargo pant","Veste utilitaire","Salopette urbaine"]

- "Y2K & Vintage" > "Y2K" > ["Top Y2K","Jean taille basse","Mini-jupe Y2K","Ensemble Y2K","Accessoires Y2K"]

- "Y2K & Vintage" > "Vintage" > ["Pièce vintage années 70","Pièce vintage années 80","Pièce vintage années 90","Pièce vintage années 2000"]

- "Y2K & Vintage" > "Cottagecore / Boho" > ["Robe fleurie bohème","Blouse brodée","Jupe longue fleurie","Ensemble boho"]

- "Sport & activewear" > "Vêtements de sport" > ["Legging de sport","Brassière de sport","T-shirt de sport","Short de sport","Veste de sport","Ensemble sport","Sweat de sport"]

- "Sport & activewear" > "Sports d'hiver" > ["Veste de ski","Pantalon de ski","Combinaison de ski","Sous-couche thermique"]

- "Loungewear & nuit" > "Loungewear" > ["Set co-ord confort","Jogging doux","Sweat loungewear","Short loungewear","Débardeur confort"]

- "Loungewear & nuit" > "Nuit" > ["Pyjama","Chemise de nuit","Nuisette","Peignoir","Chaussettes & chaussons"]

- "Loungewear & nuit" > "Lingerie" > ["Soutien-gorge","Culotte","Body lingerie","Ensemble lingerie","Corset décoratif"]

- "Maillots & beachwear" > "Maillots" > ["Bikini","Maillot 1 pièce","Tankini","Haut de maillot","Bas de maillot"]

- "Maillots & beachwear" > "Plage" > ["Paréo","Robe de plage","Short de plage","Blouse de plage"]

- "Chaussures" > "Bottes" > ["Bottines","Bottes hautes","Bottes mi-hautes","Bottines plateforme","Bottes de combat","Chelsea boots","Bottes western","Cuissardes","Bottes de neige","Bottes de pluie"]

- "Chaussures" > "Mules et sabots" > ["Mules","Sabots / Crocs","Mules à talons"]

- "Chaussures" > "Chaussures plates" > ["Mocassins et chaussures bateau","Loafers plateforme","Ballerines","Espadrilles","Babies et Mary-Jane","Chaussures à lacets"]

- "Chaussures" > "Sandales, claquettes et tongs" > ["Sandales plateforme","Sandales plates","Sandales à talons","Sandales techniques (Salomon…)","Claquettes","Tongs"]

- "Chaussures" > "Chaussures à talons" > ["Escarpins","Sandales compensées","Talons aiguilles"]

- "Chaussures" > "Chaussons et pantoufles" > ["Uggs / bottes fourrées","Chaussons","Pantoufles"]

- "Chaussures" > "Baskets" > ["Sneakers plateforme","Baskets classiques","Baskets running","Baskets montantes","Converses","Slip-ons"]

- "Chaussures" > "Chaussures de sport" > ["Chaussures de basket","Chaussures de danse","Chaussures de course","Chaussures de fitness","Chaussures de randonnée","Chaussures de tennis"]

- "Sacs" > "Sacs" > ["Sacs à bandoulière","Sacs fourre-tout / tote bag","Sac baguette","Sacs à dos","Porte-monnaie","Pochettes","Cartables","Sacs banane","Sacs polochon","Sacs de voyage","Mini sac","Sac filet (mesh bag)","Autres sacs"]

- "Accessoires" > "Ceintures" > ["Ceinture classique","Ceinture fine","Ceinture large","Ceinture corset","Ceinture chaîne"]

- "Accessoires" > "Bijoux" > ["Colliers","Boucles d'oreilles","Bracelets","Bagues","Broches"]

- "Accessoires" > "Chaussettes & collants" > ["Chaussettes hautes","Collants opaques","Collants résille","Socquettes"]

- "Accessoires" > "Couvre-chefs" > ["Casquette","Bob","Bonnet","Chapeau","Béret"]

- "Accessoires" > "Écharpes & foulards" > ["Écharpe","Foulard","Tour de cou","Bandana"]

- "Accessoires" > "Lunettes" > ["Lunettes de soleil","Lunettes de vue"]

COULEURS autorisées :

["Blanc","Noir","Gris","Beige","Crème","Nude","Camel","Corail","Terracotta","Rouge","Bordeaux","Jaune","Rose","Fuchsia","Rose gold","Marron","Bleu ciel","Bleu","Marine","Turquoise","Vert","Kaki","Violet","Lavande","Argenté","Doré"]

MOTIFS autorisés :

["Uni","Rayé","Carreaux","Fleuri","Léopard","Zébré","Tie-dye","Graphique","Géométrique","Pied-de-poule"]

STYLES autorisés :

["Casual chic","Streetwear","Y2K","Vintage","Sportswear","Bohème","Minimaliste","Grunge","Dark","Romantique","Old Money","Preppy"]

OCCASIONS autorisées :

["Travail","Sortie","Sport","Événement","Quotidien","Plage","Cérémonie","Soirée","Cours lycée","Campus"]

SAISONS autorisées :

["Été","Automne","Hiver","Printemps","Toutes saisons"]

Format JSON STRICT :

{

  "category": "valeur exacte parmi les catégories",

  "subcategory": "valeur exacte parmi les sous-catégories",

  "type": "valeur exacte parmi les types",

  "color": "couleur principale",

  "colors": ["couleur1"],

  "season": ["saison1"],

  "style": ["style1","style2"],

  "occasion": ["occasion1","occasion2"],

  "pattern": "motif ou null si uni",

  "confidence": 0.95

}`

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
