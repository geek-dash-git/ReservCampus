import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/console-connexion")({
  head: () => ({
    meta: [
      { title: "Console gestionnaire — ReservCampus" },
      { name: "description", content: "Accès réservé aux gestionnaires du campus." },
      { property: "og:title", content: "Console gestionnaire — ReservCampus" },
      { property: "og:description", content: "Accès réservé aux gestionnaires du campus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

const MAX_TRIES = 5;
const LOCK_MS = 5 * 60 * 1000;

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < lockedUntil) { setError("Trop de tentatives. Réessayez dans quelques minutes."); return; }
    setBusy(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    let ok = false;
    if (!err && data.user) {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      ok = !!isAdmin;
      if (!ok) await supabase.auth.signOut();
    }
    setBusy(false);
    if (!ok) {
      // Message volontairement générique : ne révèle pas si le compte existe ni s'il est gestionnaire
      const n = tries + 1;
      setTries(n);
      if (n >= MAX_TRIES) { setLockedUntil(Date.now() + LOCK_MS); setTries(0); }
      setPassword("");
      setError("Identifiants invalides ou accès non autorisé.");
      return;
    }
    navigate({ to: "/console", replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-foreground p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-card p-8 space-y-4 shadow-soft">
        <ShieldCheck className="size-10 text-primary" />
        <h1 className="text-2xl font-bold">Console gestionnaire</h1>
        <p className="text-sm text-muted-foreground">Accès strictement réservé. Toutes les actions sont journalisées.</p>
        <div className="space-y-2"><Label htmlFor="em">Email</Label>
          <Input id="em" type="email" autoComplete="username" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="pw">Mot de passe</Label>
          <Input id="pw" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Vérification…" : "Se connecter"}</Button>
        <Link to="/mot-de-passe-oublie" className="block text-sm text-primary underline-offset-4 hover:underline">Mot de passe oublié ?</Link>
      </form>
    </div>
  );
}
