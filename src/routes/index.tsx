import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, ShieldCheck, BarChart3, Search, MousePointerClick, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReservCampus — Réservez salles et matériel du campus" },
      { name: "description", content: "Consultez les disponibilités en temps réel et réservez salles et vidéoprojecteurs en quelques clics. Zéro double réservation." },
      { property: "og:title", content: "ReservCampus — Réservez salles et matériel" },
      { property: "og:description", content: "Disponibilités en temps réel, réservation en 3 clics, tableau de bord pour l'administration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: Search, title: "Choisissez", text: "Parcourez les salles et le matériel, filtrez par type ou capacité." },
  { icon: MousePointerClick, title: "Réservez", text: "Sélectionnez date et heure : le système vérifie qu'il n'y a aucun chevauchement." },
  { icon: ListChecks, title: "Gérez", text: "Retrouvez vos réservations et annulez-les en un clic pour libérer le créneau." },
];

const benefits = [
  { icon: CalendarCheck, title: "Temps réel", text: "Voyez immédiatement ce qui est libre, depuis votre téléphone." },
  { icon: ShieldCheck, title: "Zéro conflit", text: "Les doubles réservations sont bloquées par la base de données elle-même." },
  { icon: BarChart3, title: "Pilotage", text: "L'administration voit qui réserve quoi et les ressources les plus demandées." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
          <Logo light />
          <Button asChild variant="heroOutline" size="sm"><Link to="/auth">Se connecter</Link></Button>
        </div>
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="text-accent font-medium mb-4">Fini les cahiers papier et les salles occupées</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">La bonne salle, au bon moment, en 3 clics.</h1>
            <p className="mt-6 text-lg text-primary-foreground/80 max-w-lg">
              ReservCampus permet aux étudiants et enseignants de consulter les disponibilités en temps réel et de réserver salles et matériel sans papier ni appels.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg"><Link to="/auth" search={{ mode: "signup" }}>Créer mon compte</Link></Button>
              <Button asChild variant="heroOutline" size="lg"><Link to="/ressources">Voir les ressources</Link></Button>
            </div>
          </div>
          <div className="rounded-2xl bg-card text-card-foreground p-6 shadow-soft">
            <p className="text-sm text-muted-foreground mb-3">Aujourd'hui · Salle B12</p>
            <div className="grid grid-cols-4 gap-2">
              {["08h", "09h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h"].map((h, i) => (
                <div key={h} className={`rounded-lg py-3 text-center text-sm font-medium ${[2, 3, 6].includes(i) ? "bg-destructive/10 text-destructive line-through" : "bg-success/10 text-success"}`}>{h}</div>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success" /> Libre</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-destructive" /> Réservé</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold text-center">Comment ça marche</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground font-bold">{i + 1}</span>
                <s.icon className="text-primary" />
              </div>
              <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-20 grid gap-8 md:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title}>
              <b.icon className="size-8 text-primary" />
              <h3 className="mt-3 text-xl font-bold">{b.title}</h3>
              <p className="mt-2 text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-muted-foreground flex justify-between">
        <Logo />
        <span>Projet Web — MIAGE 2</span>
      </footer>
    </div>
  );
}
