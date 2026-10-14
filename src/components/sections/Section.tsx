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

export { StickyHeader } from "./StickyHeader";
