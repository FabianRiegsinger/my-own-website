"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { poseFor, type Pose } from "@/lib/entrance";
import { applyArms, findArms } from "./arm-pose";
import { paintBody, stripAvatar, type Palette } from "./avatar";
import { MODEL } from "./Figure";

/** A generic, faceless person: a copy of the figure's rig in its own clothes, idling out of step with the others. */
export function Person({ position, yaw, palette, pose = {}, phase = 0 }: { position: [number, number, number]; yaw: number; palette: Palette; pose?: Partial<Pose>; phase?: number }) {
  const { scene, animations } = useGLTF(MODEL, "/draco/");
  const body = useMemo(() => {
    const c = clone(scene);
    stripAvatar(c); // the loaded scene is also Fabian's: no Memoji head, props or shrunk head bone here
    paintBody(c, { own: palette }, "own");
    c.traverse((o) => ((o as Mesh).isMesh ? (o.castShadow = true) : undefined));
    return c;
  }, [scene, palette]);
  const ref = useRef<Group>(null);
  const { actions, mixer } = useAnimations(animations, ref);
  const rig = useMemo(() => findArms(body), [body]);
  const weights = useMemo(() => ({ ...poseFor("walk"), ...pose }), [pose]);

  useLayoutEffect(() => {
    const idle = actions.idle;
    if (!idle) return;
    idle.reset().play();
    mixer.update(phase); // start out of step with the others (only action on this mixer)
  }, [actions, mixer, phase]);

  useFrame(({ clock }) => {
    if (rig && ref.current?.visible) applyArms(body, rig, weights, clock.elapsedTime + phase);
  });

  return <primitive ref={ref} object={body} position={position} rotation-y={yaw} />;
}
