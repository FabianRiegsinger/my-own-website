import { ExperienceGate } from "@/components/ExperienceGate";
import { StaticPage } from "@/components/StaticPage";
import { getDictionary } from "@/i18n";
import { cvEn as cv } from "@/content/cv.en";
import { loadProjects } from "@/lib/projects-cache";

export default async function Home() {
  const projects = await loadProjects();
  return (
    <ExperienceGate cv={cv} projects={projects} t={getDictionary("en")}>
      <StaticPage cv={cv} projects={projects} t={getDictionary("en")} />
    </ExperienceGate>
  );
}
