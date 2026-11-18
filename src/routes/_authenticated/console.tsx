import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Trash2, Plus, Sparkles, Ban, Undo2, Check, X, LogOut, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { summarizeReservations } from "@/lib/summaries.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/console")({
  head: () => ({ meta: [{ title: "Console gestionnaire — ReservCampus" }, { name: "description", content: "Portail sécurisé de gestion des réservations." }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const { data: resources = [] } = useQuery({
    queryKey: ["admin-resources"], enabled: isAdmin,
    queryFn: async () => (await supabase.from("resources").select("*").order("name")).data ?? [],
  });
  const { data: reservations = [] } = useQuery({
    queryKey: ["admin-reservations"], enabled: isAdmin,
    queryFn: async () => (await supabase.from("reservations")
      .select("*, resources(name), profiles(full_name, email)").order("starts_at", { ascending: false }).limit(500)).data ?? [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"], enabled: isAdmin,
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at")).data ?? [],
  });
  const { data: adminIds = [] } = useQuery({
    queryKey: ["admin-roles"], enabled: isAdmin,
    queryFn: async () => ((await supabase.from("user_roles").select("user_id").eq("role", "admin")).data ?? []).map((r) => r.user_id),
  });
  const { user: me } = useAuth();
  const setAdmin = async (uid: string, grant: boolean, email: string) => {
    if (!confirm(grant ? `Nommer ${email} gestionnaire ? Il aura accès à toute la console.` : `Retirer le rôle gestionnaire à ${email} ?`)) return;
    const { error } = await supabase.rpc("set_admin_role", { _target: uid, _grant: grant });
    if (error) { toast.error(error.message); return; }
    toast.success(grant ? "Gestionnaire nommé" : "Rôle retiré");
    qc.invalidateQueries();
  };
  const setBan = async (uid: string, banned: boolean) => {
    if (banned && !confirm("Bannir cet utilisateur ? Ses réservations à venir seront annulées.")) return;
    const { error } = await supabase.from("profiles").update({ banned }).eq("id", uid);
    if (error) { toast.error(error.message); return; }
    if (banned) await supabase.from("reservations").update({ status: "annulee" })
      .eq("user_id", uid).eq("status", "confirmee").gt("ends_at", new Date().toISOString());
    toast.success(banned ? "Utilisateur banni" : "Utilisateur réactivé");
    qc.invalidateQueries();
  };

  const navigate = useNavigate();
  const logout = async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/console-connexion", replace: true }); };
  // Déconnexion automatique après 15 min d'inactivité
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const reset = () => { clearTimeout(t); t = setTimeout(() => { toast.info("Session expirée par inactivité"); logout(); }, 15 * 60 * 1000); };
    const evts = ["mousemove", "keydown", "click", "scroll"] as const;
    evts.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(t); evts.forEach((e) => window.removeEventListener(e, reset)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { data: audit = [] } = useQuery({
    queryKey: ["admin-audit"], enabled: isAdmin,
    queryFn: async () => (await supabase.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(200)).data ?? [],
  });
  const decide = async (id: string, status: "confirmee" | "refusee") => {
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "confirmee" ? "Réservation validée" : "Réservation refusée");
    qc.invalidateQueries();
  };

  const summarize = useServerFn(summarizeReservations);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizing, setSummarizing] = useState(false);
  const runSummaries = async () => {
    setSummarizing(true);
    try {
      const res = await summarize({ data: { ids: reservations.slice(0, 50).map((r) => r.id) } });
      if (res.error) toast.error(res.error);
      else { setSummaries(res.summaries); toast.success("Résumés générés"); }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erreur"); }
    finally { setSummarizing(false); }
  };

  if (loading) return <p className="text-muted-foreground">Chargement…</p>;
  if (!isAdmin) return <p className="p-8">Accès refusé.</p>;

  const now = new Date();
  const confirmed = reservations.filter((r) => r.status === "confirmee");
  const pending = reservations.filter((r) => r.status === "en_attente" && new Date(r.ends_at) > now);
  const upcoming = confirmed.filter((r) => new Date(r.ends_at) > now);
  const today = confirmed.filter((r) => new Date(r.starts_at).toDateString() === now.toDateString());
  const counts = new Map<string, number>();
  confirmed.forEach((r) => counts.set(r.resources?.name ?? "?", (counts.get(r.resources?.name ?? "?") ?? 0) + 1));
  const top = [...counts.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 6);
  const cancelRate = reservations.length ? Math.round((reservations.filter((r) => r.status === "annulee").length / reservations.length) * 100) : 0;

  const refresh = () => qc.invalidateQueries();
  const cancel = async (id: string) => {
    const { error } = await supabase.from("reservations").update({ status: "annulee" }).eq("id", id);
    error ? toast.error(error.message) : (toast.success("Réservation annulée"), refresh());
  };
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("resources").update({ active }).eq("id", id); refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer cette ressource et ses réservations ?")) return;
    const { error } = await supabase.from("resources").delete().eq("id", id);
    error ? toast.error(error.message) : (toast.success("Ressource supprimée"), refresh());
  };

  const stats = [
    { label: "À valider", value: pending.length },
    { label: "Ressources", value: resources.length },
    { label: "Réservations à venir", value: upcoming.length },
    { label: "Aujourd'hui", value: today.length },
    { label: "Taux d'annulation", value: `${cancelRate}%` },
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <p className="flex items-center gap-2 font-display font-bold"><ShieldCheck className="size-5" /> Console gestionnaire · ReservCampus</p>
          <Button variant="ghost" size="sm" className="text-background hover:text-foreground" onClick={logout}><LogOut className="size-4" />Déconnexion</Button>
        </div>
      </header>
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">Tableau de bord</h1>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-3xl font-display font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold mb-4">Ressources les plus demandées</h2>
        {top.length === 0 ? <p className="text-muted-foreground text-sm">Pas encore de données.</p> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" name="Réservations" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <Tabs defaultValue="validation">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="validation">À valider ({pending.length})</TabsTrigger>
          <TabsTrigger value="reservations">Réservations</TabsTrigger>
          <TabsTrigger value="resources">Ressources</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="audit">Journal</TabsTrigger>
        </TabsList>
        <TabsContent value="validation" className="rounded-2xl border bg-card mt-4 overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Qui</TableHead><TableHead>Quoi</TableHead><TableHead>Filière / TD</TableHead><TableHead>Quand</TableHead><TableHead>Motif</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {pending.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><p className="font-medium">{r.profiles?.full_name}</p><p className="text-xs text-muted-foreground">{r.profiles?.email}</p></TableCell>
                  <TableCell>{r.resources?.name}</TableCell>
                  <TableCell className="text-sm">{r.filiere ?? "—"} · TD {r.td_group}</TableCell>
                  <TableCell className="capitalize">{format(new Date(r.starts_at), "EEE d MMM · HH'h'", { locale: fr })}–{format(new Date(r.ends_at), "HH'h'")}</TableCell>
                  <TableCell className="max-w-xs text-sm">{r.purpose || "—"}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="sm" onClick={() => decide(r.id, "confirmee")}><Check className="size-4" />Valider</Button>
                    <Button size="sm" variant="outline" onClick={() => decide(r.id, "refusee")}><X className="size-4" />Refuser</Button>
                  </TableCell>
                </TableRow>
              ))}
              {pending.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Aucune demande en attente</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="reservations" className="rounded-2xl border bg-card mt-4 overflow-x-auto">
          <div className="flex items-center justify-between gap-2 p-3 border-b">
            <p className="text-sm text-muted-foreground">Résumé IA : ressource, créneau et motif de chaque réservation (50 plus récentes).</p>
            <Button size="sm" onClick={runSummaries} disabled={summarizing || reservations.length === 0}>
              <Sparkles className="h-4 w-4" />{summarizing ? "Génération…" : "Résumer avec l'IA"}
            </Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Qui</TableHead><TableHead>Quoi</TableHead><TableHead>Filière / TD</TableHead><TableHead>Quand</TableHead><TableHead>Résumé</TableHead><TableHead>Rôle</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><p className="font-medium">{r.profiles?.full_name}</p><p className="text-xs text-muted-foreground">{r.profiles?.email}</p></TableCell>
                  <TableCell>{r.resources?.name}</TableCell>
                  <TableCell className="text-sm">{r.filiere ?? "—"} · TD {r.td_group}</TableCell>
                  <TableCell className="capitalize">{format(new Date(r.starts_at), "EEE d MMM · HH'h'", { locale: fr })}–{format(new Date(r.ends_at), "HH'h'")}</TableCell>
                  <TableCell className="max-w-xs text-sm">{summaries[r.id] ?? <span className="text-muted-foreground">{r.purpose || "—"}</span>}</TableCell>
                  <TableCell><Badge variant={r.status === "annulee" || r.status === "refusee" ? "destructive" : "secondary"}>{({ en_attente: "En attente", confirmee: "Validée", refusee: "Refusée", annulee: "Annulée" } as Record<string, string>)[r.status]}</Badge></TableCell>
                  <TableCell>{(r.status === "confirmee" || r.status === "en_attente") && new Date(r.ends_at) > now && <Button size="sm" variant="ghost" onClick={() => cancel(r.id)}>Annuler</Button>}</TableCell>
                </TableRow>
              ))}
              {reservations.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Aucune réservation</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="resources" className="mt-4 space-y-4">
          <NewResource onDone={refresh} />
          <div className="rounded-2xl border bg-card overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Type</TableHead><TableHead>Capacité</TableHead><TableHead>Lieu</TableHead><TableHead>Active</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {resources.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.type === "salle" ? "Salle" : "Matériel"}</TableCell>
                    <TableCell>{r.capacity ?? "—"}</TableCell>
                    <TableCell>{r.location}</TableCell>
                    <TableCell><Switch checked={r.active} onCheckedChange={(v) => toggle(r.id, v)} /></TableCell>
                    <TableCell><Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => remove(r.id)}><Trash2 /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="audit" className="mt-4 rounded-2xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Action</TableHead><TableHead>Détails</TableHead></TableRow></TableHeader>
            <TableBody>
              {audit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{format(new Date(a.created_at), "d MMM yyyy · HH:mm", { locale: fr })}</TableCell>
                  <TableCell className="text-sm font-medium">{a.action.replaceAll("_", " ")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.details ? JSON.stringify(a.details) : "—"}</TableCell>
                </TableRow>
              ))}
              {audit.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Aucune action enregistrée</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="users" className="mt-4 rounded-2xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Statut</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{adminIds.includes(u.id) ? <Badge>Gestionnaire</Badge> : <Badge variant="outline">Étudiant</Badge>}</TableCell>
                  <TableCell><Badge variant={u.banned ? "destructive" : "secondary"}>{u.banned ? "Banni" : "Actif"}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap">{u.id !== me?.id && (adminIds.includes(u.id)
                    ? <Button size="sm" variant="ghost" onClick={() => setAdmin(u.id, false, u.email ?? "")}><X className="h-4 w-4" />Retirer gestionnaire</Button>
                    : !u.banned && <Button size="sm" variant="ghost" onClick={() => setAdmin(u.id, true, u.email ?? "")}><ShieldCheck className="h-4 w-4" />Nommer gestionnaire</Button>)}
                    {u.banned
                    ? <Button size="sm" variant="ghost" onClick={() => setBan(u.id, false)}><Undo2 className="h-4 w-4" />Réactiver</Button>
                    : <Button size="sm" variant="ghost" onClick={() => setBan(u.id, true)}><Ban className="h-4 w-4" />Bannir</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}

function NewResource({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", type: "salle" as "salle" | "materiel", capacity: "", location: "", equipments: "", description: "" });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("resources").insert({
      name: f.name, type: f.type, capacity: f.capacity ? Number(f.capacity) : null, location: f.location || null,
      equipments: f.equipments.split(",").map((s) => s.trim()).filter(Boolean), description: f.description || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Ressource ajoutée");
    setOpen(false); setF({ ...f, name: "", capacity: "", location: "", equipments: "", description: "" }); onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus /> Ajouter une ressource</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nouvelle ressource</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <div className="space-y-1"><Label>Nom</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1"><Label>Type</Label>
            <div className="flex gap-2">
              {(["salle", "materiel"] as const).map((t) => (
                <button type="button" key={t} onClick={() => setF({ ...f, type: t })}
                  className={`flex-1 rounded-md border py-2 text-sm ${f.type === t ? "bg-primary text-primary-foreground border-primary" : ""}`}>{t === "salle" ? "Salle" : "Matériel"}</button>
              ))}
            </div>
          </div>
          {f.type === "salle" && <div className="space-y-1"><Label>Capacité</Label><Input type="number" min={1} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></div>}
          <div className="space-y-1"><Label>Lieu</Label><Input value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
          <div className="space-y-1"><Label>Équipements (séparés par des virgules)</Label><Input value={f.equipments} onChange={(e) => setF({ ...f, equipments: e.target.value })} /></div>
          <div className="space-y-1"><Label>Description</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <Button type="submit" className="w-full">Enregistrer</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
