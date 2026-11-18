import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — ReservCampus" },
      { name: "description", content: "Recevez un lien sécurisé pour réinitialiser votre mot de passe." },
      { property: "og:title", content: "Mot de passe oublié — ReservCampus" },
      { property: "og:description", content: "Recevez un lien sécurisé pour réinitialiser votre mot de passe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reinitialiser-mot-de-passe",
    });
    setBusy(false);
    // Message identique que le compte existe ou non : ne révèle pas quels emails sont inscrits
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-soft">
        <Logo />
        {sent ? (
          <div className="mt-6 space-y-3">
            <MailCheck className="size-10 text-primary" />
            <h1 className="text-2xl font-bold">Email envoyé</h1>
            <p className="text-sm text-muted-foreground">
              Si un compte existe pour <b>{email}</b>, un lien de réinitialisation vient d'être envoyé.
              Il est valable une heure et ne fonctionne qu'une fois. Pensez à vérifier vos spams.
            </p>
            <Link to="/auth"><Button variant="outline" className="w-full">Retour à la connexion</Button></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <h1 className="text-2xl font-bold">Mot de passe oublié ?</h1>
            <p className="text-sm text-muted-foreground">
              Entrez votre email : vous recevrez un lien sécurisé pour choisir un nouveau mot de passe.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Envoi…" : "Envoyer le lien"}</Button>
            <Link to="/auth" className="block text-sm text-primary underline-offset-4 hover:underline">Retour à la connexion</Link>
          </form>
        )}
      </div>
    </div>
  );
}
