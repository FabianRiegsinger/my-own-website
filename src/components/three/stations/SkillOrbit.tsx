"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import type { SkillGroup } from "@/content/types";
import { stationWeight } from "@/lib/scroll-map";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/** One tilted ring per skill group around the figure; sphere size = level. */
export function SkillOrbit({ skills }: { skills: SkillGroup[] }) {
  const root = useRef<Group>(null);
  const rings = useRef<Group>(null);
  const offset = useStationOffset();

  useFrame((_, dt) => {
    if (!root.current || !rings.current) return;
    fade(root.current, stationWeight(offset.current, "skills"));
    rings.current.children.forEach((r, i) => (r.rotation.y += dt * 0.15 * (i % 2 ? 1 : -1)));
  });

  return (
    <group ref={root}>
      <group ref={rings}>
        {skills.map((g, gi) => {
          const radius = 1 + gi * 0.3;
          return (
            <group key={g.group} position-y={0.5 + gi * 0.3} rotation-x={0.12 * (gi % 2 ? 1 : -1)}>
              {g.items.map((item, ii) => {
                const a = (ii / g.items.length) * Math.PI * 2 + gi;
                return (
                  <mesh key={item.name} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}>
                    <sphereGeometry args={[0.04 + 0.022 * item.level, 24, 24]} />
                    <meshStandardMaterial color={item.level >= 4 ? "#ff6a00" : "#e4e4ea"} emissive={item.level >= 4 ? "#ff6a00" : "#000000"} emissiveIntensity={0.35} roughness={0.4} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      </group>
    </group>
  );
}
