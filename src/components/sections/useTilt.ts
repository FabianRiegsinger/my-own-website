"use client";

import { useRef, type PointerEvent } from "react";
import { tilt } from "@/lib/tilt";

/**
 * Tilts an element's face toward the mouse and tracks the glow position under the glass (mouse only, never with
 * reduced motion). Sets --glow-x/y, plus --glow-x-flip (mirrored) for a face turned around on the element.
 */
export function useTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const onPointerMove = (e: PointerEvent<T>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const { rx, ry } = tilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    el.style.transform = `perspective(1400px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    el.style.setProperty("--glow-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--glow-x-flip", `${r.right - e.clientX}px`);
    el.style.setProperty("--glow-y", `${e.clientY - r.top}px`);
  };

  const onPointerLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return { ref, onPointerMove, onPointerLeave };
}
