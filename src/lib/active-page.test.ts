import { describe, expect, it } from "vitest";
import { activeSection } from "./active-page";

const sections = [
  { id: "hero", top: 0, height: 800 },
  { id: "about", top: 800, height: 800 },
  { id: "education", top: 1600, height: 1000 },
];

describe("activeSection", () => {
  it("is the section under the middle of the viewport", () => {
    expect(activeSection(400, sections)).toBe("hero");
    expect(activeSection(1700, sections)).toBe("education");
  });

  it("clamps above the first and below the last section", () => {
    expect(activeSection(-50, sections)).toBe("hero");
    expect(activeSection(9999, sections)).toBe("education");
  });

  it("is null before anything is measured", () => {
    expect(activeSection(100, [])).toBeNull();
  });
});
