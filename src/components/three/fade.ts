import type { Material, Object3D } from "three";

/** Scales every material's opacity by `w` (base opacity remembered once) and hides the group at 0. */
export function fade(root: Object3D, w: number) {
  root.visible = w > 0.01;
  if (!root.visible) return;
  root.traverse((o) => {
    const mats = (o as Object3D & { material?: Material | Material[] }).material;
    for (const m of mats ? ([] as Material[]).concat(mats) : []) {
      m.transparent = true;
      m.userData.baseOpacity ??= m.opacity;
      m.opacity = m.userData.baseOpacity * w;
    }
  });
}
