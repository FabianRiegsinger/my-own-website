import type { CV } from "@/content/types";
import type { Project } from "@/lib/projects";
import { ActivePage } from "./ActivePage";
import { About } from "./sections/About";
import { Agentic } from "./sections/Agentic";
import { Contact } from "./sections/Contact";
import { Hero } from "./sections/Hero";
import { Launch } from "./sections/Launch";
import { Skills } from "./sections/Skills";
import { Timeline } from "./sections/Timeline";

export function Sections({ cv, projects, showFigure = false }: { cv: CV; projects: Project[]; showFigure?: boolean }) {
  return (
    <>
      <ActivePage />
      <Hero cv={cv} showFigure={showFigure} />
      <About cv={cv} />
      <Timeline cv={cv} />
      <Agentic cv={cv} projects={projects} />
      <Skills cv={cv} />
      <Launch cv={cv} />
      <Contact cv={cv} />
    </>
  );
}

export function StaticPage({ cv, projects }: { cv: CV; projects: Project[] }) {
  return (
    <main>
      <Sections cv={cv} projects={projects} showFigure />
    </main>
  );
}
