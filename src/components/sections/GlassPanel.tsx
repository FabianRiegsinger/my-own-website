"use client";

import type { ReactNode } from "react";
import { useTilt } from "./useTilt";

/** Liquid-glass panel that tilts its face toward the mouse and lights a glow under it (mouse only, never with reduced motion). */
export function GlassPanel({ children }: { children: ReactNode }) {
  const tilt = useTilt<HTMLDivElement>();
  return (
    <div
      {...tilt}
      data-glass
      // desk:max-w-[36vw] inside the section's desk:px-[3vw] gutter = PANEL_EDGE in scroll-map; keep them in sync.
      className="glass reveal w-full p-6 transition-[transform,--glow] duration-300 ease-out sm:p-10 desk:max-w-[36vw] desk:p-8"
    >
      {children}
    </div>
  );
}
