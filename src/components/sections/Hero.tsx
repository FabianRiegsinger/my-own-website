import type { CV } from "@/content/types";
import { Section } from "./Section";

export function Hero({ cv, showFigure = false }: { cv: CV; showFigure?: boolean }) {
  return (
    <Section id="hero">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <h1 className="text-6xl font-bold uppercase leading-[0.9] tracking-tighter sm:text-8xl">{cv.profile.name}</h1>
          <p className="mt-6 font-mono text-base uppercase sm:text-lg">{cv.profile.headline}</p>
          <p className="brutal mt-8 inline-block bg-signal px-4 py-2 text-lg font-bold uppercase sm:text-xl">
            Automotive engineer <span aria-hidden="true">→</span>
            <span className="sr-only">to</span> agentic builder
          </p>
        </div>
        {showFigure && (
          // eslint-disable-next-line @next/next/no-img-element -- static still, no optimization needed
          <img src="/fallback.webp" alt="Smooth white 3D mannequin figure standing on a gridded floor" className="brutal mx-auto w-full max-w-sm bg-white" />
        )}
      </div>
    </Section>
  );
}
