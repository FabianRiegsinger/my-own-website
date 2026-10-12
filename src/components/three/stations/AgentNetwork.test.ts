import { describe, expect, it } from "vitest";
import { NETWORK_RADIUS, networkCenter } from "./AgentNetwork";

describe("networkCenter", () => {
  it("keeps the whole node cloud clear of the figure", () => {
    const c = networkCenter();
    const fromAxis = Math.hypot(c.x, c.z); // figure stands on the y axis
    expect(fromAxis - NETWORK_RADIUS).toBeGreaterThan(0.5);
  });

  it("sits screen-left of the figure, between the text and the figure", () => {
    // agentic camera looks from (-3, 1.8, 4) at the origin; screen-right is (0.8, 0, 0.6)
    const c = networkCenter();
    expect(c.x * 0.8 + c.z * 0.6).toBeLessThan(-1);
  });
});
