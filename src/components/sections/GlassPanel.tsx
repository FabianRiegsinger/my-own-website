"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { tilt } from "@/lib/tilt";

/** Liquid-glass panel that tilts its face toward the mouse (mouse only, never with reduced motion). */
export function GlassPanel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const { rx, ry } = tilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    el.style.transform = `perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
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
      // lg:max-w-[36vw] inside the section's lg:px-[3vw] gutter = PANEL_EDGE in scroll-map; keep them in sync.
      className="glass reveal w-full p-6 transition-transform duration-300 ease-out sm:p-10 lg:max-w-[36vw] lg:p-8"
    >
      {children}
    </div>
  );
}
