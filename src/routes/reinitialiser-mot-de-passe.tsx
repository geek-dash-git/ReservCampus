import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { passwordError } from "@/lib/password";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — ReservCampus" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte ReservCampus." },
      { property: "og:title", content: "Nouveau mot de passe — ReservCampus" },
      { property: "og:description", content: "Choisissez un nouveau mot de passe pour votre compte ReservCampus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Le lien email ouvre cette page avec une session de récupération (type=recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Si la session de récupération est déjà active (rechargement de la page)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const timer = setTimeout(() => setInvalid(true), 8000);
    return () => { subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Les deux mots de passe ne correspondent pas."); return; }
    const err = passwordError(password);
    if (err) { toast.error(err); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error("Lien expiré ou mot de passe refusé. Recommencez la procédure."); return; }
    toast.success("Mot de passe mis à jour. Vous êtes connecté.");
    navigate({ to: "/ressources" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-soft">
        <Logo />
        {invalid && !ready ? (
          <div className="mt-6 space-y-3">
            <h1 className="text-2xl font-bold">Lien invalide ou expiré</h1>
            <p className="text-sm text-muted-foreground">
              Ce lien de réinitialisation n'est plus valable. Demandez-en un nouveau.
            </p>
            <Link to="/mot-de-passe-oublie"><Button className="w-full">Renvoyer un lien</Button></Link>
          </div>
        ) : !ready ? (
          <p className="mt-6 text-sm text-muted-foreground">Vérification du lien…</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <KeyRound className="size-10 text-primary" />
            <h1 className="text-2xl font-bold">Nouveau mot de passe</h1>
            <div className="space-y-2">
              <Label htmlFor="pw">Nouveau mot de passe</Label>
              <Input id="pw" type="password" minLength={10} maxLength={128} autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pw2">Confirmer le mot de passe</Label>
              <Input id="pw2" type="password" minLength={10} maxLength={128} autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">10 caractères minimum, avec majuscule, minuscule, chiffre et symbole. Les mots de passe ayant fuité sur Internet sont refusés.</p>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
