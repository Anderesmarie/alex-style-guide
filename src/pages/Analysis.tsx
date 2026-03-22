export default function Analysis() {
  const cards = [
    { emoji: '🧺', title: 'Pièces basiques manquantes' },
    { emoji: '👔', title: 'Manques par occasion' },
    { emoji: '🌦️', title: 'Manques par saison' },
    { emoji: '✨', title: 'Manques par style' },
  ];

  return (
    <div className="fade-enter pb-6" style={{ backgroundColor: '#F5F0EB', minHeight: '100vh' }}>
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-serif font-bold mb-1" style={{ color: '#2C2C2C' }}>
          Mon analyse de garde-robe 🔍
        </h1>
        <p className="text-sm mb-6" style={{ color: '#9B9B9B' }}>
          Découvre ce qui manque pour compléter ton style
        </p>

        <div className="space-y-4">
          {cards.map(card => (
            <div
              key={card.title}
              className="rounded-2xl p-5 relative"
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <span
                className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: '#FDF6EC', color: '#C9956C', border: '1px solid #C9956C30' }}
              >
                Premium ✨
              </span>
              <p className="font-serif font-semibold text-base mb-2" style={{ color: '#2C2C2C' }}>
                {card.emoji} {card.title}
              </p>
              <p className="text-sm italic" style={{ color: '#9B9B9B' }}>
                Analyse en cours...
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}