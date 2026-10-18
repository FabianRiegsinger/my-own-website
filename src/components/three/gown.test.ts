import { describe, expect, it } from "vitest";
import { sleeveGeometry } from "./Gown";

describe("bell sleeve", () => {
  const len = 0.16;
  const g = sleeveGeometry(len, (s) => 0.09 + 0.065 * s, 0.06, 0.3, 1);
  const p = g.attributes.position;
  const ring = (y: number) => Array.from({ length: p.count }, (_, i) => i).filter((i) => Math.abs(p.getY(i) - y) < 1e-6);
  const r = (i: number) => Math.hypot(p.getX(i), p.getZ(i));

  it("starts round at the elbow and is pleated at the opening", () => {
    const start = ring(0).map(r);
    expect(Math.max(...start) - Math.min(...start)).toBeLessThan(1e-6);
    const end = ring(len).map(r);
    expect(Math.max(...end) - Math.min(...end)).toBeGreaterThan(0.02);
  });

  it("bags below the arm at the opening: the underside (+z for his right arm) hangs wider than the top", () => {
    const end = ring(len);
    const under = Math.max(...end.filter((i) => p.getZ(i) > 0.9 * r(i)).map(r));
    const top = Math.max(...end.filter((i) => p.getZ(i) < -0.9 * r(i)).map(r));
    expect(under).toBeGreaterThan(top * 1.15);
  });
});
