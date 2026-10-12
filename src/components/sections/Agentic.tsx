import type { CV } from "@/content/types";
import type { Project } from "@/lib/projects";
import { Eyebrow, Section, Title } from "./Section";

export function Agentic({ cv, projects }: { cv: CV; projects: Project[] }) {
  return (
    <Section id="agentic">
      <div className="max-w-2xl">
        <Eyebrow n={4}>Now</Eyebrow>
        <Title>Building with AI agents</Title>
        <p className="mt-8 text-xl leading-snug">{cv.agentic.intro}</p>
        <p className="mt-4 leading-relaxed text-muted">{cv.agentic.workUse}</p>
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold uppercase tracking-wider" aria-label="Tools">
          {cv.agentic.tools.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <h3 className="mt-16 max-w-xl border-t-2 border-ink pt-4 text-sm font-semibold uppercase tracking-[0.2em]">Side projects</h3>
      <ul className="max-w-xl">
        {projects.map((p) => (
          <li key={p.name}>
            <a
              href={p.homepage ?? p.url}
              className="group grid cursor-pointer gap-1 border-b border-ink/25 py-6 transition-colors duration-200 hover:text-accent sm:grid-cols-[1fr_auto] sm:gap-6"
            >
              <div>
                <p className="text-2xl font-bold tracking-tight">
                  {p.name} <span aria-hidden="true">↗</span>
                </p>
                <p className="mt-2 leading-relaxed text-muted">{p.tagline ?? p.description}</p>
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                {[p.language, p.stars > 0 ? `★ ${p.stars}` : null].filter(Boolean).join(" · ")}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
