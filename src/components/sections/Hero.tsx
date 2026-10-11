import type { CV } from "@/content/types";
import { Section } from "./Section";

export function Hero({ cv, showFigure = false }: { cv: CV; showFigure?: boolean }) {
  return (
    <Section id="hero">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">{cv.profile.name}</h1>
          <p className="mt-4 text-xl text-muted sm:text-2xl">{cv.profile.headline}</p>
          <p className="mt-8 text-lg font-medium sm:text-xl">
            Automotive engineer <span aria-hidden="true">→</span>
            <span className="sr-only">to</span> agentic builder
          </p>
        </div>
        {showFigure && (
          // eslint-disable-next-line @next/next/no-img-element -- static still, no optimization needed
          <img src="/fallback.webp" alt="Smooth white 3D mannequin figure standing on a reflective floor" className="mx-auto w-full max-w-sm rounded-3xl" />
        )}
      </div>
    </Section>
  );
}
