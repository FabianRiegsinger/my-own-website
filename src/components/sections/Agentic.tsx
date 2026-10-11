import type { CV } from "@/content/types";
import type { Project } from "@/lib/projects";
import { Eyebrow, Section, Title } from "./Section";

export function Agentic({ cv, projects }: { cv: CV; projects: Project[] }) {
  return (
    <Section id="agentic">
      <div className="max-w-2xl">
        <Eyebrow n="04">Now</Eyebrow>
        <Title>Building with AI agents</Title>
        <p className="mt-6 text-xl font-medium leading-snug">{cv.agentic.intro}</p>
        <p className="mt-4 leading-relaxed">{cv.agentic.workUse}</p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tools">
          {cv.agentic.tools.map((t) => (
            <li key={t} className="bg-ink px-3 py-1.5 font-mono text-sm font-bold uppercase text-signal">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <h3 className="mt-16 font-mono text-sm font-bold uppercase">↳ Side projects</h3>
      <ul className="mt-6 grid max-w-3xl gap-6 sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.name}>
            <a href={p.homepage ?? p.url} className="brutal brutal-press block h-full cursor-pointer bg-white p-5">
              <p className="text-xl font-bold">{p.name}</p>
              <p className="mt-2 leading-relaxed">{p.tagline ?? p.description}</p>
              <p className="mt-4 flex flex-wrap gap-2 font-mono text-xs font-bold uppercase">
                {p.language && <span className="border-2 border-ink bg-signal px-2 py-0.5">{p.language}</span>}
                {p.stars > 0 && <span className="border-2 border-ink px-2 py-0.5">★ {p.stars}</span>}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
