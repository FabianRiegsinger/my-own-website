import type { ReactNode } from "react";
import type { StationId } from "@/lib/scroll-map";

/** Shared section frame: one screen tall, same id as its 3D station. */
export function Section({ id, children, className = "" }: { id: StationId; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`flex min-h-screen items-center px-4 py-24 sm:px-8 ${className}`}>
      {/* Mobile: frosted backdrop keeps text readable over the 3D figure. */}
      <div className="mx-auto w-full max-w-6xl max-md:rounded-3xl max-md:bg-bg/80 max-md:p-5 max-md:backdrop-blur-sm">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">{children}</p>;
}
