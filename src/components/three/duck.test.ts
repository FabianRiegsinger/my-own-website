import { describe, expect, it } from "vitest";
import { duckScale } from "./duck";

describe("duckScale", () => {
  const edge = 600; // px where the text column ends

  it("hides a sphere over the text column", () => {
    expect(duckScale(400, edge)).toBe(0);
    expect(duckScale(edge, edge)).toBe(0);
  });

  it("shows a sphere well clear of the text", () => {
    expect(duckScale(900, edge)).toBe(1);
  });

  it("grows smoothly in between", () => {
    const s = duckScale(edge + 70, edge);
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });

  it("never ducks when there is no text edge (mobile)", () => {
    expect(duckScale(10, null)).toBe(1);
  });
});
