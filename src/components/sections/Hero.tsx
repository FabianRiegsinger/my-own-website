import type { CV } from "@/content/types";
import { Bento, Section, Tile } from "./Section";

export function Hero({ cv, showFigure = false }: { cv: CV; showFigure?: boolean }) {
  return (
    <Section id="hero">
      <Bento>
        <Tile className="sm:p-10">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">{cv.profile.name}</h1>
          <p className="mt-4 text-xl text-muted sm:text-2xl">{cv.profile.headline}</p>
        </Tile>
        <Tile span="sm:col-span-4" className="bg-ink! text-white">
          <p className="text-lg font-medium sm:text-xl">
            Automotive engineer <span aria-hidden="true" className="text-glow">→</span>
            <span className="sr-only">to</span> agentic builder
          </p>
        </Tile>
        <Tile span="sm:col-span-2">
          <p className="text-sm text-muted">Based in</p>
          <p className="font-semibold">{cv.profile.location}</p>
        </Tile>
        {showFigure && (
          <Tile className="p-0! overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- static still, no optimization needed */}
            <img src="/fallback.webp" alt="Smooth white 3D mannequin figure standing on a reflective floor" className="mx-auto w-full max-w-sm" />
          </Tile>
        )}
      </Bento>
    </Section>
  );
}
