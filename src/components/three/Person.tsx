"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { AnimationMixer, type Group, type Mesh } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { poseFor, type Pose } from "@/lib/entrance";
import { applyArms, findArms } from "./arm-pose";
import { paintBody, type Palette } from "./avatar";
import { isShown } from "./fade";
import { MODEL } from "./Figure";

/** A generic, faceless person: a copy of the figure's rig in its own clothes, idling out of step with the others. */
export function Person({ position, yaw, palette, pose = {}, phase = 0 }: { position: [number, number, number]; yaw: number; palette: Palette; pose?: Partial<Pose>; phase?: number }) {
  const { scene, animations } = useGLTF(MODEL, "/draco/");
  const body = useMemo(() => {
    const c = clone(scene);
    paintBody(c, { own: palette }, "own");
    c.traverse((o) => ((o as Mesh).isMesh ? (o.castShadow = true) : undefined));
    return c;
  }, [scene, palette]);
  const ref = useRef<Group>(null);
  // Own mixer instead of useAnimations: it only advances while this person's scene is on screen.
  const mixer = useMemo(() => new AnimationMixer(body), [body]);
  const rig = useMemo(() => findArms(body), [body]);
  const weights = useMemo(() => ({ ...poseFor("walk"), ...pose }), [pose]);

  useLayoutEffect(() => {
    const idle = animations.find((a) => a.name === "idle");
    if (!idle) return;
    mixer.clipAction(idle).play();
    mixer.update(phase); // start out of step with the others (only action on this mixer)
    return () => void mixer.stopAllAction();
  }, [animations, mixer, phase]);

  useFrame(({ clock }, dt) => {
    if (!isShown(ref.current)) return;
    mixer.update(dt);
    if (rig) applyArms(body, rig, weights, clock.elapsedTime + phase);
  });

  return <primitive ref={ref} object={body} position={position} rotation-y={yaw} />;
}
