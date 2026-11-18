import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async (u: User | null) => {
      setUser(u);
      if (u) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
        if (active) setIsAdmin(!!data?.some((r) => r.role === "admin"));
      } else setIsAdmin(false);
      if (active) setLoading(false);
    };
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => load(session?.user ?? null));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { user, isAdmin, loading };
}

export function friendlyError(msg: string): string {
  if (msg.includes("no_overlap") || msg.includes("conflicting key")) return "Ce créneau est déjà réservé.";
  return msg;
}
