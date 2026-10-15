"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Box3, MathUtils, MeshStandardMaterial, Quaternion, Vector3, type Group, type Material, type Mesh, type Object3D } from "three";
import { entrance, introStep } from "@/lib/entrance";
import { heading, stationAt } from "@/lib/scroll-map";
import { useStationOffset } from "./station-offset";

const MODEL = "/models/me.glb";
const HEIGHT = 1.8;

// Model space of the export: faces +x, up +y, his left arm points -z in the T-pose.
const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
const ARMS_DOWN = 1.35; // rad from T-pose; a little short of 90° so the arms clear the hips
const ELBOW = 0.2;
/** Gait cycles per second: ~0.68 m steps at ENTRANCE pace (startX / walk ≈ 1.2 m/s), so the feet do not slide. */
const STRIDE_HZ = 0.9;
const ARM_SWING = 0.35; // rad
const ELBOW_SWING = 0.3;
const TWIST = 0.1; // pelvis yaw; the chest turns 1.5x against it
const LEAN = 0.05;
const BOB = 0.02; // world units
const SWAY = 0.02;
const DEG = Math.PI / 180;
const TAU = 2 * Math.PI;

/** Wrap-around bump centred at gait phase `c` (0..1) with width ~`s`: a smooth periodic Gaussian. */
const bump = (p: number, c: number, s: number) => Math.exp((Math.cos(TAU * (p - c)) - 1) / (TAU * s) ** 2);

/**
 * One leg's sagittal angles (rad; + = flexion, toes up) over a gait cycle, shaped after typical gait-lab curves.
 * p = 0 at heel strike; stance until ~0.6, then swing.
 */
function gait(p: number) {
  return {
    hip: (7.5 + 22.5 * Math.cos(TAU * p)) * DEG,
    // Small give as the heel lands (loading response), big bend mid-swing so the foot clears the floor.
    knee: (4 + 15 * bump(p, 0.15, 0.06) + 58 * bump(p, 0.72, 0.1)) * DEG,
    // Foot slaps flat, shin rolls over it, push-off, toes lifted through swing.
    ankle: (-7 * bump(p, 0.06, 0.035) + 10 * bump(p, 0.42, 0.1) - 18 * bump(p, 0.62, 0.05) + 3 * bump(p, 0.85, 0.08)) * DEG,
    toe: 30 * bump(p, 0.56, 0.05) * DEG, // heel lifts off the flat toes before push-off
  };
}
/** Scrolling past this many pixels ends the landing entrance so the page never fights the reader. */
const TOP_PX = 40;
const atTop = () => window.scrollY < TOP_PX;

const q = new Quaternion();
const pq = new Quaternion();

/** One posed bone: its rest rotation and its parent's rotation relative to the model root (both fixed). */
interface Joint {
  bone: Object3D;
  rest: Quaternion;
  parent: Quaternion;
}

/**
 * Turns `j.bone` by `angle` about a model-space `axis`, on top of the rotations already applied this frame.
 * The axis is mapped into the parent's frame, so the same call works for any bone.
 */
function turn(j: Joint, axis: Vector3, angle: number) {
  q.setFromAxisAngle(axis, angle);
  pq.copy(j.parent).invert().multiply(q).multiply(j.parent);
  j.bone.quaternion.premultiply(pq);
}

/**
 * Generated likeness of Fabian, rigged but without clips: walks in on the landing page (same choreography as the
 * mannequin Figure, without its wave), then a procedural idle (arms down, breathing, weight shift); turns with the scroll.
 */
export function GenMe({ shadows }: { shadows: boolean }) {
  const { scene } = useGLTF(MODEL, "/draco/");
  const group = useRef<Group>(null);
  const offset = useStationOffset();
  const intro = useRef({ t: 0, done: false });
  const walk = useRef(0); // walk-cycle weight, eased so the stop is not a snap
  const walkT = useRef(0); // time into the walk: every walk starts on a heel strike
  const { scale, offset: centre } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const s = HEIGHT / size.y;
    const c = box.getCenter(new Vector3());
    return { scale: s, offset: [-c.x * s, -box.min.y * s, -c.z * s] as [number, number, number] };
  }, [scene]);
  // Matte: the export's metal/roughness map reads as dull dark metal, so keep only colour and normals.
  useMemo(
    () =>
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || (m.material as Material).userData.matte) return;
        const { map, normalMap } = m.material as MeshStandardMaterial;
        // Faint self-glow in the texture's own colours lifts the shadow side evenly; reflections alone only brighten lit faces.
        m.material = new MeshStandardMaterial({ map, normalMap, metalness: 0, roughness: 0.85, envMapIntensity: 1.2, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.35 });
        m.material.userData.matte = true;
      }),
    [scene],
  );
  useMemo(() => scene.traverse((o) => ((o as Mesh).isMesh ? (o.castShadow = shadows) : undefined)), [scene, shadows]);

  // Captured from the bind (T-)pose before anything is turned.
  const joints = useMemo(() => {
    scene.updateMatrixWorld(true);
    const inv = scene.getWorldQuaternion(new Quaternion()).invert();
    const joint = (name: string): Joint | null => {
      const bone = scene.getObjectByName(name);
      if (!bone?.parent) return null;
      return { bone, rest: bone.quaternion.clone(), parent: inv.clone().multiply(bone.parent.getWorldQuaternion(new Quaternion())) };
    };
    const names = ["L_Upperarm", "R_Upperarm", "L_Forearm", "R_Forearm", "L_Thigh", "R_Thigh", "L_Calf", "R_Calf", "L_Foot", "R_Foot", "L_ToeBase", "R_ToeBase", "Hip", "Waist", "Spine02", "Head"] as const;
    const found = names.map(joint);
    return found.every(Boolean) ? (Object.fromEntries(names.map((n, i) => [n, found[i]!])) as Record<(typeof names)[number], Joint>) : null;
  }, [scene]);

  // At the top of the page start off-screen right before the first frame; anywhere else already in place.
  useLayoutEffect(() => {
    const top = atTop();
    intro.current.done = !top;
    if (top && group.current) {
      const s = entrance(0);
      group.current.position.x = s.x;
      group.current.rotation.y = s.heading;
    }
  }, []);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const it = intro.current;
    if (!it.done && !atTop()) it.done = true;
    let walking = false;
    if (!it.done) {
      it.t = introStep(it.t, dt); // frame time, not wall time: a first-frame stall must not skip the walk-in
      const s = entrance(it.t);
      g.position.x = s.x;
      g.rotation.y = s.heading;
      walking = s.clip === "walk";
      it.done = s.done;
    } else {
      g.position.x = MathUtils.damp(g.position.x, 0, 6, dt);
      g.rotation.y = MathUtils.damp(g.rotation.y, heading(offset.current), 4, dt);
      walking = stationAt(offset.current).clip === "walk";
    }
    walk.current = MathUtils.damp(walk.current, walking ? 1 : 0, 8, dt);
    const w = walk.current;
    walkT.current = w > 0.001 ? walkT.current + dt : 0;
    const pL = (walkT.current * STRIDE_HZ) % 1;
    const pR = (pL + 0.5) % 1;
    // Highest passing over the planted foot (mid-stance), lowest with the legs spread; weight shifts over the stance leg (his left is -z).
    scene.position.set(centre[0], centre[1] + w * BOB * Math.cos(2 * TAU * (pL - 0.3)), centre[2] - w * SWAY * Math.cos(TAU * (pL - 0.3)));

    if (!joints) return;
    const t = clock.elapsedTime;
    for (const j of Object.values(joints)) j.bone.quaternion.copy(j.rest);
    const breath = Math.sin(t * 1.6);
    const sway = Math.sin(t * 0.5);
    // Arms: down from the T-pose about the facing axis, elbows bent a touch forward, swinging gently with the breath.
    turn(joints.L_Upperarm, X, -ARMS_DOWN + 0.03 * breath);
    turn(joints.R_Upperarm, X, ARMS_DOWN - 0.03 * breath);
    turn(joints.L_Forearm, Y, -ELBOW); // about Y in the rest frame: the T-posed forearm bends toward +x (forward)
    turn(joints.R_Forearm, Y, ELBOW);
    // Weight shifts slowly from foot to foot; chest rises with each breath; head drifts a little.
    turn(joints.Waist, X, 0.03 * sway);
    turn(joints.Spine02, Z, -0.02 * breath);
    turn(joints.Head, Y, 0.12 * Math.sin(t * 0.3));
    turn(joints.Head, X, -0.02 * sway);
    // Walk (+ = forward about the left-right axis): each leg follows the gait curves, the arms swing with the opposite leg,
    // the pelvis turns with the forward leg and the chest against it, and the body leans a touch into the walk.
    if (w > 0.001) {
      const leg = (p: number, thigh: Joint, calf: Joint, foot: Joint, toe: Joint) => {
        const a = gait(p);
        turn(thigh, Z, w * a.hip);
        turn(calf, Z, -w * a.knee);
        turn(foot, Z, w * a.ankle);
        turn(toe, Z, w * a.toe);
      };
      leg(pL, joints.L_Thigh, joints.L_Calf, joints.L_Foot, joints.L_ToeBase);
      leg(pR, joints.R_Thigh, joints.R_Calf, joints.R_Foot, joints.R_ToeBase);
      const armL = Math.cos(TAU * pR); // 1 = left arm fully forward, with the right leg
      turn(joints.L_Upperarm, Z, w * ARM_SWING * armL);
      turn(joints.R_Upperarm, Z, -w * ARM_SWING * armL);
      turn(joints.L_Forearm, Y, -w * ELBOW_SWING * (1 + armL) / 2); // rest frame, as for ELBOW
      turn(joints.R_Forearm, Y, w * ELBOW_SWING * (1 - armL) / 2);
      const twist = Math.cos(TAU * pL); // 1 = left leg forward
      turn(joints.Hip, Y, -w * TWIST * twist); // +Y turns his left side (-z) back, so negate
      turn(joints.Spine02, Y, w * TWIST * 1.5 * twist);
      turn(joints.Waist, Z, -w * LEAN);
    }
  });

  // The export faces +x; turn it to face the camera (+z).
  return (
    <group ref={group}>
      <group rotation-y={-Math.PI / 2}>
        <primitive object={scene} scale={scale} position={centre} />
      </group>
    </group>
  );
}

useGLTF.preload(MODEL, "/draco/");
