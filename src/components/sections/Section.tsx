import type { ReactNode } from "react";
import type { StationId } from "@/lib/scroll-map";

/** Shared section frame: one screen tall, same id as its 3D station. Tiles fill the left ~60% on desktop; the figure owns the rest. */
export function Section({ id, children, className = "" }: { id: StationId; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`flex min-h-screen items-center px-4 py-24 sm:px-8 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="md:max-w-[60%]">{children}</div>
      </div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-sm font-semibold text-accent">{children}</p>;
}

export function Title({ children }: { children: ReactNode }) {
  return <h2 className="mb-6 text-4xl font-semibold tracking-tight sm:text-5xl">{children}</h2>;
}

/** Bento grid: 6 columns from sm up, tiles choose their span. */
export function Bento({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-6">{children}</div>;
}

export function Tile({ span = "sm:col-span-6", className = "", children }: { span?: string; className?: string; children: ReactNode }) {
  return (
    <div data-tile className={`tile min-w-0 ${span} ${className}`}>
      {children}
    </div>
  );
}
