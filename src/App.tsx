import { useState, useEffect } from 'react';
import { getProfile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import Onboarding from '@/components/Onboarding';
import AppShell from '@/components/AppShell';
import Login from '@/pages/Login';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profile = await getProfile();
        if (profile) {
          setHasProfile(true);
        } else {
          setShowOnboarding(true);
        }
      } catch {
        setShowOnboarding(true);
      }
      setCheckingProfile(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const logged = !!session;
      setIsLoggedIn(logged);
      if (logged) {
        checkProfile();
      } else {
        setCheckingProfile(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const logged = !!session;
      setIsLoggedIn(logged);
      if (logged) {
        checkProfile();
      } else {
        setCheckingProfile(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggedIn(true);
    const profile = await getProfile();
    if (!profile) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setHasProfile(true);
    setShowOnboarding(false);
  };

  const handleEditProfile = () => {
    setShowOnboarding(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setShowOnboarding(false);
  };

  if (isLoggedIn === null || (isLoggedIn && checkingProfile)) {
    return (
      <div className="mx-auto max-w-[430px] min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-[430px] min-h-screen bg-background relative">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[430px] min-h-screen bg-background relative">
      {showOnboarding ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <AppShell onEditProfile={handleEditProfile} onLogout={handleLogout} />
      )}
    </div>
  );
}
