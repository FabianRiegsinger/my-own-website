"use client";

import { useEffect } from "react";
import { activeSection } from "@/lib/active-page";

/** Tags <html data-page="…"> with the page being read, so CSS can tint the page per section (globals.css). */
export function ActivePage() {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = [...document.querySelectorAll<HTMLElement>("main section[id]")].map((s) => ({
        id: s.id,
        top: s.getBoundingClientRect().top + window.scrollY,
        height: s.offsetHeight,
      }));
      const id = activeSection(window.scrollY + window.innerHeight / 2, sections);
      if (id && document.documentElement.dataset.page !== id) document.documentElement.dataset.page = id;
    };
    const schedule = () => (frame ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return null;
}
