"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Panel header that sticks to the top of the screen while a panel taller than the screen scrolls past, so its
 * heading stays readable. Bleeds over the panel padding (p-6 / sm:p-10 / lg:p-8). Square: the panel clips it to its
 * own rounded corners. Painted like the panel (glass-solid, aligned to the screen from here) and fading out at its
 * lower edge, so text scrolling under it dissolves into the glass instead of meeting a hard line.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const align = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--field-x", `${-r.left}px`);
      el.style.setProperty("--field-y", `${-r.top}px`);
    };
    const schedule = () => (frame ||= requestAnimationFrame(align));
    align();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="glass-solid sticky top-0 z-10 -mx-6 -mt-6 mb-2 px-6 pt-6 pb-8 [mask-image:linear-gradient(to_bottom,#000_calc(100%-1.5rem),transparent)] sm:-mx-10 sm:-mt-10 sm:px-10 sm:pt-10 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8"
    >
      {children}
    </div>
  );
}
