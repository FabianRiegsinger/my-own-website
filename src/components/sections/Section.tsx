import type { ReactNode } from "react";
import type { StationId } from "@/lib/scroll-map";
import { GlassPanel } from "./GlassPanel";

/** Shared section frame: one screen tall, same id as its 3D station. */
export function Section({ id, children, className = "" }: { id: StationId; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`flex min-h-screen snap-start items-center px-4 py-24 sm:px-8 lg:px-[3vw] ${className}`}>
      {/* Desktop: a glass panel in the left ~36% so the centred figure stays clear; smaller screens let it float over the figure. */}
      <GlassPanel>{children}</GlassPanel>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">{children}</p>;
}

/**
 * Panel header that sticks to the top of the screen while a panel taller than the screen scrolls past, so its
 * heading stays readable. Bleeds over the panel padding (p-6 / sm:p-10 / lg:p-8) with its own frosted backdrop.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 rounded-t-[2rem] bg-white/70 px-6 pt-6 pb-4 backdrop-blur-md sm:-mx-10 sm:-mt-10 sm:px-10 sm:pt-10 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8">
      {children}
    </div>
  );
}
