import type { CV } from "@/content/types";
import { ACCENT, Section } from "./Section";

export function Hero({ cv, showFigure = false }: { cv: CV; showFigure?: boolean }) {
  return (
    <Section id="hero" accent={ACCENT.mint}>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-5xl font-black leading-[1.05] sm:text-7xl">{cv.profile.name}</h1>
          <p className="mt-4 text-lg text-muted sm:text-xl">{cv.profile.headline}</p>
          <p className="pill mt-8 px-5 py-2.5 text-base sm:text-lg">
            <span>
              Automotive engineer <span aria-hidden="true">→</span>
              <span className="sr-only">to</span> agentic builder
            </span>
          </p>
        </div>
        {showFigure && (
          // eslint-disable-next-line @next/next/no-img-element -- static still, no optimization needed
          <img src="/fallback.webp" alt="Glossy white 3D mannequin figure standing on a glowing wireframe floor" className="mx-auto w-full max-w-sm rounded-3xl" />
        )}
      </div>
    </Section>
  );
}
