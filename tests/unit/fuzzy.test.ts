import { describe, expect, it } from "vitest";
import { fuzzyScore, FUZZY_THRESHOLD } from "@/lib/fuzzy";
import { executeGlobalSearch } from "@/server/services/publicQueryService";

describe("fuzzy search", () => {
  it.each([
    ["kardiology", "Cardiology"],
    ["gynocology", "Gynecology & Obstetrics"],
    ["dengu", "Dengue Fever"],
    ["mahabub", "Dr. Mahbubur Rahman"],
    ["nefrology", "Nephrology"],
  ])("matches %s → %s", (q, target) => {
    expect(fuzzyScore(q, target)).toBeGreaterThanOrEqual(FUZZY_THRESHOLD);
  });

  it("rejects unrelated words", () => {
    expect(fuzzyScore("kardiology", "Dermatology")).toBeLessThan(FUZZY_THRESHOLD);
    expect(fuzzyScore("eye", "Neurology")).toBeLessThan(FUZZY_THRESHOLD);
  });

  it("global search tolerates misspellings", () => {
    const top = (q: string) => executeGlobalSearch(q, "en").map((r) => r.titleEn.toLowerCase());
    expect(top("kardiology").some((t) => t.includes("cardio"))).toBe(true);
    expect(top("dengu").some((t) => t.includes("dengue"))).toBe(true);
    expect(top("gynocology").some((t) => t.includes("gyn"))).toBe(true);
  });
});
