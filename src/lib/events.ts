export interface CalendarEvent {
  id: string;
  emoji: string;
  name: string;
  message7days: string;
  message3days: string;
  messageDayOf: string;
  occasion: string;
  getDate: (year: number) => Date;
}

export interface SalesEvent {
  id: string;
  emoji: string;
  name: string;
  messageBeforeStart: string;
  messageDuring: string;
  getStart: (year: number) => Date;
  getEnd: (year: number) => Date;
}

function lastFridayOfNovember(year: number): Date {
  const d = new Date(year, 10, 30); // Nov 30
  while (d.getDay() !== 5) d.setDate(d.getDate() - 1);
  return d;
}

export const OCCASIONS: CalendarEvent[] = [
  {
    id: 'valentines', emoji: '💝', name: 'Saint-Valentin',
    message7days: '💝 Saint-Valentin dans {days} jours — Alex a des idées de tenues pour toi !',
    message3days: '💝 Saint-Valentin dans {days} jours — Prépare ta plus belle tenue !',
    messageDayOf: '💝 Joyeuse Saint-Valentin ! Sois la plus belle ce soir ✨',
    occasion: 'Sortie',
    getDate: (y) => new Date(y, 1, 14),
  },
  {
    id: 'halloween', emoji: '🎃', name: 'Halloween',
    message7days: '🎃 Halloween dans {days} jours — Alex a des idées de tenues pour toi !',
    message3days: '🎃 Halloween dans {days} jours — Prépare ton look !',
    messageDayOf: '🎃 Happy Halloween ! Montre ton plus beau look ce soir ✨',
    occasion: 'Sortie',
    getDate: (y) => new Date(y, 9, 31),
  },
  {
    id: 'christmas', emoji: '🎄', name: 'Noël',
    message7days: '🎄 Noël dans {days} jours — Alex a des idées de tenues pour toi !',
    message3days: '🎄 Noël dans {days} jours — Prépare ta tenue de fête !',
    messageDayOf: '🎄 Joyeux Noël ! Brille de mille feux aujourd\'hui ✨',
    occasion: 'Sortie',
    getDate: (y) => new Date(y, 11, 25),
  },
  {
    id: 'newyear', emoji: '🥂', name: 'Nouvel An',
    message7days: '🥂 Nouvel An dans {days} jours — Alex a des idées de tenues pour toi !',
    message3days: '🥂 Nouvel An dans {days} jours — Prépare ta tenue de réveillon !',
    messageDayOf: '🥂 Bonne année ! Sois éblouissante ce soir ✨',
    occasion: 'Sortie',
    getDate: (y) => new Date(y, 11, 31),
  },
  {
    id: 'backtoschool', emoji: '🎒', name: 'Rentrée',
    message7days: '🎒 La rentrée dans {days} jours — Prépare tes plus beaux looks !',
    message3days: '🎒 La rentrée dans {days} jours — Alex t\'aide à choisir !',
    messageDayOf: '🎒 C\'est la rentrée ! Commence l\'année en beauté ✨',
    occasion: 'Quotidien',
    getDate: (y) => new Date(y, 8, 1),
  },
  {
    id: 'blackfriday', emoji: '🛍️', name: 'Black Friday',
    message7days: '🛍️ Black Friday dans {days} jours — Prépare ta wishlist !',
    message3days: '🛍️ Black Friday dans {days} jours — C\'est bientôt le moment !',
    messageDayOf: '🛍️ C\'est Black Friday ! Le moment parfait pour compléter ton dressing ✨',
    occasion: 'Quotidien',
    getDate: (y) => lastFridayOfNovember(y),
  },
];

export const SALES: SalesEvent[] = [
  {
    id: 'winter-sales', emoji: '❄️', name: 'Soldes d\'hiver',
    messageBeforeStart: '❄️ Les soldes d\'hiver arrivent dans {days} jours — Prépare ta wishlist !',
    messageDuring: '❄️ Soldes d\'hiver en cours — C\'est le moment de compléter ton dressing !',
    getStart: (y) => new Date(y, 0, 1),
    getEnd: (y) => new Date(y, 0, 31),
  },
  {
    id: 'summer-sales', emoji: '☀️', name: 'Soldes d\'été',
    messageBeforeStart: '☀️ Les soldes d\'été arrivent dans {days} jours — Prépare ta wishlist !',
    messageDuring: '☀️ Soldes d\'été en cours — C\'est le moment de compléter ton dressing !',
    getStart: (y) => new Date(y, 6, 1),
    getEnd: (y) => new Date(y, 6, 31),
  },
  {
    id: 'blackfriday-sale', emoji: '🛍️', name: 'Black Friday',
    messageBeforeStart: '🛍️ Black Friday dans {days} jours — Prépare ta wishlist !',
    messageDuring: '🛍️ C\'est Black Friday ! Le moment parfait pour shopper ✨',
    getStart: (y) => lastFridayOfNovember(y),
    getEnd: (y) => lastFridayOfNovember(y),
  },
];

const DISMISSED_KEY = 'mystyl_dismissed_banners';

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch { return []; }
}

export function dismissBanner(id: string) {
  const list = getDismissed();
  if (!list.includes(id)) {
    list.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(list));
  }
}

export function isDismissed(id: string): boolean {
  return getDismissed().includes(id);
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const aStart = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bStart = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((bStart - aStart) / msPerDay);
}

export type BannerLevel = 'subtle' | 'visible' | 'highlight';

export interface ActiveBanner {
  id: string;
  message: string;
  level: BannerLevel;
  showButton: boolean;
  occasion?: string;
}

export function getActiveBanner(now: Date = new Date()): ActiveBanner | null {
  const year = now.getFullYear();
  const dismissed = getDismissed();

  // Check occasions first (closest wins)
  let bestOccasion: { event: CalendarEvent; days: number } | null = null;

  for (const ev of OCCASIONS) {
    let eventDate = ev.getDate(year);
    // If event already passed this year, check next year
    if (daysBetween(now, eventDate) < 0) {
      eventDate = ev.getDate(year + 1);
    }
    const days = daysBetween(now, eventDate);
    if (days >= 0 && days <= 7) {
      const bannerId = `${ev.id}-${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      if (dismissed.includes(bannerId)) continue;
      if (!bestOccasion || days < bestOccasion.days) {
        bestOccasion = { event: ev, days };
      }
    }
  }

  if (bestOccasion) {
    const { event, days } = bestOccasion;
    const eventDate = days <= 0 ? event.getDate(year) : event.getDate(daysBetween(now, event.getDate(year)) < 0 ? year + 1 : year);
    const bannerId = `${event.id}-${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;

    if (days === 0) {
      return { id: bannerId, message: event.messageDayOf, level: 'highlight', showButton: true, occasion: event.occasion };
    } else if (days <= 3) {
      return { id: bannerId, message: event.message3days.replace('{days}', String(days)), level: 'visible', showButton: true, occasion: event.occasion };
    } else {
      return { id: bannerId, message: event.message7days.replace('{days}', String(days)), level: 'subtle', showButton: false };
    }
  }

  // Check sales
  for (const sale of SALES) {
    const start = sale.getStart(year);
    const end = sale.getEnd(year);
    const daysToStart = daysBetween(now, start);
    const daysToEnd = daysBetween(now, end);

    // During sales
    if (daysToStart <= 0 && daysToEnd >= 0) {
      const bannerId = `${sale.id}-during-${year}`;
      if (dismissed.includes(bannerId)) continue;
      return { id: bannerId, message: sale.messageDuring, level: 'highlight', showButton: false };
    }

    // 7 days before
    if (daysToStart > 0 && daysToStart <= 7) {
      const bannerId = `${sale.id}-before-${year}`;
      if (dismissed.includes(bannerId)) continue;
      return { id: bannerId, message: sale.messageBeforeStart.replace('{days}', String(daysToStart)), level: 'subtle', showButton: false };
    }
  }

  return null;
}
