import { CalendarCheck } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`flex items-center gap-2 font-display text-lg font-bold ${light ? "text-primary-foreground" : "text-foreground"}`}>
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
        <CalendarCheck className="size-4" />
      </span>
      ReservCampus
    </span>
  );
}
