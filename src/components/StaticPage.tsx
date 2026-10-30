import type { CV } from "@/content/types";
import type { Dictionary } from "@/i18n";
import type { Project } from "@/lib/projects";
import { ActivePage } from "./ActivePage";
import { About } from "./sections/About";
import { Agentic } from "./sections/Agentic";
import { Contact } from "./sections/Contact";
import { Hero } from "./sections/Hero";
import { Launch } from "./sections/Launch";
import { Skills } from "./sections/Skills";
import { Timeline } from "./sections/Timeline";

export function Sections({ cv, projects, t, showFigure = false }: { cv: CV; projects: Project[]; t: Dictionary; showFigure?: boolean }) {
  return (
    <>
      <ActivePage />
      <Hero cv={cv} t={t} showFigure={showFigure} />
      <About cv={cv} t={t} />
      <Timeline cv={cv} t={t} />
      <Agentic cv={cv} projects={projects} t={t} />
      <Skills cv={cv} t={t} />
      <Launch cv={cv} t={t} />
      <Contact cv={cv} t={t} />
    </>
  );
}

export function StaticPage({ cv, projects, t }: { cv: CV; projects: Project[]; t: Dictionary }) {
  return (
    <main>
      <Sections cv={cv} projects={projects} t={t} showFigure />
    </main>
  );
}
