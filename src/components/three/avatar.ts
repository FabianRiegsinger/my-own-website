import { Color, Float32BufferAttribute, MeshStandardMaterial, Vector3, type Material, type Object3D, type SkinnedMesh } from "three";

/**
 * Clothes for the rigged figures, painted per vertex: Fabian's scan (me.glb) by the regions baked into it, the
 * mannequin colleagues by the bone that moves each vertex. One colour buffer per outfit, switched by page.
 */

export type Region = "skin" | "shirt" | "trousers" | "shoes";
/** Region plus "jacket": torso and arms outside the open front of a blazer. */
export type Garment = Region | "jacket";
export type Palette = Record<Garment, string>;

const SKIN = "#f7d6bf";
const SHIRT = "#a9c6e8";
/** Outfits by page: everyday, business casual at ESAS, the grey polo and chinos from the graduation photo. */
export const OUTFITS = {
  casual: { skin: SKIN, shirt: SHIRT, jacket: SHIRT, trousers: "#2f3747", shoes: "#3a2c24" },
  business: { skin: SKIN, shirt: SHIRT, jacket: "#26324a", trousers: "#c9b38e", shoes: "#3a2c24" },
  polo: { skin: SKIN, shirt: "#9ea2a8", jacket: "#9ea2a8", trousers: "#c9b38e", shoes: "#2b2d33" },
} satisfies Record<string, Palette>;
const HAIR = "#6e4b33";
const DARK = "#1f1f22";

/** Regions the rig script (scripts/rig-me) bakes into me.glb's `_region` attribute, by index. */
export const REGIONS = ["skin", "shirt", "trousers", "shoes", "hair", "dark", "forearm"] as const;
export type Kind = (typeof REGIONS)[number] | "jacket";

/** Colour of a painted part in an outfit: forearms are bare below the short sleeves unless a jacket covers them. */
export function paintOf(kind: Kind, palette: Palette): string {
  if (kind === "hair") return HAIR;
  if (kind === "dark") return DARK;
  if (kind === "forearm") return palette.jacket !== palette.shirt ? palette.jacket : palette.skin;
  return palette[kind];
}

/** Which garment a vertex belongs to, by the bone that moves it most. */
export function regionOf(bone: string): Region {
  if (/(Foot|Toe)/.test(bone)) return "shoes";
  if (/(Hips|UpLeg|Leg)$/.test(bone)) return "trousers";
  if (/(Head|Neck|Eye|Hand)/.test(bone)) return "skin";
  return "shirt"; // spine, shoulders, arms
}

/** Under a blazer only the open chest strip still shows the shirt. */
export function garmentOf(region: Region, chestStrip: boolean): Garment {
  return region === "shirt" && !chestStrip ? "jacket" : region;
}

/**
 * Paints each skinned mesh with per-vertex garment colours, precomputing one colour buffer per outfit
 * (switch with `setOutfit`). Geometry is cloned first, so clones of the same model can wear their own palettes.
 */
export function paintBody(root: Object3D, outfits: Record<string, Palette> = OUTFITS, initial = "casual"): Material {
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0 });
  const c = new Color();
  const v = new Vector3();
  root.updateMatrixWorld(true);
  // Finding the chest strip needs skinned vertex positions (slow); only a palette with a jacket over the shirt needs it.
  const needsStrip = Object.values(outfits).some((p) => p.jacket !== p.shirt);
  root.traverse((o) => {
    const mesh = o as SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    mesh.geometry = mesh.geometry.clone();
    if (needsStrip) mesh.skeleton.update();
    const g = mesh.geometry;
    const idx = g.getAttribute("skinIndex");
    const wt = g.getAttribute("skinWeight");
    // A rigged scan carries its own regions (hair, glasses...); the mannequin is dressed by bone.
    const baked = g.getAttribute("_region");
    const garments: Kind[] = [];
    for (let i = 0; i < idx.count; i++) {
      let best = 0;
      for (let k = 1; k < 4; k++) if (wt.getComponent(i, k) > wt.getComponent(i, best)) best = k;
      const kind = baked ? REGIONS[Math.round(baked.getX(i))] : regionOf(mesh.skeleton.bones[idx.getComponent(i, best)].name);
      if (kind !== "shirt" && kind !== "skin" && kind !== "trousers" && kind !== "shoes") {
        garments.push(kind);
        continue;
      }
      const region: Region = kind;
      // Model space: the figure faces +z; the strip is a narrow band down the front of the chest.
      const p = region === "shirt" && needsStrip ? root.worldToLocal(mesh.localToWorld(mesh.getVertexPosition(i, v))) : v.set(1, 0, -1);
      garments.push(garmentOf(region, Math.abs(p.x) < 0.045 && p.z > 0.02 && p.y > 1.1));
    }
    mesh.userData.outfits = Object.fromEntries(
      Object.entries(outfits).map(([name, palette]) => {
        const colors = new Float32Array(garments.length * 3);
        garments.forEach((gm, i) => colors.set(c.set(paintOf(gm, palette)).toArray(), i * 3));
        return [name, colors];
      }),
    );
    g.setAttribute("color", new Float32BufferAttribute(mesh.userData.outfits[initial], 3));
    mesh.material = material;
  });
  root.userData.outfit = initial;
  return material;
}

/** Switches every painted mesh under `root` to one of its precomputed outfits. */
export function setOutfit(root: Object3D, name: string) {
  if (root.userData.outfit === name) return;
  root.userData.outfit = name;
  root.traverse((o) => {
    const colors = o.userData.outfits?.[name] as Float32Array | undefined;
    const attr = (o as SkinnedMesh).geometry?.getAttribute("color");
    if (!colors || !attr) return;
    (attr.array as Float32Array).set(colors);
    attr.needsUpdate = true;
  });
}
