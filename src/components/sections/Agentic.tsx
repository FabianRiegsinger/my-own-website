import type { CV } from "@/content/types";
import type { Project } from "@/lib/projects";
import { Eyebrow, Section, StickyHeader } from "./Section";

export function Agentic({ cv, projects }: { cv: CV; projects: Project[] }) {
  return (
    <Section id="agentic">
      <StickyHeader>
        <Eyebrow>Now</Eyebrow>
        <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Building with AI agents</h2>
      </StickyHeader>
      <div className="max-w-2xl">
        <p className="mt-4 text-xl leading-relaxed">{cv.agentic.intro}</p>
        <p className="mt-4 leading-relaxed text-muted">{cv.agentic.workUse}</p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tools">
          {cv.agentic.tools.map((t) => (
            <li key={t} className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-bg">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <h3 className="mt-12 text-2xl font-semibold">Side projects</h3>
      <ul className="mt-6 grid gap-3 2xl:grid-cols-2">
        {projects.map((p) => (
          <li key={p.name}>
            <a
              href={p.homepage ?? p.url}
              className="block h-full cursor-pointer rounded-2xl bg-surface/45 p-5 ring-1 ring-surface/70 transition-colors duration-200 hover:bg-surface/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <p className="text-lg font-semibold">{p.name}</p>
              <p className="mt-2 leading-relaxed text-muted">{p.tagline ?? p.description}</p>
              <p className="mt-4 text-sm text-muted">
                {[p.language, p.stars > 0 ? `★ ${p.stars}` : null].filter(Boolean).join(" · ")}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
