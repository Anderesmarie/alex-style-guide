import { useState } from 'react';
import { TabId } from '@/lib/types';
import Today from '@/pages/Today';
import Dressing from '@/pages/Dressing';
import Outfits from '@/pages/Outfits';
import Analysis from '@/pages/Analysis';
import Profile from '@/pages/Profile';

const tabs: { id: TabId; emoji: string; label: string }[] = [
  { id: 'today', emoji: '🏠', label: "Aujourd'hui" },
  { id: 'dressing', emoji: '👗', label: 'Dressing' },
  { id: 'outfits', emoji: '✨', label: 'Tenues' },
  { id: 'analysis', emoji: '🔍', label: 'Analyse' },
  { id: 'profile', emoji: '👤', label: 'Profil' },
];

interface Props {
  onEditProfile: () => void;
  onLogout: () => void;
}

export default function AppShell({ onEditProfile, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('today');

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 px-5 pt-6 pb-24 no-scrollbar overflow-y-auto">
        {activeTab === 'today' && <Today />}
        {activeTab === 'dressing' && <Dressing />}
        {activeTab === 'outfits' && <Outfits />}
        {activeTab === 'profile' && <Profile onEditProfile={onEditProfile} onLogout={onLogout} />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-md border-t border-border px-2 py-2 z-50">
        <div className="flex justify-around">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
