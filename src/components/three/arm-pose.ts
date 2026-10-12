import { Quaternion, Vector3, type Object3D } from "three";
import type { Pose } from "@/lib/entrance";

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

export interface Rig {
  left: Arm;
  right: Arm;
  /** Spine, Spine1, Spine2, Neck: bent together for a forward lean. */
  lean: Object3D[];
}

/** Finds both arms and the spine by Mixamo bone names; null when the model has no such rig. */
export function findArms(root: Object3D): Rig | null {
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
  // "rigSpine" matches mixamorigSpine but not mixamorigSpine1.
  const lean = ["Spine", "Spine1", "Spine2", "Neck"].map((n) => bone(root, `rig${n}`)).filter((b): b is Object3D => !!b);
  return left && right ? { left, right, lean } : null;
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

const axis = new Vector3();

/** Rotates `b0` by `angle` about a model-space `dir` axis, on top of the animated pose. */
function bend(root: Object3D, b0: Object3D, dir: Vector3, angle: number) {
  if (Math.abs(angle) < 0.001 || !b0.parent) return;
  b0.updateWorldMatrix(true, false);
  axis.copy(dir).applyQuaternion(root.getWorldQuaternion(rq)).normalize();
  q.setFromAxisAngle(axis, angle).multiply(b0.getWorldQuaternion(wq)); // desired world rotation
  q.premultiply(b0.parent.getWorldQuaternion(pq).invert());
  b0.quaternion.copy(q);
}

/** Overlays the procedural poses on whatever the mixer just played: hands on hips, thinking, and a right-hand wave. */
export function applyArms(root: Object3D, arms: Rig, pose: Pose, t: number) {
  // Thinking/reading: lean in a little, head tipped down and to the side (spread over spine and neck).
  arms.lean.forEach((b, i) => {
    bend(root, b, d.set(1, 0, 0), pose.think * (i === arms.lean.length - 1 ? 0.16 : 0.045));
    if (i === arms.lean.length - 1) bend(root, b, d.set(0, 0, 1), pose.think * 0.1);
  });
  for (const arm of [arms.left, arms.right]) {
    const s = arm.side;
    // Elbow out and slightly back, forearm folding in so the hand rests on the waist.
    aim(root, arm.upper, arm.fore, d.set(0.6 * s, -0.76, -0.26), pose.hips);
    aim(root, arm.fore, arm.hand, d.set(-0.68 * s, -0.62, 0.36), pose.hips);
  }
  const r = arms.right;
  const l = arms.left;
  // Right hand up to the chin, elbow resting on the left forearm folded across the waist.
  aim(root, r.upper, r.fore, d.set(-0.25 * r.side, -0.75, 0.6), pose.think);
  aim(root, r.fore, r.hand, d.set(-0.3 * r.side, 0.95, -0.05), pose.think);
  aim(root, l.upper, l.fore, d.set(0.2 * l.side, -0.9, 0.35), pose.think);
  aim(root, l.fore, l.hand, d.set(-0.92 * l.side, 0.08, 0.38), pose.think);
  // Graduation: both arms up in a V, pumping a little.
  for (const arm of [l, r]) {
    const pump = 0.12 * Math.sin(t * 5);
    aim(root, arm.upper, arm.fore, d.set(0.5 * arm.side, 0.85 + pump, 0.12), pose.cheer);
    aim(root, arm.fore, arm.hand, d.set(0.28 * arm.side, 1, 0.08), pose.cheer);
  }
  // Holding an open laptop: elbows at the sides, forearms level and forward under the base.
  for (const arm of [l, r]) {
    aim(root, arm.upper, arm.fore, d.set(0.12 * arm.side, -0.95, 0.2), pose.laptop);
    aim(root, arm.fore, arm.hand, d.set(-0.22 * arm.side, 0.04, 1), pose.laptop);
  }
  // Tablet in the left hand at chest height; the right hand opens out to the side, back toward the fleet.
  aim(root, l.upper, l.fore, d.set(0.1 * l.side, -0.95, 0.25), pose.tablet);
  aim(root, l.fore, l.hand, d.set(-0.35 * l.side, 0.35, 0.9), pose.tablet);
  aim(root, r.upper, r.fore, d.set(0.75 * r.side, -0.6 + 0.08 * Math.sin(t * 1.3), -0.15), pose.tablet);
  aim(root, r.fore, r.hand, d.set(0.8 * r.side, 0.15, -0.3), pose.tablet);
  aim(root, r.upper, r.fore, d.set(0.8 * r.side, 0.5, 0.25), pose.wave);
  aim(root, r.fore, r.hand, d.set(r.side * (0.2 + 0.35 * Math.sin(t * 7)), 1, 0.2), pose.wave);
}
