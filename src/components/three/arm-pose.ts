import { Quaternion, Vector3, type Object3D } from "three";

/** One arm of a Mixamo rig; `side` is the arm's outward x sign in model space. */
export interface Arm {
  upper: Object3D;
  fore: Object3D;
  hand: Object3D;
  side: number;
}

const a = new Vector3();
const b = new Vector3();
const cur = new Vector3();
const want = new Vector3();
const d = new Vector3();
const q = new Quaternion();
const wq = new Quaternion();
const pq = new Quaternion();
const rq = new Quaternion();

function bone(root: Object3D, suffix: string) {
  let found: Object3D | undefined;
  // GLTFLoader strips the ":" from "mixamorig:RightArm", so match by suffix.
  root.traverse((o) => {
    if (!found && o.name.endsWith(suffix)) found = o;
  });
  return found;
}

/** Finds both arms by Mixamo bone names; null when the model has no such rig. */
export function findArms(root: Object3D): { left: Arm; right: Arm } | null {
  root.updateWorldMatrix(true, true);
  const arm = (s: "Left" | "Right"): Arm | null => {
    const upper = bone(root, `${s}Arm`);
    const fore = bone(root, `${s}ForeArm`);
    const hand = bone(root, `${s}Hand`);
    if (!upper || !fore || !hand) return null;
    return { upper, fore, hand, side: Math.sign(root.worldToLocal(upper.getWorldPosition(a)).x) || 1 };
  };
  const left = arm("Left");
  const right = arm("Right");
  return left && right ? { left, right } : null;
}

/** Rotates `b0` so the segment toward `child` points along `dir` (model space), blended by `w` over the animated pose. */
function aim(root: Object3D, b0: Object3D, child: Object3D, dir: Vector3, w: number) {
  if (w <= 0.001 || !b0.parent) return;
  b0.updateWorldMatrix(true, true);
  cur.subVectors(child.getWorldPosition(b), b0.getWorldPosition(a)).normalize();
  want.copy(dir).normalize().applyQuaternion(root.getWorldQuaternion(rq));
  q.setFromUnitVectors(cur, want).multiply(b0.getWorldQuaternion(wq)); // desired world rotation
  q.premultiply(b0.parent.getWorldQuaternion(pq).invert()); // back to parent-local
  b0.quaternion.slerp(q, w);
}

/** Overlays the procedural arm poses on whatever the mixer just played: hands on hips, and a right-hand wave. */
export function applyArms(root: Object3D, arms: { left: Arm; right: Arm }, pose: { wave: number; hips: number }, t: number) {
  for (const arm of [arms.left, arms.right]) {
    const s = arm.side;
    // Elbow out and slightly back, forearm folding in so the hand rests on the waist.
    aim(root, arm.upper, arm.fore, d.set(0.6 * s, -0.76, -0.26), pose.hips);
    aim(root, arm.fore, arm.hand, d.set(-0.68 * s, -0.62, 0.36), pose.hips);
  }
  const r = arms.right;
  aim(root, r.upper, r.fore, d.set(0.8 * r.side, 0.5, 0.25), pose.wave);
  aim(root, r.fore, r.hand, d.set(r.side * (0.2 + 0.35 * Math.sin(t * 7)), 1, 0.2), pose.wave);
}
