"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { MathUtils } from "three";
import { toStationOffset } from "@/lib/scroll-map";
import { useStationOffset } from "./station-offset";

type Span = { top: number; height: number };

/** Maps native page scroll (viewport centre) onto the station scale, damped for smooth 3D motion. */
export function ScrollTracker({ content }: { content: RefObject<HTMLDivElement | null> }) {
  const offsetRef = useStationOffset();
  // Section spans in page coordinates; only re-measured when the content's layout changes, not every frame.
  const spans = useRef<Span[] | null>(null);

  useEffect(() => {
    const el = content.current;
    if (!el) return;
    const observer = new ResizeObserver(() => (spans.current = null));
    observer.observe(el);
    return () => observer.disconnect();
  }, [content]);

  useFrame((_, dt) => {
    const el = content.current;
    if (!el) return;
    spans.current ??= [...el.querySelectorAll<HTMLElement>("section")].map((s) => ({
      top: s.getBoundingClientRect().top + window.scrollY,
      height: s.offsetHeight,
    }));
    const target = toStationOffset(window.scrollY + window.innerHeight / 2, spans.current);
    offsetRef.current = MathUtils.damp(offsetRef.current, target, 6, dt);
  });
  return null;
}
