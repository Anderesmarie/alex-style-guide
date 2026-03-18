import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getActiveBanner, dismissBanner, ActiveBanner } from '@/lib/events';

interface EventBannerProps {
  onViewOutfits?: (occasion: string) => void;
}

export default function EventBanner({ onViewOutfits }: EventBannerProps) {
  const [banner, setBanner] = useState<ActiveBanner | null>(null);

  useEffect(() => {
    setBanner(getActiveBanner());
  }, []);

  if (!banner) return null;

  const handleDismiss = () => {
    dismissBanner(banner.id);
    setBanner(null);
  };

  const isHighlight = banner.level === 'highlight';
  const isVisible = banner.level === 'visible';

  return (
    <div
      className={`rounded-xl p-4 mb-4 relative transition-all ${
        isHighlight
          ? 'bg-primary text-primary-foreground shadow-md'
          : isVisible
          ? 'bg-card border-2 border-primary/30 card-shadow'
          : 'bg-secondary card-shadow'
      }`}
    >
      <button
        onClick={handleDismiss}
        className={`absolute top-2 right-2 p-1 rounded-full transition-opacity opacity-50 hover:opacity-100 ${
          isHighlight ? 'text-primary-foreground' : 'text-muted-foreground'
        }`}
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>

      <p className={`text-sm font-medium pr-6 ${
        isHighlight ? 'text-primary-foreground' : 'text-foreground'
      }`}>
        {banner.message}
      </p>

      {banner.showButton && banner.occasion && onViewOutfits && (
        <button
          onClick={() => onViewOutfits(banner.occasion!)}
          className={`mt-3 text-sm font-semibold py-1.5 px-4 rounded-lg transition-all active:scale-[0.97] ${
            isHighlight
              ? 'bg-primary-foreground text-primary'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          Voir les tenues ✨
        </button>
      )}
    </div>
  );
}
