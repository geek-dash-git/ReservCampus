import { describe, it, expect } from "vitest";
import { overlaps, freeSlots, validateRequest, atHour } from "./slots";

const day = new Date(2030, 0, 15);
const iv = (s: number, e: number) => ({ start: atHour(day, s), end: atHour(day, e) });
const past = new Date(2020, 0, 1);

describe("chevauchement", () => {
  it("10h-12h chevauche 11h-13h", () => expect(overlaps(iv(10, 12), iv(11, 13))).toBe(true));
  it("10h-12h ne chevauche pas 12h-14h (fin = début)", () => expect(overlaps(iv(10, 12), iv(12, 14))).toBe(false));
});

describe("créneaux alternatifs", () => {
  it("exclut les créneaux occupés", () => {
    const slots = freeSlots(day, 2, [iv(10, 12)], past).map((s) => s.start.getHours());
    expect(slots).not.toContain(9);
    expect(slots).not.toContain(10);
    expect(slots).not.toContain(11);
    expect(slots).toContain(8);
    expect(slots).toContain(12);
  });
  it("le dernier créneau de 2h commence à 18h (fermeture 20h)", () => {
    expect(freeSlots(day, 2, [], past).at(-1)!.start.getHours()).toBe(18);
  });
});

describe("règles", () => {
  it("refuse plus de 4 heures", () => expect(validateRequest(iv(8, 13), 0, past)).toMatch(/4 heures/));
  it("refuse une 4e réservation active", () => expect(validateRequest(iv(8, 9), 3, past)).toMatch(/3 réservations/));
  it("accepte 4h avec 2 réservations actives", () => expect(validateRequest(iv(8, 12), 2, past)).toBeNull());
});
