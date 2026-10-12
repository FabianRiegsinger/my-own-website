import type { CV } from "@/content/types";
import { Section } from "./Section";

export function Hero({ cv, showFigure = false }: { cv: CV; showFigure?: boolean }) {
  return (
    <Section id="hero">
      <div className="grid items-end gap-10 md:grid-cols-2">
        <div>
          <p className="mb-6 border-t-2 border-ink pt-4 text-sm font-semibold uppercase tracking-[0.2em]">Portfolio — {cv.profile.location}</p>
          <h1 className="text-5xl font-extrabold leading-[0.88] tracking-[-0.05em] sm:text-7xl lg:text-8xl">{cv.profile.name}</h1>
          <p className="mt-8 max-w-md text-xl leading-snug text-muted sm:text-2xl">{cv.profile.headline}</p>
          <p className="mt-10 text-lg font-semibold sm:text-xl">
            Automotive engineer <span aria-hidden="true" className="text-accent">→</span>
            <span className="sr-only">to</span> agentic builder
          </p>
        </div>
        {showFigure && (
          // eslint-disable-next-line @next/next/no-img-element -- static still, no optimization needed
          <img src="/fallback.webp" alt="Smooth white 3D mannequin figure standing in a white studio" className="mx-auto w-full max-w-sm" />
        )}
      </div>
    </Section>
  );
}
