import type { ReactNode } from "react";
import type { StationId } from "@/lib/scroll-map";

/** Shared section frame: one screen tall, same id as its 3D station. */
export function Section({ id, children, className = "" }: { id: StationId; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`flex min-h-screen items-center px-4 py-24 sm:px-8 lg:px-[3vw] ${className}`}>
      {/* Desktop: a glass panel in the left ~38% so the centred figure stays clear; smaller screens let it float over the figure. */}
      <div data-glass className="glass w-full p-6 sm:p-10 lg:max-w-[36vw] lg:p-8">
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">{children}</p>;
}
