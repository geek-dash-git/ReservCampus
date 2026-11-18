// Logique métier pure (testée) : chevauchements et créneaux alternatifs.
export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 20;
export const MAX_DURATION_HOURS = 4;
export const MAX_ACTIVE_RESERVATIONS = 3;

export type Interval = { start: Date; end: Date };

/** Deux intervalles [a,b) se chevauchent si a.start < b.end et b.start < a.end */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function isSlotFree(slot: Interval, busy: Interval[]): boolean {
  return !busy.some((b) => overlaps(slot, b));
}

export function atHour(day: Date, hour: number): Date {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** Liste les créneaux libres de `duration` heures pour la journée, sans ceux déjà passés. */
export function freeSlots(day: Date, durationHours: number, busy: Interval[], now = new Date()): Interval[] {
  const out: Interval[] = [];
  for (let h = OPEN_HOUR; h + durationHours <= CLOSE_HOUR; h++) {
    const slot = { start: atHour(day, h), end: atHour(day, h + durationHours) };
    if (slot.start >= now && isSlotFree(slot, busy)) out.push(slot);
  }
  return out;
}

export function validateRequest(slot: Interval, activeCount: number, now = new Date()): string | null {
  const hours = (slot.end.getTime() - slot.start.getTime()) / 3_600_000;
  if (hours <= 0) return "L'heure de fin doit être après l'heure de début.";
  if (hours > MAX_DURATION_HOURS) return `Durée maximale : ${MAX_DURATION_HOURS} heures.`;
  if (slot.start < now) return "Impossible de réserver dans le passé.";
  if (activeCount >= MAX_ACTIVE_RESERVATIONS)
    return `Limite atteinte : ${MAX_ACTIVE_RESERVATIONS} réservations actives maximum.`;
  return null;
}
