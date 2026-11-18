import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/mes-reservations")({
  head: () => ({ meta: [{ title: "Mes réservations — ReservCampus" }, { name: "description", content: "Consultez et annulez vos réservations." }] }),
  component: MyReservations,
});

function MyReservations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["mine", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("reservations").select("*, resources(name, location)")
        .eq("user_id", user!.id).order("starts_at", { ascending: false });
      return data ?? [];
    },
  });
  const now = new Date();
  const isActive = (r: (typeof data)[number]) => (r.status === "confirmee" || r.status === "en_attente") && new Date(r.ends_at) > now;
  const upcoming = data.filter(isActive).reverse();
  const history = data.filter((r) => !isActive(r));

  const cancel = async (id: string) => {
    if (!confirm("Annuler cette réservation ? Le créneau sera libéré pour les autres.")) return;
    const { error } = await supabase.from("reservations").update({ status: "annulee" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Réservation annulée");
    qc.invalidateQueries();
  };

  const Row = ({ r, canCancel }: { r: (typeof data)[number]; canCancel?: boolean }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
      <div>
        <p className="font-bold">{r.resources?.name}</p>
        <p className="text-sm text-muted-foreground capitalize">
          {format(new Date(r.starts_at), "EEEE d MMMM yyyy · HH'h'", { locale: fr })} – {format(new Date(r.ends_at), "HH'h'")}
          {r.resources?.location && ` · ${r.resources.location}`}
        </p>
        {r.purpose && <p className="text-sm mt-1">{r.purpose}</p>}
      </div>
      {canCancel ? <div className="flex items-center gap-2"><Badge variant="secondary">{r.status === "en_attente" ? "En attente de validation" : "Validée"}</Badge><Button variant="outline" size="sm" onClick={() => cancel(r.id)}>Annuler</Button></div>
        : <Badge variant={r.status === "annulee" || r.status === "refusee" ? "destructive" : "secondary"}>{r.status === "annulee" ? "Annulée" : r.status === "refusee" ? "Refusée" : "Terminée"}</Badge>}
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mes réservations</h1>
        <p className="text-muted-foreground mt-1">{upcoming.length}/3 réservations actives</p>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">À venir</h2>
        {isLoading ? <p className="text-muted-foreground">Chargement…</p> : upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <CalendarX className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Aucune réservation à venir.</p>
            <Button asChild className="mt-4"><Link to="/ressources">Réserver une ressource</Link></Button>
          </div>
        ) : upcoming.map((r) => <Row key={r.id} r={r} canCancel />)}
      </section>
      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold">Historique</h2>
          {history.map((r) => <Row key={r.id} r={r} />)}
        </section>
      )}
    </div>
  );
}
