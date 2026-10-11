import { StaticPage } from "@/components/StaticPage";
import { cv } from "@/content/cv";
import { loadProjects } from "@/lib/projects-cache";

export default async function Home() {
  const projects = await loadProjects();
  return <StaticPage cv={cv} projects={projects} />;
}
