"use client";

import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { MathUtils } from "three";
import { toStationOffset } from "@/lib/scroll-map";
import { useStationOffset } from "./station-offset";

/** Maps native page scroll (viewport centre) onto the station scale, damped for smooth 3D motion. */
export function ScrollTracker({ content }: { content: RefObject<HTMLDivElement | null> }) {
  const offset = useStationOffset();
  useFrame((_, dt) => {
    const el = content.current;
    if (!el) return;
    const sections = [...el.querySelectorAll<HTMLElement>("section")].map((s) => ({
      top: s.getBoundingClientRect().top + window.scrollY,
      height: s.offsetHeight,
    }));
    const target = toStationOffset(window.scrollY + window.innerHeight / 2, sections);
    offset.current = MathUtils.damp(offset.current, target, 6, dt);
  });
  return null;
}
