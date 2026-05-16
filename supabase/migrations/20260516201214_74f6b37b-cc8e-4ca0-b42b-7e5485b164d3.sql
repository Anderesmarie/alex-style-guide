ALTER TABLE public.wardrobe ADD COLUMN color_new jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.wardrobe w
SET color_new = COALESCE(sub.arr, '[]'::jsonb)
FROM (
  SELECT id, to_jsonb(array_agg(btrim(v))) AS arr
  FROM public.wardrobe, unnest(string_to_array(color, ',')) v
  WHERE color IS NOT NULL AND btrim(v) <> ''
  GROUP BY id
) sub
WHERE w.id = sub.id;

ALTER TABLE public.wardrobe DROP COLUMN color;
ALTER TABLE public.wardrobe RENAME COLUMN color_new TO color;