import { describe, expect, it } from "vitest";
import { Group, Mesh, MeshStandardMaterial } from "three";
import { fade, isShown } from "./fade";

const scene = (transparent = false) => {
  const material = new MeshStandardMaterial({ opacity: 0.8, transparent });
  const root = new Group();
  root.add(new Mesh(undefined, material));
  return { root, material };
};

describe("fade", () => {
  it("scales opacity from the base and hides the group near zero", () => {
    const { root, material } = scene();
    fade(root, 0.5);
    expect(material.opacity).toBeCloseTo(0.4);
    fade(root, 1);
    expect(material.opacity).toBeCloseTo(0.8);
    fade(root, 0);
    expect(root.visible).toBe(false);
  });

  it("draws fully shown materials opaque again, so they sort and depth-test like before", () => {
    const { root, material } = scene();
    fade(root, 0.5);
    expect(material.transparent).toBe(true);
    fade(root, 1);
    expect(material.transparent).toBe(false);
  });

  it("keeps materials that were transparent to begin with transparent", () => {
    const { root, material } = scene(true);
    fade(root, 1);
    expect(material.transparent).toBe(true);
  });
});

describe("isShown", () => {
  it("is false when any ancestor is hidden", () => {
    const { root } = scene();
    const child = root.children[0];
    expect(isShown(child)).toBe(true);
    root.visible = false;
    expect(isShown(child)).toBe(false);
  });
});
