"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Box3, Quaternion, Vector3, type Group, type Mesh, type Object3D } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { isShown } from "./fade";
import { lowest, turn, type Joint } from "./GenMe";

/** What a colleague is doing this frame, each 0..1 (set by the station that places them). */
export interface ColleaguePose {
  point: number;
  think: number;
  nod: number;
  thumb: number;
}

export interface ColleagueProps {
  /** Any rigged GLB; models without me.glb's bone names are shown standing still. */
  model: string;
  height: number;
  /** Build: scales the shoulders' axis (model z of a me.glb export). */
  width: number;
  position: [number, number, number];
  /** Facing on stage, 0 = +z (the camera). */
  yaw: number;
  /** Turns the model's own front to +z: me.glb exports face +x. */
  modelYaw?: number;
  /** Head size against the body (scales the Head bone): below 1 tones down the cartoon proportions. */
  head?: number;
  /** Seeds this character's idle (breathing rate, glances, weight shift), so a group never moves in step. */
  phase: number;
  /** Read every frame. */
  pose: () => ColleaguePose;
  shadows?: boolean;
}

const X = new Vector3(1, 0, 0);
const Y = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
const BONES = ["L_Upperarm", "R_Upperarm", "L_Forearm", "R_Forearm", "L_Hand", "R_Hand", "L_Foot", "R_Foot", "L_ToeBase", "R_ToeBase", "Waist", "Spine02", "Head"] as const;

/** A secondary character from its own model file, posed on the same rig conventions as GenMe (export faces +x). */
export function Colleague({ model, height, width, position, yaw, modelYaw = -Math.PI / 2, head = 1, phase, pose, shadows = true }: ColleagueProps) {
  const { scene } = useGLTF(model, "/draco/");
  const body = useMemo(() => {
    const c = clone(scene);
    c.traverse((o) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = shadows;
        o.frustumCulled = false; // skinned: the bind-pose bounds do not follow the pose
      }
    });
    c.getObjectByName("Head")?.scale.setScalar(head);
    return c;
  }, [scene, shadows, head]);
  const fit = useMemo(() => {
    body.updateMatrixWorld(true);
    const box = new Box3().setFromObject(body, true); // precise: skinned, so a scaled head counts
    const s = height / box.getSize(new Vector3()).y;
    const c = box.getCenter(new Vector3());
    return { s, centre: new Vector3(-c.x * s, -box.min.y * s, -c.z * s * width) };
  }, [body, height, width]);
  // Captured from the bind pose; null for a model with another rig.
  const rig = useMemo(() => {
    body.updateMatrixWorld(true);
    const inv = body.getWorldQuaternion(new Quaternion()).invert();
    const J: Partial<Record<(typeof BONES)[number], Joint>> = {};
    for (const n of BONES) {
      const bone = body.getObjectByName(n);
      if (!bone?.parent) return null;
      J[n] = { bone, rest: bone.quaternion.clone(), parent: inv.clone().multiply(bone.parent.getWorldQuaternion(new Quaternion())), bind: bone.matrixWorld.clone() };
    }
    const j = J as Record<(typeof BONES)[number], Joint>;
    const feet: Object3D[] = [j.L_Foot.bone, j.R_Foot.bone, j.L_ToeBase.bone, j.R_ToeBase.bone];
    return { j, feet, ground: lowest(body, feet) };
  }, [body]);

  const ref = useRef<Group>(null);
  // Pseudo-random from the phase: pure, and different for each character.
  const idle = useMemo(() => {
    const r = (k: number) => {
      const v = Math.sin(phase * 127.1 + k * 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    return { rate: 0.8 + 0.4 * r(1), look: 0.1 + 0.15 * r(2), lookRate: 0.25 + 0.35 * r(3), shift: 0.3 + 0.5 * r(4), tilt: 0.04 * (r(5) - 0.5) };
  }, [phase]);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!rig || !m || !isShown(m)) return;
    const { j } = rig;
    const w = pose();
    const t = clock.elapsedTime + phase;
    for (const n of BONES) j[n].bone.quaternion.copy(j[n].rest);
    const breath = Math.sin(t * 1.6 * idle.rate);
    // Idle as GenMe: arms down from the T-pose, elbows a touch forward, breathing, weight shifting.
    turn(j.L_Upperarm, X, -1.4 + 0.03 * breath);
    turn(j.R_Upperarm, X, 1.4 - 0.03 * breath);
    turn(j.L_Forearm, Y, -0.2);
    turn(j.R_Forearm, Y, 0.2);
    turn(j.L_Hand, X, -0.15);
    turn(j.R_Hand, X, 0.15);
    turn(j.Spine02, Z, -0.02 * breath);
    turn(j.Waist, X, 0.02 * Math.sin(t * idle.shift));
    // Glancing around now and then (two waves, so it never repeats evenly), the head carried with its own slight tilt.
    turn(j.Head, Y, idle.look * Math.sin(t * idle.lookRate) * Math.sin(t * idle.lookRate * 0.37 + 1));
    turn(j.Head, X, idle.tilt);
    // Pointing ahead with the right arm (Z swings the arm forward).
    turn(j.R_Upperarm, Z, 1.35 * w.point);
    turn(j.R_Upperarm, X, -0.25 * w.point);
    turn(j.R_Forearm, Y, -0.12 * w.point);
    // Thinking: left forearm across the waist, right hand up to the chin, head down.
    turn(j.L_Upperarm, Z, 0.45 * w.think);
    turn(j.L_Forearm, Y, -1.7 * w.think);
    turn(j.R_Upperarm, Z, 0.55 * w.think);
    turn(j.R_Upperarm, X, -0.35 * w.think);
    turn(j.R_Forearm, Y, 2.3 * w.think);
    turn(j.Head, Z, -0.2 * w.think - w.nod * (0.1 + 0.12 * Math.sin(t * 6)));
    // Thumbs-up, as GenMe's on the contact page.
    turn(j.R_Upperarm, Z, 0.95 * w.thumb);
    turn(j.R_Upperarm, X, -0.25 * w.thumb);
    turn(j.R_Forearm, Y, 1.15 * w.thumb);
    m.position.y = fit.centre.y + (rig.ground - lowest(m, rig.feet)) * fit.s;
  });

  return (
    <group position={position} rotation-y={yaw}>
      <group rotation-y={modelYaw}>
        <primitive ref={ref} object={body} scale={[fit.s, fit.s, fit.s * width]} position={fit.centre} />
      </group>
    </group>
  );
}
