import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    const isConsole = location.pathname.startsWith("/console");
    if (!data.user) throw redirect({ to: isConsole ? "/console-connexion" : "/auth" });
    if (isConsole) {
      // Portail gestionnaire : le rôle est revérifié en base (has_role), jamais côté navigateur seul
      const { data: ok } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
      if (!ok) { await supabase.auth.signOut(); throw redirect({ to: "/console-connexion" }); }
    }
  },
  component: Layout,
});

function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (pathname.startsWith("/console")) return <Outlet />;
  const linkCls = "px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground";
  const active = { className: "px-3 py-2 rounded-md text-sm font-medium bg-secondary text-foreground" };
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-2 justify-between">
          <Link to="/ressources"><Logo /></Link>
          <nav className="flex flex-wrap items-center gap-1">
            <Link to="/ressources" className={linkCls} activeProps={active}>Ressources</Link>
            <Link to="/mes-reservations" className={linkCls} activeProps={active}>Mes réservations</Link>
            <span className="hidden md:inline text-xs text-muted-foreground ml-3">{user?.email}</span>
            <Button variant="ghost" size="icon" aria-label="Se déconnecter"
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
              <LogOut />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
    </div>
  );
}
