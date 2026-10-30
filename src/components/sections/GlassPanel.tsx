"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { tilt } from "@/lib/tilt";

/** Liquid-glass panel that tilts its face toward the mouse and lights a glow under it (mouse only, never with reduced motion). */
export function GlassPanel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const { rx, ry } = tilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    el.style.transform = `perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    el.style.setProperty("--glow-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--glow-y", `${e.clientY - r.top}px`);
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      data-glass
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      // desk:max-w-[36vw] inside the section's desk:px-[3vw] gutter = PANEL_EDGE in scroll-map; keep them in sync.
      className="glass reveal w-full p-6 transition-[transform,--glow] duration-300 ease-out sm:p-10 desk:max-w-[36vw] desk:p-8"
    >
      {children}
    </div>
  );
}
