import type { ReactNode } from "react";
import type { StationId } from "@/lib/scroll-map";

/** Shared section frame: one screen tall, same id as its 3D station. */
export function Section({ id, children, className = "" }: { id: StationId; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`flex min-h-screen items-center px-4 py-24 sm:px-8 ${className}`}>
      {/* Mobile: solid bordered panel keeps text readable over the 3D figure. */}
      <div className="mx-auto w-full max-w-6xl max-md:border-[3px] max-md:border-ink max-md:bg-bg max-md:p-5">{children}</div>
    </section>
  );
}

/** Black label bar, e.g. "[ 02 / CAREER ]". */
export function Eyebrow({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="mb-6 inline-block bg-ink px-3 py-1 font-mono text-sm font-bold uppercase tracking-wider text-signal">
      [ {n} / {children} ]
    </p>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <h2 className="text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">{children}</h2>;
}
