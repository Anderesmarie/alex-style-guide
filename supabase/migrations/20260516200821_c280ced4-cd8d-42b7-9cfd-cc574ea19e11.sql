-- Normalisation des libellés de style orphelins vers STYLE_OPTIONS officiels
UPDATE public.wardrobe
SET style = (
  SELECT to_jsonb(array_agg(DISTINCT mapped))
  FROM (
    SELECT CASE elem
      WHEN 'Casual' THEN 'Casual chic'
      WHEN 'Chic' THEN 'Casual chic'
      WHEN 'Boho' THEN 'Bohème'
      WHEN 'Sport' THEN 'Sportswear'
      WHEN 'Bureau' THEN 'Preppy'
      ELSE elem
    END AS mapped
    FROM jsonb_array_elements_text(style) AS elem
  ) sub
)
WHERE style IS NOT NULL
  AND jsonb_typeof(style) = 'array'
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(style) e
    WHERE e IN ('Casual','Chic','Boho','Sport','Bureau')
  );