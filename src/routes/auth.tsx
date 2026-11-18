import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { passwordError } from "@/lib/password";

type Search = { mode?: "signin" | "signup" | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({ mode: s["mode"] === "signup" ? "signup" : undefined }),
  head: () => ({
    meta: [
      { title: "Connexion — ReservCampus" },
      { name: "description", content: "Connectez-vous ou créez votre compte ReservCampus." },
      { property: "og:title", content: "Connexion — ReservCampus" },
      { property: "og:description", content: "Accédez à vos réservations de salles et de matériel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const [signup, setSignup] = useState(mode === "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signup) {
      const err = passwordError(password);
      if (err) { toast.error(err); return; }
    }
    setBusy(true);
    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin + "/ressources", data: { full_name: name } },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (data.session) navigate({ to: "/ressources" });
      else setSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error("Email ou mot de passe incorrect."); return; }
      navigate({ to: "/ressources" });
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-hero p-10 flex-col justify-between">
        <Link to="/"><Logo light /></Link>
        <p className="text-3xl font-display font-bold text-primary-foreground max-w-sm">Plus de déplacements inutiles pour vérifier si une salle est libre.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden"><Logo /></Link>
          {sent ? (
            <div className="mt-8 space-y-3">
              <h1 className="text-2xl font-bold">Vérifiez vos emails</h1>
              <p className="text-muted-foreground">Un lien de confirmation a été envoyé à <b>{email}</b>. Cliquez dessus pour activer votre compte.</p>
              <Button variant="outline" onClick={() => { setSent(false); setSignup(false); }}>Retour à la connexion</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4">
              <h1 className="text-2xl font-bold">{signup ? "Créer un compte" : "Bon retour !"}</h1>
              <p className="text-muted-foreground text-sm">{signup ? "Étudiant ou enseignant, réservez en quelques secondes." : "Connectez-vous pour réserver."}</p>
              {signup && (
                <div className="space-y-2"><Label htmlFor="name">Nom complet</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
              )}
              <div className="space-y-2"><Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="pw">Mot de passe</Label>
                <Input id="pw" type="password" minLength={signup ? 10 : 1} maxLength={128} autoComplete={signup ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              {signup && <p className="text-xs text-muted-foreground">10 caractères minimum, avec majuscule, minuscule, chiffre et symbole. Les mots de passe ayant fuité sur Internet sont refusés.</p>}
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "..." : signup ? "Créer mon compte" : "Se connecter"}</Button>
              {!signup && (
                <Link to="/mot-de-passe-oublie" className="block text-sm text-primary underline-offset-4 hover:underline">Mot de passe oublié ?</Link>
              )}
              <button type="button" className="text-sm text-primary underline-offset-4 hover:underline" onClick={() => setSignup(!signup)}>
                {signup ? "J'ai déjà un compte" : "Pas encore de compte ? Inscrivez-vous"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
