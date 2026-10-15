"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Box3, MathUtils, MeshPhysicalMaterial, Quaternion, Vector3, type Group, type Mesh, type MeshStandardMaterial, type Object3D } from "three";
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
/** Walk cycle: strides per second and swing amplitudes (rad). Pace ≈ ENTRANCE.startX / ENTRANCE.walk. */
const STRIDE_HZ = 0.9;
const LEG_SWING = 0.45;
const KNEE = 0.6;
const ARM_SWING = 0.35;
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
  const { scale, offset: centre } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const s = HEIGHT / size.y;
    const c = box.getCenter(new Vector3());
    return { scale: s, offset: [-c.x * s, -box.min.y * s, -c.z * s] as [number, number, number] };
  }, [scene]);
  // Toy-figure plastic: the export's metal/roughness map reads as dull dark metal, so keep only colour and normals.
  useMemo(
    () =>
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || m.material instanceof MeshPhysicalMaterial) return;
        const { map, normalMap } = m.material as MeshStandardMaterial;
        // Faint self-glow in the texture's own colours lifts the shadow side evenly; reflections alone only brighten lit faces.
        m.material = new MeshPhysicalMaterial({ map, normalMap, metalness: 0, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 2.5, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.3 });
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
    const names = ["L_Upperarm", "R_Upperarm", "L_Forearm", "R_Forearm", "L_Thigh", "R_Thigh", "L_Calf", "R_Calf", "Waist", "Spine02", "Head"] as const;
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
    // Walk: legs swing about the left-right axis (+ = forward), the trailing knee bends back, arms swing opposite.
    const w = walk.current;
    if (w > 0.001) {
      const step = Math.sin(t * STRIDE_HZ * 2 * Math.PI);
      turn(joints.L_Thigh, Z, w * LEG_SWING * step);
      turn(joints.R_Thigh, Z, -w * LEG_SWING * step);
      turn(joints.L_Calf, Z, -w * KNEE * Math.max(0, -step));
      turn(joints.R_Calf, Z, -w * KNEE * Math.max(0, step));
      turn(joints.L_Upperarm, Z, -w * ARM_SWING * step);
      turn(joints.R_Upperarm, Z, w * ARM_SWING * step);
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
