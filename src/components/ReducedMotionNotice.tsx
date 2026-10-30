"use client";

import { useEffect, useId, useState } from "react";
import type { Dictionary } from "@/i18n";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Bottom-right note shown while the browser asks for reduced motion, with an info toggle on how to turn animations back on. */
export function ReducedMotionNotice({ t }: { t: Dictionary }) {
  const [reduced, setReduced] = useState(false);
  const [open, setOpen] = useState(false);
  const infoId = useId();
  const m = t.reducedMotion;

  // The preference is only known in the browser, and can change while the page is open (follow the OS setting live).
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!reduced) return null;

  return (
    <aside
      role="status"
      className="fixed right-4 bottom-4 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-surface/90 p-4 pr-11 text-xs text-ink shadow-lg ring-1 ring-ink/10 backdrop-blur"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={infoId}
        aria-label={open ? m.hide : m.show}
        onClick={() => setOpen((o) => !o)}
        className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full font-serif text-sm font-semibold italic text-accent ring-1 ring-accent/40 hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent"
      >
        i
      </button>
      <p className="font-semibold">{m.title}</p>
      <p className="mt-1 text-muted">{m.body}</p>
      {open && (
        <div id={infoId} className="mt-3 border-t border-ink/10 pt-3 text-muted">
          <p className="mb-1.5 text-ink">{m.intro}</p>
          <ul className="space-y-1">
            <li><b className="text-ink">{m.macos}</b> {m.macosPath}</li>
            <li><b className="text-ink">{m.windows}</b> {m.windowsPath}</li>
            <li><b className="text-ink">{m.ios}</b> {m.iosPath}</li>
            <li><b className="text-ink">{m.android}</b> {m.androidPath}</li>
          </ul>
          <p className="mt-1.5">{m.reload}</p>
        </div>
      )}
    </aside>
  );
}
