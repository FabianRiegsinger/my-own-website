import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";

function keys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe("de dictionary", () => {
  it("has every key of en and no extra key", () => {
    expect(keys(de).sort()).toEqual(keys(en).sort());
  });
  it("has no empty German value", () => {
    for (const k of keys(de)) {
      const value = k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], de);
      expect(value, k).toBeTruthy();
    }
  });
  it("has twelve German month names", () => {
    expect(de.timeline.months).toHaveLength(12);
  });
});
