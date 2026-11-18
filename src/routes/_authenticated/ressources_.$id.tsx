import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, MapPin, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyError, useAuth } from "@/lib/auth";
import { atHour, CLOSE_HOUR, freeSlots, isSlotFree, MAX_DURATION_HOURS, OPEN_HOUR, validateRequest, type Interval } from "@/lib/slots";

export const Route = createFileRoute("/_authenticated/ressources_/$id")({
  head: () => ({ meta: [{ title: "Réserver — ReservCampus" }, { name: "description", content: "Disponibilités et réservation d'une ressource." }] }),
  component: ResourcePage,
});

const todayStr = () => format(new Date(), "yyyy-MM-dd");

function ResourcePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayStr());
  const [start, setStart] = useState<number | null>(null);
  const [duration, setDuration] = useState(1);
  const [purpose, setPurpose] = useState("");
  const [filiere, setFiliere] = useState("");
  const [tdGroup, setTdGroup] = useState(1);
  const [conflict, setConflict] = useState<{ slots: Interval[]; others: { id: string; name: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const day = useMemo(() => new Date(date + "T00:00:00"), [date]);

  const { data: resource } = useQuery({
    queryKey: ["resource", id],
    queryFn: async () => (await supabase.from("resources").select("*").eq("id", id).single()).data,
  });

  const { data: busyList = [] } = useQuery({
    queryKey: ["busy", id, date],
    queryFn: async () => {
      const { data } = await supabase.rpc("busy_slots", { _resource: id, _from: day.toISOString(), _to: atHour(day, 24).toISOString() });
      return (data ?? []).map((r) => ({ start: new Date(r.starts_at), end: new Date(r.ends_at) }));
    },
    refetchInterval: 15000, // quasi temps réel
  });

  const hours = Array.from({ length: CLOSE_HOUR - OPEN_HOUR }, (_, i) => OPEN_HOUR + i);
  const now = new Date();

  const findAlternatives = async (slot: Interval) => {
    const slots = freeSlots(day, duration, busyList, now).slice(0, 6);
    let others: { id: string; name: string }[] = [];
    if (resource) {
      const { data: same } = await supabase.from("resources").select("id,name").eq("type", resource.type).eq("active", true).neq("id", id);
      const { data: taken } = await supabase.rpc("busy_resources", { _from: slot.start.toISOString(), _to: slot.end.toISOString() });
      const takenIds = new Set((taken ?? []).map((t) => t.resource_id));
      others = (same ?? []).filter((r) => !takenIds.has(r.id)).slice(0, 4);
    }
    setConflict({ slots, others });
  };

  const book = async () => {
    if (start === null || !user) return;
    if (!filiere.trim()) return toast.error("Précisez votre filière avant de réserver.");
    const slot = { start: atHour(day, start), end: atHour(day, start + duration) };
    const { count } = await supabase.from("reservations").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).in("status", ["confirmee", "en_attente"]).gt("ends_at", new Date().toISOString());
    const err = validateRequest(slot, count ?? 0);
    if (err) return toast.error(err);
    if (!isSlotFree(slot, busyList)) {
      toast.error("Ce créneau chevauche une réservation existante.");
      return findAlternatives(slot);
    }
    setBusy(true);
    const { error } = await supabase.from("reservations").insert({
      resource_id: id, user_id: user.id, starts_at: slot.start.toISOString(), ends_at: slot.end.toISOString(), purpose: purpose || null,
      filiere: filiere.trim(), td_group: tdGroup,
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error.message));
      qc.invalidateQueries({ queryKey: ["busy", id, date] });
      if (error.message.includes("no_overlap") || error.code === "23P01") findAlternatives(slot);
      return;
    }
    toast.success(`Demande envoyée, en attente de validation : ${resource?.name}, ${format(slot.start, "EEEE d MMMM 'de' HH'h'", { locale: fr })} à ${format(slot.end, "HH'h'")}`);
    qc.invalidateQueries();
    navigate({ to: "/mes-reservations" });
  };

  if (!resource) return <p className="text-muted-foreground">Chargement…</p>;

  return (
    <div>
      <Link to="/ressources" className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"><ArrowLeft className="size-4" /> Toutes les ressources</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <h1 className="text-3xl font-bold">{resource.name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {resource.location && <span className="flex items-center gap-1"><MapPin className="size-4" />{resource.location}</span>}
            {resource.capacity && <span className="flex items-center gap-1"><Users className="size-4" />{resource.capacity} places</span>}
          </div>
          {resource.description && <p className="mt-3">{resource.description}</p>}

          <div className="mt-6 flex items-end gap-3">
            <div className="space-y-1"><Label htmlFor="d">Date</Label>
              <Input id="d" type="date" min={todayStr()} value={date} onChange={(e) => { setDate(e.target.value); setStart(null); setConflict(null); }} /></div>
            <p className="text-sm text-muted-foreground pb-2 capitalize">{format(day, "EEEE d MMMM", { locale: fr })}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {hours.map((h) => {
              const cell = { start: atHour(day, h), end: atHour(day, h + 1) };
              const taken = !isSlotFree(cell, busyList);
              const past = cell.end <= now;
              const selected = start !== null && h >= start && h < start + duration;
              const cls = selected ? "bg-primary text-primary-foreground border-primary"
                : taken ? "bg-destructive/10 text-destructive border-destructive/20 line-through"
                : past ? "bg-muted text-muted-foreground opacity-60"
                : "bg-success/10 text-success border-success/20 hover:bg-success/20";
              return (
                <button key={h} disabled={past} onClick={() => { setStart(h); setConflict(null); }}
                  className={`rounded-lg border py-3 text-sm font-medium transition ${cls}`}>
                  {String(h).padStart(2, "0")}h – {String(h + 1).padStart(2, "0")}h
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success" /> Libre</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-destructive" /> Réservé</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> Votre sélection</span>
          </div>
        </div>

        <aside className="rounded-2xl border bg-card p-5 h-fit lg:sticky lg:top-6 space-y-4">
          <h2 className="text-lg font-bold">Votre réservation</h2>
          <div className="space-y-1">
            <Label>Durée</Label>
            <div className="flex gap-2">
              {Array.from({ length: MAX_DURATION_HOURS }, (_, i) => i + 1).map((d) => (
                <button key={d} onClick={() => { setDuration(d); setConflict(null); }}
                  className={`flex-1 rounded-md border py-2 text-sm ${duration === d ? "bg-primary text-primary-foreground border-primary" : ""}`}>{d}h</button>
              ))}
            </div>
          </div>
          <div className="space-y-1"><Label htmlFor="fil">Filière *</Label>
            <Input id="fil" placeholder="Ex. : MIAGE L3" value={filiere} onChange={(e) => setFiliere(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="td">Groupe de TD</Label>
            <select id="td" value={tdGroup} onChange={(e) => setTdGroup(Number(e.target.value))}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>TD {g}</option>)}
            </select></div>
          <div className="space-y-1"><Label htmlFor="p">Motif (optionnel)</Label>
            <Input id="p" placeholder="Ex. : révision examen, soutenance…" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div>
          <p className="text-sm">
            {start === null ? <span className="text-muted-foreground">Cliquez sur une heure de début.</span>
              : <>De <b>{start}h</b> à <b>{start + duration}h</b></>}
          </p>
          <Button className="w-full" disabled={start === null || busy || !filiere.trim()} onClick={book}>{busy ? "Réservation…" : "Réserver"}</Button>
          <p className="text-xs text-muted-foreground">Règles : 4h maximum par réservation, 3 réservations actives par personne.</p>

          {conflict && (
            <div className="rounded-xl border border-accent bg-accent/10 p-4 space-y-3">
              <p className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4" /> Créneau indisponible</p>
              {conflict.slots.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Créneaux libres ce jour ({duration}h) :</p>
                  <div className="flex flex-wrap gap-2">
                    {conflict.slots.map((s) => (
                      <button key={s.start.toISOString()} onClick={() => { setStart(s.start.getHours()); setConflict(null); }}
                        className="rounded-md border bg-card px-2 py-1 text-sm hover:border-primary">{s.start.getHours()}h–{s.end.getHours()}h</button>
                    ))}
                  </div>
                </div>
              )}
              {conflict.others.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Autres ressources libres à cet horaire :</p>
                  <ul className="space-y-1">
                    {conflict.others.map((o) => (
                      <li key={o.id}><Link to="/ressources/$id" params={{ id: o.id }} className="text-sm text-primary hover:underline">{o.name}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
