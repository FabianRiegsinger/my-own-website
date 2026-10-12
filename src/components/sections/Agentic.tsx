import type { CV } from "@/content/types";
import type { Project } from "@/lib/projects";
import { Bento, Eyebrow, Section, Tile, Title } from "./Section";

export function Agentic({ cv, projects }: { cv: CV; projects: Project[] }) {
  return (
    <Section id="agentic">
      <Eyebrow>Now</Eyebrow>
      <Title>Building with AI agents</Title>
      <Bento>
        <Tile span="sm:col-span-4" className="sm:p-8">
          <p className="text-xl leading-relaxed">{cv.agentic.intro}</p>
          <p className="mt-4 leading-relaxed text-muted">{cv.agentic.workUse}</p>
        </Tile>
        <Tile span="sm:col-span-2" className="bg-ink! text-white">
          <h3 className="text-sm text-white/70">Daily tools</h3>
          <ul className="mt-3 space-y-2" aria-label="Tools">
            {cv.agentic.tools.map((t) => (
              <li key={t} className="text-lg font-semibold">
                {t}
              </li>
            ))}
          </ul>
        </Tile>
        <h3 className="mt-6 text-xl font-semibold sm:col-span-6">Side projects</h3>
        {projects.map((p) => (
          <a
            key={p.name}
            data-tile
            href={p.homepage ?? p.url}
            className="tile block min-w-0 cursor-pointer transition-shadow duration-200 hover:shadow-[0_12px_32px_rgb(0_0_0/0.1)] sm:col-span-3"
          >
            <p className="text-lg font-semibold">
              {p.name} <span aria-hidden="true" className="text-accent">↗</span>
            </p>
            <p className="mt-2 leading-relaxed text-muted">{p.tagline ?? p.description}</p>
            <p className="mt-4 text-sm text-muted">{[p.language, p.stars > 0 ? `★ ${p.stars}` : null].filter(Boolean).join(" · ")}</p>
          </a>
        ))}
      </Bento>
    </Section>
  );
}
