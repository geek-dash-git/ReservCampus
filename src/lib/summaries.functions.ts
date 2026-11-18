import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

/** Résume les réservations (ressource, créneau, motif) — réservé aux gestionnaires. */
export const summarizeReservations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => ({ ids: input.ids.slice(0, 50) }))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Accès réservé aux gestionnaires");
    if (data.ids.length === 0) return { summaries: {} as Record<string, string>, error: null };

    const { data: rows, error } = await context.supabase
      .from("reservations").select("id, starts_at, ends_at, purpose, resources(name, type)").in("id", data.ids);
    if (error) throw new Error(error.message);

    const lines = (rows ?? []).map((r) =>
      `${r.id} | ${r.resources?.name ?? "?"} (${r.resources?.type ?? "?"}) | ${new Date(r.starts_at).toLocaleString("fr-FR", { timeZone: "UTC" })} → ${new Date(r.ends_at).toLocaleTimeString("fr-FR", { timeZone: "UTC" })} UTC | motif: ${r.purpose || "non précisé"}`,
    ).join("\n");

    try {
      const res = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions:
          "Tu es l'assistant d'un gestionnaire de campus. Pour chaque réservation, écris un résumé d'une phrase courte en français mentionnant la ressource, le créneau (jour + heures) et le motif. Réponds uniquement en JSON : {\"<id>\": \"<résumé>\", ...}.",
        input: lines,
      });
      const text = JSON.stringify(res.output ?? []).match(/"text":"((?:[^"\\]|\\.)*)"/)?.[1];
      const raw = text ? (JSON.parse(`"${text}"`) as string) : "{}";
      const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1) || "{}";
      return { summaries: JSON.parse(json) as Record<string, string>, error: null };
    } catch (e) {
      console.error(e);
      const msg = e instanceof GatewayError && e.httpStatus === 402 ? "Crédits IA épuisés" :
        e instanceof GatewayError && e.httpStatus === 429 ? "Trop de demandes, réessayez dans un instant" : "Résumé indisponible";
      return { summaries: {} as Record<string, string>, error: msg };
    }
  });
