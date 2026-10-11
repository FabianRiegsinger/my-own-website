import type { CV } from "@/content/types";
import type { Project } from "@/lib/projects";
import { ACCENT, Eyebrow, Section, Title } from "./Section";

export function Agentic({ cv, projects }: { cv: CV; projects: Project[] }) {
  return (
    <Section id="agentic" accent={ACCENT.coral}>
      <div className="max-w-2xl">
        <Eyebrow>Now</Eyebrow>
        <Title>Building with AI agents</Title>
        <p className="mt-6 text-xl font-semibold leading-relaxed">{cv.agentic.intro}</p>
        <p className="mt-4 leading-relaxed text-muted">{cv.agentic.workUse}</p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tools">
          {cv.agentic.tools.map((t) => (
            <li key={t} className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold ring-1 ring-(--accent)/50">
              {t}
            </li>
          ))}
        </ul>
      </div>
      <h3 className="mt-16 text-2xl font-extrabold">Side projects</h3>
      <ul className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.name}>
            <a
              href={p.homepage ?? p.url}
              className="block h-full cursor-pointer rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:ring-(--accent)/60"
            >
              <p className="text-lg font-extrabold">{p.name}</p>
              <p className="mt-2 leading-relaxed text-muted">{p.tagline ?? p.description}</p>
              <p className="mt-4 text-sm font-bold text-(--accent)">
                {[p.language, p.stars > 0 ? `★ ${p.stars}` : null].filter(Boolean).join(" · ")}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
