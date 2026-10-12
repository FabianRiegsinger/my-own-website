"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Vector3, type Group } from "three";
import type { SkillGroup } from "@/content/types";
import { stationWeight } from "@/lib/scroll-map";
import { contentRight, duckScale } from "../duck";
import { fade } from "../fade";
import { useStationOffset } from "../station-offset";

/** One tilted ring per skill group around the figure; sphere size = level. */
export function SkillOrbit({ skills }: { skills: SkillGroup[] }) {
  const root = useRef<Group>(null);
  const rings = useRef<Group>(null);
  const offset = useStationOffset();
  const textEdge = useRef<number | null>(null);
  const v = useMemo(() => new Vector3(), []);
  const width = useThree((s) => s.size.width);

  // Desktop only: where the skills text ends on screen. Mobile text sits on its own backdrop.
  useEffect(() => {
    const section = document.getElementById("skills");
    if (!section) return;
    const measure = () => (textEdge.current = window.innerWidth >= 768 ? contentRight(section) : null);
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    return () => ro.disconnect();
  }, []);

  useFrame(({ camera }, dt) => {
    if (!root.current || !rings.current) return;
    fade(root.current, stationWeight(offset.current, "skills"));
    if (!root.current.visible) return;
    rings.current.children.forEach((r, i) => {
      r.rotation.y += dt * 0.15 * (i % 2 ? 1 : -1);
      // Spheres orbiting toward the camera swing over the text column: shrink them away there.
      r.children.forEach((m) => {
        const px = ((m.getWorldPosition(v).project(camera).x + 1) / 2) * width;
        const s = duckScale(px, textEdge.current);
        m.visible = s > 0;
        m.scale.setScalar(s);
      });
    });
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
                    <meshStandardMaterial color={item.level >= 4 ? "#2f7bf6" : "#d6d6db"} emissive={item.level >= 4 ? "#2f7bf6" : "#000000"} emissiveIntensity={0.35} roughness={0.4} />
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
