import type { Material, Object3D } from "three";

type WithMaterial = Object3D & { material?: Material | Material[] };

function fadeMaterial(m: Material, w: number) {
  m.userData.baseOpacity ??= m.opacity;
  m.userData.baseTransparent ??= m.transparent;
  m.opacity = m.userData.baseOpacity * w;
  // Only blend while fading: fully shown, opaque materials draw opaque again (correct sorting, cheaper).
  m.transparent = m.userData.baseTransparent || w < 1;
}

/** Scales every material's opacity by `w` (base opacity remembered once) and hides the group at 0. */
export function fade(root: Object3D, w: number) {
  root.visible = w > 0.01;
  if (!root.visible) return;
  root.traverse((o) => {
    const mats = (o as WithMaterial).material;
    if (Array.isArray(mats)) for (const m of mats) fadeMaterial(m, w);
    else if (mats) fadeMaterial(mats, w);
  });
}

/** True when the object and all its ancestors are visible, i.e. it is actually drawn. */
export function isShown(o: Object3D | null) {
  for (; o; o = o.parent) if (!o.visible) return false;
  return true;
}
