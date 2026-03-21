import { useEffect, useRef } from 'react';

interface Props {
  onSave: (avatarUrl: string) => void;
}

export default function AvatarCreator({ onSave }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (
        typeof event.data === 'string' &&
        event.data.startsWith('https://') &&
        event.data.includes('readyplayer.me')
      ) {
        // Ready Player Me avatar URL received
        localStorage.setItem('alex_avatar_url', event.data);
        onSave(event.data);
      }

      // Also handle JSON message format
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.source === 'readyplayerme' && data?.eventName === 'v1.avatar.exported') {
          const url = data.data?.url || data.data;
          if (typeof url === 'string') {
            localStorage.setItem('alex_avatar_url', url);
            onSave(url);
          }
        }
      } catch {
        // Not JSON, already handled above
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSave]);

  return (
    <div className="fade-enter">
      <h1 className="text-2xl font-serif font-bold mb-2">Crée ton avatar ✨</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Personnalise ton avatar 3D avec Ready Player Me
      </p>
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: '600px' }}>
        <iframe
          ref={iframeRef}
          src="https://alex.readyplayer.me"
          className="w-full h-full"
          allow="camera *; microphone *; clipboard-write"
          title="Ready Player Me Avatar Creator"
        />
      </div>
    </div>
  );
}
