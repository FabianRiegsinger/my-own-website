import { describe, expect, it } from "vitest";
import { Box3, Vector3 } from "three";
import { buildHead, fitScale, regionOf, SKULL } from "./avatar";

describe("regionOf", () => {
  it("dresses the body by the bone that moves each vertex", () => {
    for (const b of ["Head", "Neck", "LeftEye", "RightHand", "LeftHandIndex2", "RightHandThumb4"]) expect(regionOf(`mixamorig${b}`)).toBe("skin");
    for (const b of ["Spine", "Spine1", "Spine2", "LeftShoulder", "RightArm", "LeftForeArm"]) expect(regionOf(`mixamorig${b}`)).toBe("shirt");
    for (const b of ["Hips", "LeftUpLeg", "RightLeg"]) expect(regionOf(`mixamorig${b}`)).toBe("trousers");
    for (const b of ["LeftFoot", "RightToeBase", "LeftToe_End"]) expect(regionOf(`mixamorig${b}`)).toBe("shoes");
  });
});

describe("buildHead", () => {
  const head = buildHead();
  const box = (name: string) => new Box3().setFromObject(head.getObjectByName(name)!);

  it("has the recognisable parts", () => {
    for (const n of ["skull", "hair", "glasses", "eyes", "smile", "ears", "nose", "brows"]) expect(head.getObjectByName(n)).toBeTruthy();
  });

  it("is an upright oval, glasses in front of the face, hair on top", () => {
    const skull = box("skull").getSize(new Vector3());
    expect(skull.y).toBeGreaterThan(skull.x);
    expect(box("glasses").max.z).toBeGreaterThan(box("skull").max.z);
    expect(box("hair").max.y).toBeGreaterThan(box("skull").max.y);
  });
});

describe("fitScale", () => {
  it("scales the skull just past the mannequin head it covers", () => {
    const mannequin = new Vector3(0.18, 0.26, 0.2); // full extents
    const s = fitScale(mannequin);
    expect(SKULL.x * 2 * s).toBeGreaterThanOrEqual(mannequin.x);
    expect(SKULL.y * 2 * s).toBeGreaterThanOrEqual(mannequin.y);
    expect(SKULL.z * 2 * s).toBeGreaterThanOrEqual(mannequin.z);
    expect(Math.max(SKULL.x * 2 * s - mannequin.x, SKULL.y * 2 * s - mannequin.y, SKULL.z * 2 * s - mannequin.z)).toBeLessThan(0.05);
  });
});
