import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ClothingAnalysis {
  category: string
  subcategory: string
  type: string
  color: string
  colors: string[]
  season: string[]
  style: string[]
  occasion: string[]
  pattern: string | null
  confidence: number
}

export function useClothingAnalysis() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cleanImage, setCleanImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ClothingAnalysis | null>(null)

  const analyze = useCallback(async (base64Image: string) => {
    setLoading(true)
    setError(null)
    setCleanImage(null)
    setAnalysis(null)
    try {
      const { data, error } = await supabase.functions.invoke(
        'analyze-clothing',
        { body: { image: base64Image } }
      )
      if (error) throw new Error(error.message)
      if (!data?.analysis) throw new Error('Analyse incomplète')
      setCleanImage(data.cleanImage ?? null)
      setAnalysis(data.analysis)
      return data.analysis as ClothingAnalysis
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setCleanImage(null)
    setAnalysis(null)
  }, [])

  return { analyze, reset, loading, error, cleanImage, analysis }
}
