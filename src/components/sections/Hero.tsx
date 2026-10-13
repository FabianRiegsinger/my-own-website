import type { CV } from "@/content/types";
import { Section } from "./Section";

export function Hero({ cv, showFigure = false }: { cv: CV; showFigure?: boolean }) {
  return (
    <Section id="hero">
      <div>
        <div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">{cv.profile.name}</h1>
          <p className="mt-4 text-xl text-muted sm:text-2xl">{cv.profile.headline}</p>
          <p className="mt-8 text-xl font-semibold tracking-tight sm:text-2xl">
            Automotive engineer <span aria-hidden="true" className="text-accent">→</span>
            <span className="sr-only">to</span> agentic builder
          </p>
          <a
            href="#about"
            className="mt-8 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white/55 px-5 text-sm font-medium ring-1 ring-white/80 transition-colors duration-200 hover:bg-white/90"
          >
            See my story
            <svg viewBox="0 0 24 24" className="h-4 w-4 motion-safe:animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
        {showFigure && (
          // eslint-disable-next-line @next/next/no-img-element -- static still, no optimization needed
          <img src="/fallback.webp" alt="Memoji-style 3D avatar of Fabian with glasses, standing with hands on hips" className="fallback-figure mt-8 w-full max-w-xs rounded-3xl" />
        )}
      </div>
    </Section>
  );
}
