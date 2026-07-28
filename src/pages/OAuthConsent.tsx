import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Login from '@/pages/Login';

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError('Paramètre authorization_id manquant');
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        setNeedsLogin(true);
        return;
      }
      setNeedsLogin(false);
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, reload]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Aucune redirection renvoyée par le serveur d'autorisation.");
      return;
    }
    window.location.href = target;
  };

  if (needsLogin) {
    return (
      <div className="mx-auto max-w-[430px] min-h-screen bg-background relative">
        <Login
          onLogin={() => setReload((n) => n + 1)}
          successMessage="Connecte-toi pour autoriser l'application ✨"
        />
      </div>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-[430px] min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-destructive text-center text-sm">
          Impossible de charger cette demande d'autorisation : {error}
        </p>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="mx-auto max-w-[430px] min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </main>
    );
  }

  const clientName = details.client?.name ?? 'Une application';

  return (
    <main className="mx-auto max-w-[430px] min-h-screen bg-background flex flex-col justify-center px-6 py-12">
      <h1
        className="text-3xl font-serif font-bold text-foreground text-center"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        MyStyl
      </h1>
      <div className="mt-8 bg-card rounded-2xl p-6 card-shadow space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Connecter {clientName} à ton compte
        </h2>
        <p className="text-sm text-muted-foreground">
          {clientName} pourra accéder à ton dressing, tes tenues et ton profil style,
          et ajouter des pièces à ton dressing en ton nom.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-medium active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            Refuser
          </button>
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            Autoriser
          </button>
        </div>
      </div>
    </main>
  );
}
