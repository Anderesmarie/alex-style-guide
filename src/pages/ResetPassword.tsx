import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically handles the token from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
    // Also check if already in recovery state
    setReady(true);
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Merci de remplir tous les champs');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError('Une erreur est survenue, réessaie.');
        return;
      }
      await supabase.auth.signOut();
      navigate('/?resetSuccess=1');
    } catch {
      setError('Une erreur est survenue, réessaie.');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-[430px] min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[430px] min-h-screen bg-background relative">
      <div className="min-h-screen flex flex-col px-6 py-12 fade-enter">
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl font-serif font-bold text-foreground tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>MyStyl</h1>
          <p className="text-primary italic mt-2">Nouveau mot de passe</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-card card-shadow outline-none focus:ring-2 focus:ring-primary/30 text-foreground pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Confirmer le mot de passe</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-card card-shadow outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg active:scale-[0.98] transition-transform text-lg disabled:opacity-60"
          >
            {loading ? '...' : 'Mettre à jour'}
          </button>
        </div>
      </div>
    </div>
  );
}
