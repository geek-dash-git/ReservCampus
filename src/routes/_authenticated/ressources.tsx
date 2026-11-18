import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, MapPin, Projector, DoorOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/ressources")({
  head: () => ({ meta: [{ title: "Ressources — ReservCampus" }, { name: "description", content: "Catalogue des salles et du matériel réservables." }] }),
  component: Catalogue,
});

function Catalogue() {
  const [type, setType] = useState<"all" | "salle" | "materiel">("all");
  const [q, setQ] = useState("");
  const [minCap, setMinCap] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase.from("resources").select("*").eq("active", true).order("type").order("name");
      if (error) throw error;
      return data;
    },
  });
  const list = (data ?? []).filter((r) =>
    (type === "all" || r.type === type) &&
    r.name.toLowerCase().includes(q.toLowerCase()) &&
    (!minCap || (r.capacity ?? 0) >= Number(minCap)));

  const tab = (v: typeof type, label: string) => (
    <button onClick={() => setType(v)} className={`px-4 py-2 rounded-full text-sm font-medium border ${type === v ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>{label}</button>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold">Que voulez-vous réserver ?</h1>
      <p className="text-muted-foreground mt-1">Choisissez une ressource pour voir ses disponibilités.</p>
      <div className="mt-6 flex flex-wrap gap-2 items-center">
        {tab("all", "Tout")}{tab("salle", "Salles")}{tab("materiel", "Matériel")}
        <Input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs ml-auto" />
        {type !== "materiel" && <Input type="number" placeholder="Capacité min." value={minCap} onChange={(e) => setMinCap(e.target.value)} className="w-36" />}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        {list.map((r) => (
          <Link key={r.id} to="/ressources/$id" params={{ id: r.id }}
            className="group rounded-2xl border bg-card p-5 transition hover:shadow-soft hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                {r.type === "salle" ? <DoorOpen /> : <Projector />}
              </span>
              <Badge variant="secondary">{r.type === "salle" ? "Salle" : "Matériel"}</Badge>
            </div>
            <h3 className="mt-4 text-lg font-bold group-hover:text-primary">{r.name}</h3>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {r.location && <p className="flex items-center gap-1"><MapPin className="size-3.5" />{r.location}</p>}
              {r.capacity && <p className="flex items-center gap-1"><Users className="size-3.5" />{r.capacity} places</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {r.equipments.map((e) => <span key={e} className="text-xs rounded-md bg-muted px-2 py-0.5">{e}</span>)}
            </div>
          </Link>
        ))}
        {!isLoading && list.length === 0 && <p className="text-muted-foreground">Aucune ressource ne correspond.</p>}
      </div>
    </div>
  );
}
