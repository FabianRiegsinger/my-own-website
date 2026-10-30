import { ExperienceGate } from "@/components/ExperienceGate";
import { StaticPage } from "@/components/StaticPage";
import { cv } from "@/content/cv";
import { loadProjects } from "@/lib/projects-cache";

export default async function Home() {
  const projects = await loadProjects();
  return (
    <ExperienceGate cv={cv} projects={projects}>
      <StaticPage cv={cv} projects={projects} />
    </ExperienceGate>
  );
}
