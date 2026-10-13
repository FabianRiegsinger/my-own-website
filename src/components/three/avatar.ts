import {
  Box3,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Material,
  type Object3D,
  type SkinnedMesh,
} from "three";

/**
 * Memoji-style look for the rigged mannequin, after Fabian's photo: light-blue shirt, dark trousers, short swept
 * brown hair, thin round metal glasses, blue-grey eyes, a small smile. Everything rides on the existing skeleton,
 * so every animation keeps working.
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
const COLORS = OUTFITS.casual;
const HAIR = "#6e4b33";

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
  root.traverse((o) => {
    const mesh = o as SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    mesh.geometry = mesh.geometry.clone();
    mesh.skeleton.update();
    const g = mesh.geometry;
    const idx = g.getAttribute("skinIndex");
    const wt = g.getAttribute("skinWeight");
    const garments: Garment[] = [];
    for (let i = 0; i < idx.count; i++) {
      let best = 0;
      for (let k = 1; k < 4; k++) if (wt.getComponent(i, k) > wt.getComponent(i, best)) best = k;
      const region = regionOf(mesh.skeleton.bones[idx.getComponent(i, best)].name);
      // Model space: the figure faces +z; the strip is a narrow band down the front of the chest.
      const p = region === "shirt" ? root.worldToLocal(mesh.localToWorld(mesh.getVertexPosition(i, v))) : v.set(1, 0, -1);
      garments.push(garmentOf(region, Math.abs(p.x) < 0.045 && p.z > 0.02 && p.y > 1.1));
    }
    mesh.userData.outfits = Object.fromEntries(
      Object.entries(outfits).map(([name, palette]) => {
        const colors = new Float32Array(garments.length * 3);
        garments.forEach((gm, i) => colors.set(c.set(palette[gm]).toArray(), i * 3));
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

/** Skull half-extents (m) the face is laid out on; `fitScale` sizes the whole head from these. */
export const SKULL = new Vector3(0.095, 0.118, 0.105);

const part = (name: string, geometry: SphereGeometry | TorusGeometry | CylinderGeometry | CapsuleGeometry, material: Material, at: [number, number, number], scale?: [number, number, number]) => {
  const m = new Mesh(geometry, material);
  m.name = name;
  m.position.set(...at);
  if (scale) m.scale.set(...scale);
  m.castShadow = true;
  return m;
};

const group = (name: string, ...children: Object3D[]) => {
  const g = new Group();
  g.name = name;
  g.add(...children);
  return g;
};

/** The head in model space: origin at the skull centre, +y up, +z toward the viewer. */
export function buildHead(): Group {
  const skin = new MeshPhysicalMaterial({ color: COLORS.skin, roughness: 0.55, sheen: 0.4, sheenColor: new Color("#ffd9c4") });
  const hair = new MeshStandardMaterial({ color: HAIR, roughness: 0.8, side: DoubleSide });
  const white = new MeshStandardMaterial({ color: "#ffffff", roughness: 0.3 });
  const iris = new MeshStandardMaterial({ color: "#6f8fa6", roughness: 0.3 });
  const pupil = new MeshStandardMaterial({ color: "#1b1b1f", roughness: 0.2 });
  const metal = new MeshStandardMaterial({ color: "#8d9298", metalness: 0.85, roughness: 0.3 });
  const lips = new MeshStandardMaterial({ color: "#b66a5c", roughness: 0.6 });
  const ball = new SphereGeometry(1, 32, 24);

  const skull = part("skull", ball, skin, [0, 0, 0], [SKULL.x, SKULL.y, SKULL.z]);

  const ears = group(
    "ears",
    ...[-1, 1].map((s) => part("ear", ball, skin, [s * 0.093, -0.002, -0.006], [0.012, 0.026, 0.02])),
  );
  const nose = part("nose", ball, skin, [0, -0.024, 0.101], [0.014, 0.017, 0.015]);

  const eye = (s: number) =>
    group(
      "eye",
      part("sclera", ball, white, [s * 0.036, 0.008, 0.087], [0.018, 0.018, 0.018]),
      part("iris", ball, iris, [s * 0.036, 0.008, 0.099], [0.0105, 0.0105, 0.007]),
      part("pupil", ball, pupil, [s * 0.036, 0.008, 0.1045], [0.005, 0.005, 0.003]),
    );
  const eyes = group("eyes", eye(-1), eye(1));
  // Blink scales the eyes about their own centre line, not the skull's.
  eyes.position.y = 0.008;
  eyes.children.forEach((e) => e.children.forEach((p) => (p.position.y -= 0.008)));

  const brows = group(
    "brows",
    ...[-1, 1].map((s) => {
      const b = part("brow", new CapsuleGeometry(0.0038, 0.022, 4, 8), hair, [s * 0.037, 0.046, 0.098]);
      b.rotation.z = Math.PI / 2 + s * 0.12;
      return b;
    }),
  );

  // Arc of a torus turned so its middle points down: a small closed-mouth smile.
  const arc = Math.PI * 0.62;
  const smile = part("smile", new TorusGeometry(0.022, 0.0032, 8, 24, arc), lips, [0, -0.038, 0.094]);
  smile.rotation.z = Math.PI + (Math.PI - arc) / 2;
  smile.rotation.x = -0.25;

  // Short hair: a cap tipped back so the forehead shows, plus a quiff swept up and to the side.
  const cap = part("cap", new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hair, [0, 0.006, -0.004], [SKULL.x * 1.07, SKULL.y * 1.07, SKULL.z * 1.07]);
  cap.rotation.x = -0.55;
  const quiff = part("quiff", ball, hair, [0.018, 0.1, 0.05], [0.072, 0.02, 0.05]);
  quiff.rotation.set(-0.45, 0, -0.28);
  const sweep = part("sweep", ball, hair, [-0.03, 0.094, 0.062], [0.05, 0.016, 0.032]);
  sweep.rotation.set(-0.5, 0, 0.18);
  const hairGroup = group("hair", cap, quiff, sweep);

  // Thin round metal frames: two rims, bridge, hinges and temples back to the ears.
  const rim = new TorusGeometry(0.026, 0.0021, 8, 40);
  const bar = new CylinderGeometry(0.0018, 0.0018, 1, 6);
  const glasses = group(
    "glasses",
    ...[-1, 1].flatMap((s) => {
      const hinge = part("hinge", bar, metal, [s * 0.075, 0.012, 0.112], [1, 0.024, 1]);
      hinge.rotation.z = Math.PI / 2;
      const temple = part("temple", bar, metal, [s * 0.088, 0.012, 0.055], [1, 0.115, 1]);
      temple.rotation.x = Math.PI / 2;
      return [part("rim", rim, metal, [s * 0.037, 0.01, 0.115]), hinge, temple];
    }),
  );
  const bridge = part("bridge", bar, metal, [0, 0.016, 0.117], [1, 0.022, 1]);
  bridge.rotation.z = Math.PI / 2;
  glasses.add(bridge);

  return group("avatar-head", skull, ears, nose, eyes, brows, smile, hairGroup, glasses);
}

/** Uniform scale that makes the skull just enclose a mannequin head of full extents `size`. */
export function fitScale(size: Vector3): number {
  return Math.max(size.x / (2 * SKULL.x), size.y / (2 * SKULL.y), size.z / (2 * SKULL.z)) * 1.04;
}

/**
 * Covers the mannequin's head with the Memoji head, parented to the head bone so it follows every animation.
 * Call with the skeleton in a pose (after the first mixer update). Returns the head, or null without a head bone.
 */
export function attachHead(root: Object3D): Group | null {
  root.updateMatrixWorld(true);
  const box = new Box3();
  const v = new Vector3();
  let headBone: Object3D | undefined;
  root.traverse((o) => {
    const mesh = o as SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    mesh.skeleton.update();
    const idx = mesh.geometry.getAttribute("skinIndex");
    const wt = mesh.geometry.getAttribute("skinWeight");
    for (let i = 0; i < idx.count; i++) {
      let best = 0;
      for (let k = 1; k < 4; k++) if (wt.getComponent(i, k) > wt.getComponent(i, best)) best = k;
      const bone = mesh.skeleton.bones[idx.getComponent(i, best)];
      if (!/(Head|HeadTop_End|Eye)$/.test(bone.name)) continue;
      headBone ??= mesh.skeleton.bones.find((b) => b.name.endsWith("Head"));
      box.expandByPoint(mesh.localToWorld(mesh.getVertexPosition(i, v)));
    }
  });
  if (!headBone || box.isEmpty()) return null;
  const existing = headBone.getObjectByName("avatar-head");
  if (existing) return existing as Group;

  const head = buildHead();
  head.userData.avatarExtra = true;
  const s = fitScale(box.getSize(new Vector3()));
  // Shrink the mannequin's own head deep inside the skull (an oval leaves its box corners, e.g. the jaw, exposed).
  headBone.scale.setScalar(MANNEQUIN_HEAD);
  headBone.updateMatrixWorld(true);
  // Upright in model space at the mannequin head's centre, then re-expressed in head-bone space.
  const world = new Matrix4().compose(box.getCenter(new Vector3()), root.getWorldQuaternion(new Quaternion()), new Vector3(s, s, s));
  head.applyMatrix4(new Matrix4().copy(headBone.matrixWorld).invert().multiply(world));
  headBone.add(head);
  return head;
}

/** Scale of the mannequin's head bone under the Memoji head; the Memoji head is attached with this already applied. */
export const MANNEQUIN_HEAD = 0.6;

/** Per frame, after the mixer: keep the mannequin head shrunk (clips may key bone scale) and blink every few seconds. */
export function updateAvatar(head: Object3D, t: number) {
  head.parent?.scale.setScalar(MANNEQUIN_HEAD);
  const eyes = head.getObjectByName("eyes");
  if (eyes) eyes.scale.y = t % 4.2 < 0.12 ? 0.1 : 1;
}

/** Undoes the avatar on a copy of the rig (copies share the loaded scene): drops added parts, restores the head bone. */
export function stripAvatar(root: Object3D) {
  const extras: Object3D[] = [];
  root.traverse((o) => {
    if (o.userData.avatarExtra) extras.push(o);
    if (/Head$/.test(o.name)) o.scale.setScalar(1);
  });
  extras.forEach((o) => o.removeFromParent());
}
