import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [socialMsg, setSocialMsg] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Merci de remplir tous les champs');
      return;
    }
    if (!email.includes('@')) {
      setError("Merci d'entrer un email valide");
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Cet email est déjà utilisé');
          } else {
            setError(signUpError.message);
          }
          return;
        }
        setSuccessMsg('Compte créé ! Vérifie ton email pour confirmer ton inscription.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.includes('Invalid login')) {
            setError('Email ou mot de passe incorrect');
          } else {
            setError(signInError.message);
          }
          return;
        }
        onLogin();
      }
    } catch {
      setError('Une erreur est survenue, réessaie plus tard');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = () => {
    setSocialMsg('Bientôt disponible ✨');
    setTimeout(() => setSocialMsg(''), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background px-6 py-12 fade-enter">
      {/* Logo */}
      <div className="text-center mb-12 mt-8">
        <h1 className="text-5xl font-serif font-bold text-foreground tracking-tight">Closify</h1>
        <p className="text-primary italic mt-2">Ton dressing intelligent</p>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); setSuccessMsg(''); }}
            placeholder="ton@email.com"
            className="w-full px-4 py-3 rounded-xl bg-card card-shadow outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Mot de passe</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); setSuccessMsg(''); }}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-card card-shadow outline-none focus:ring-2 focus:ring-primary/30 text-foreground pr-12"
              onKeyDown={e => e.key === 'Enter' && !isSignUp && handleSubmit()}
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

        {isSignUp && (
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
        )}

        {!isSignUp && (
          <div className="text-right">
            <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        {successMsg && <p className="text-sm text-primary font-medium">{successMsg}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg active:scale-[0.98] transition-transform text-lg disabled:opacity-60"
        >
          {loading ? '...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
        </button>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Social */}
      <div className="space-y-3 mb-6">
        <button
          onClick={handleSocial}
          className="w-full py-3 rounded-xl bg-card card-shadow font-medium flex items-center justify-center gap-3 active:scale-[0.98] transition-transform border border-border"
        >
          <span className="text-lg">G</span>
          <span className="text-foreground">Continuer avec Google</span>
        </button>
        <button
          onClick={handleSocial}
          className="w-full py-3 rounded-xl bg-foreground text-card font-medium flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
        >
          <span className="text-lg"></span>
          <span>Continuer avec Apple</span>
        </button>
      </div>

      {socialMsg && (
        <p className="text-center text-primary text-sm font-medium animate-pulse">{socialMsg}</p>
      )}

      {/* Toggle sign up / sign in */}
      <p className="text-center text-sm text-muted-foreground mt-auto">
        {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); setConfirmPassword(''); }}
          className="text-primary font-semibold"
        >
          {isSignUp ? 'Se connecter' : 'Créer un compte'}
        </button>
      </p>
    </div>
  );
}
