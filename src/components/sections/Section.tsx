import type { CSSProperties, ReactNode } from "react";
import type { StationId } from "@/lib/scroll-map";

export const ACCENT = { mint: "#2ee6a6", lavender: "#b07cf7", cyan: "#22c7f0", coral: "#ff6b6b" } as const;

/** Thin neon zig-zag strokes in two corners, as in engineering banner art. */
function CornerStrokes() {
  const stroke = { fill: "none", stroke: "var(--accent)", strokeOpacity: 0.5, strokeWidth: 1.5 };
  return (
    <>
      <svg className="pointer-events-none absolute right-4 top-4 h-12 w-20" viewBox="0 0 80 48" aria-hidden="true">
        <polyline points="2,2 58,30 68,6 78,46" {...stroke} />
      </svg>
      <svg className="pointer-events-none absolute bottom-4 right-4 h-12 w-20" viewBox="0 0 80 48" aria-hidden="true">
        <polyline points="2,46 58,18 68,42 78,2" {...stroke} />
      </svg>
    </>
  );
}

/** One screen tall, same id as its 3D station; content sits in a banner card tinted by the section accent. */
export function Section({ id, accent = ACCENT.mint, children }: { id: StationId; accent?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex min-h-screen items-center px-4 py-24 sm:px-8" style={{ "--accent": accent } as CSSProperties}>
      <div className="banner mx-auto w-full max-w-6xl overflow-hidden p-6 sm:p-12 max-md:bg-navy/90">
        <CornerStrokes />
        <div className="relative">{children}</div>
      </div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.2em] text-(--accent)">{children}</p>;
}

export function Title({ children }: { children: ReactNode }) {
  return <h2 className="text-4xl font-black leading-tight sm:text-5xl">{children}</h2>;
}
