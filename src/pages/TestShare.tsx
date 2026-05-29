import { useEffect, useState } from 'react';

const OUTFIT_ID = 'e252aa45-f0de-4adc-9f91-951b8ffbfc65';
const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-outfit-share`;

export default function TestShare() {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(FN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ outfit_id: OUTFIT_ID }),
        });
        const text = await res.text();
        if (!res.ok) {
          setError(`HTTP ${res.status}: ${text}`);
          return;
        }
        setSvg(text);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Test generate-outfit-share</h1>
      <p>outfit_id: {OUTFIT_ID}</p>
      {error && <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</pre>}
      {svg && (
        <div
          style={{ border: '1px solid #ccc', display: 'inline-block' }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
      {!svg && !error && <p>Chargement...</p>}
    </div>
  );
}
