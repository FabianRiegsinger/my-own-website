import type { ReactNode } from "react";
import type { StationId } from "@/lib/scroll-map";

/** Shared section frame: one screen tall, same id as its 3D station. */
export function Section({ id, children, className = "" }: { id: StationId; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`flex min-h-screen items-center px-4 py-24 sm:px-8 ${className}`}>
      {/* Mobile: paper backdrop keeps text readable over the 3D figure. */}
      <div className="mx-auto w-full max-w-6xl max-md:bg-bg/90 max-md:p-5">{children}</div>
    </section>
  );
}

/** Hairline rule, red section numeral, small caps label. */
export function Eyebrow({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="mb-8 flex items-baseline gap-4 border-t-2 border-ink pt-4">
      <span data-numeral className="text-5xl font-bold leading-none tabular-nums tracking-tight text-accent">
        {String(n).padStart(2, "0")}
      </span>
      <span className="text-sm font-semibold uppercase tracking-[0.2em]">{children}</span>
    </div>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <h2 className="text-5xl font-extrabold leading-[0.92] tracking-[-0.04em] sm:text-7xl lg:text-8xl">{children}</h2>;
}
