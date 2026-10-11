"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { useEffect, useMemo, useRef } from "react";
import { MeshStandardMaterial, type Group, type Mesh } from "three";
import { heading, stationAt, type ClipName } from "@/lib/scroll-map";
import { useStationOffset } from "./station-offset";

const MODEL = "/models/figure.glb";
const FADE = 0.4;

export function Figure({ shadows }: { shadows: boolean }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL, "/draco/");
  const { actions } = useAnimations(animations, group);
  const offset = useStationOffset();
  const current = useRef<ClipName | null>(null);
  const material = useMemo(() => new MeshStandardMaterial({ color: "#f2f2f2", roughness: 0.6, metalness: 0 }), []);

  useEffect(() => {
    scene.traverse((o) => {
      if ((o as Mesh).isMesh) {
        (o as Mesh).material = material;
        o.castShadow = shadows;
      }
    });
  }, [scene, material, shadows]);

  useFrame((_, dt) => {
    // Walk toward the oncoming milestones (the future), not away from them.
    if (group.current) group.current.rotation.y = MathUtils.damp(group.current.rotation.y, heading(offset.current), 4, dt);
    const wanted = stationAt(offset.current).clip;
    const clip: ClipName = actions[wanted] ? wanted : "idle"; // placeholder model lacks typing/wave
    if (clip === current.current) return;
    if (current.current) actions[current.current]?.fadeOut(FADE);
    actions[clip]?.reset().fadeIn(FADE).play();
    current.current = clip;
  });

  return <primitive ref={group} object={scene} />;
}

useGLTF.preload(MODEL, "/draco/");
