import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { STATIONS } from "@/lib/scroll-map";
import { FOV_DEG, networkLayout } from "./AgentNetwork";

const agentic = STATIONS.find((s) => s.id === "agentic")!;
const camera = new Vector3(...agentic.camera);
const target = new Vector3(...agentic.target);

describe("networkLayout", () => {
  const { center, width, height } = networkLayout();
  const depth = center.distanceTo(camera);
  const halfH = Math.tan(((FOV_DEG / 2) * Math.PI) / 180) * depth;

  it("sits well behind the figure, so it stays in the background", () => {
    expect(depth).toBeGreaterThan(camera.distanceTo(target) + 3);
  });

  it("spans the whole screen at its depth, ultra-wide and view shift included", () => {
    const aspect = 21 / 9;
    const visibleW = 2 * halfH * aspect * (1 + 2 * agentic.shift);
    expect(width).toBeGreaterThanOrEqual(visibleW);
    expect(height).toBeGreaterThanOrEqual(2 * halfH);
  });

  it("faces the camera", () => {
    const { quaternion } = networkLayout();
    const normal = new Vector3(0, 0, 1).applyQuaternion(quaternion);
    expect(normal.dot(camera.clone().sub(center).normalize())).toBeGreaterThan(0.99);
  });
});
