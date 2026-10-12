import { describe, expect, it } from "vitest";
import { Box3, Vector3 } from "three";
import { buildLaptop, buildMortarboard, buildSkirt, buildTablet } from "./props";
import { SKULL } from "./avatar";

const normalOf = (o: import("three").Object3D) => {
  o.updateWorldMatrix(true, true);
  return new Vector3(0, 0, 1).transformDirection(o.matrixWorld); // planes face +z before rotation
};

describe("props", () => {
  it("laptop is held in front of the chest with its screen turned toward the holder (-z)", () => {
    const laptop = buildLaptop();
    const box = new Box3().setFromObject(laptop);
    expect(box.min.z).toBeGreaterThan(0.1);
    expect(box.getCenter(new Vector3()).y).toBeGreaterThan(1);
    expect(normalOf(laptop.getObjectByName("screen")!).z).toBeLessThan(-0.8);
  });

  it("tablet screen tilts up toward the face", () => {
    const n = normalOf(buildTablet(1).getObjectByName("screen")!);
    expect(n.y).toBeGreaterThan(0.3);
    expect(n.z).toBeLessThan(0);
  });

  it("gown skirt flares out from waist to ankles", () => {
    const box = new Box3().setFromObject(buildSkirt());
    expect(box.max.y).toBeLessThan(1.1);
    expect(box.min.y).toBeGreaterThan(0.1);
    expect(box.max.x).toBeGreaterThan(0.3);
  });

  it("mortarboard sits on top of the head", () => {
    const box = new Box3().setFromObject(buildMortarboard());
    expect(box.min.y).toBeGreaterThan(SKULL.y * 0.6);
  });
});
