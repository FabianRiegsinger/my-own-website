import type { CV } from "@/content/types";
import type { Project } from "@/lib/projects";
import { About } from "./sections/About";
import { Agentic } from "./sections/Agentic";
import { Contact } from "./sections/Contact";
import { Hero } from "./sections/Hero";
import { Skills } from "./sections/Skills";
import { Timeline } from "./sections/Timeline";

export function Sections({ cv, projects, showFigure = false }: { cv: CV; projects: Project[]; showFigure?: boolean }) {
  return (
    <>
      <Hero cv={cv} showFigure={showFigure} />
      <About cv={cv} />
      <Timeline cv={cv} />
      <Skills cv={cv} />
      <Agentic cv={cv} projects={projects} />
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
