"use client";

import { Outlines, useAnimations, useGLTF } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { MathUtils, MeshStandardMaterial, type Group, type Mesh } from "three";
import { heading, stationAt, type ClipName } from "@/lib/scroll-map";
import { switchClip } from "./clips";
import { useStationOffset } from "./station-offset";

const MODEL = "/models/figure.glb";
const FADE = 0.4;

export function Figure({ shadows }: { shadows: boolean }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL, "/draco/");
  const { actions, mixer } = useAnimations(animations, group);
  const offset = useStationOffset();
  const current = useRef<ClipName | null>(null);
  const meshes = useMemo(() => {
    const list: Mesh[] = [];
    scene.traverse((o) => (o as Mesh).isMesh && list.push(o as Mesh));
    return list;
  }, [scene]);
  const material = useMemo(() => new MeshStandardMaterial({ color: "#f2f2f2", roughness: 0.6, metalness: 0 }), []);

  // Only the model's own meshes: the outline meshes added below must keep their black material.
  useEffect(() => {
    for (const m of meshes) {
      m.material = material;
      m.castShadow = shadows;
    }
  }, [meshes, material, shadows]);

  const clipFor = (offset: number): ClipName => {
    const wanted = stationAt(offset).clip;
    return actions[wanted] ? wanted : "idle"; // placeholder model lacks typing/wave
  };

  // Pose the skeleton before the first frame is drawn, so the T-pose never shows.
  useLayoutEffect(() => {
    const clip = clipFor(offset.current);
    switchClip(actions, null, clip, FADE);
    mixer.update(0);
    current.current = clip;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the animations are bound
  }, [actions, mixer]);

  useFrame((_, dt) => {
    // Walk toward the oncoming milestones (the future), not away from them.
    if (group.current) group.current.rotation.y = MathUtils.damp(group.current.rotation.y, heading(offset.current), 4, dt);
    const clip = clipFor(offset.current);
    if (clip === current.current) return;
    switchClip(actions, current.current, clip, FADE);
    current.current = clip;
  });

  return (
    <>
      <primitive ref={group} object={scene} />
      {/* Thick black ink outline on every (skinned) mesh: the neo-brutalist figure. */}
      {meshes.map((m) => createPortal(<Outlines screenspace thickness={3} color="#000000" />, m))}
    </>
  );
}

useGLTF.preload(MODEL, "/draco/");
